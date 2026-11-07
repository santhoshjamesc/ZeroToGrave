import { createRng } from '../../utils/rng';
import { accept, reject, ReduceResult } from '../helpers';
import { checkAchievements } from '../achievements';
import { careerYear } from '../careers';
import { GameContent } from '../content';
import { crimeYear } from '../crime';
import { educationYear } from '../education';
import { drawEvents, findChoice, resolveChoice } from '../events';
import { financeYear } from '../finance';
import { healthYear } from '../health';
import { focusAreaBlocker } from '../ageGates';
import { ACTIONS_PER_YEAR } from '../migrate';
import { relationshipsYear } from '../romance';
import {
  emptyAllocation,
  focusBudget,
  focusOutcome,
  totalAllocated,
} from '../focus';
import { appendLog, milestoneFor } from '../lifeLog';
import { rollDeath, worstCondition } from '../mortality';
import { agingDrift, applyStatDeltas, diffStats, energyRecovery } from '../stats';
import { traitMods } from '../traits';
import { FOCUS_AREAS, FocusArea, GameState, Stats, STAT_KEYS } from '../types';

/** AGING must last at least this long (game-clock ms) and cannot be shortened by input. */
export const MIN_AGING_MS = 2000;

export type YearAction =
  | { type: 'ACK_BRIEFING' }
  | { type: 'SET_FOCUS'; area: FocusArea; points: number }
  | { type: 'BANK_REMAINING_AS_REST' }
  | { type: 'CONFIRM_FOCUS' }
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceId: string }
  | { type: 'PROCEED_TO_COMMIT' }
  | { type: 'CONFIRM_AGE_UP'; now: number }
  | { type: 'FINISH_AGING'; now: number };

export type { ReduceResult } from '../helpers';

const withPhase = (s: GameState, patch: Partial<GameState['yearLoop']>): GameState => ({
  ...s,
  yearLoop: { ...s.yearLoop, ...patch },
});

/**
 * Year Loop reducer. Pure: all randomness from the state's RNG stream, all time from actions.
 * Out-of-order or gate-violating actions are rejected (never skipped, never thrown).
 */
export function reduceYear(state: GameState, action: YearAction, pools: GameContent): ReduceResult {
  const loop = state.yearLoop;

  if (loop.phase === 'DEAD') return reject(state, 'Character is dead');

  switch (action.type) {
    case 'ACK_BRIEFING': {
      if (loop.phase !== 'BRIEFING') return reject(state, `ACK_BRIEFING not allowed in ${loop.phase}`);
      return accept(withPhase(state, { phase: 'FOCUS' }));
    }

    case 'SET_FOCUS': {
      if (loop.phase !== 'FOCUS') return reject(state, `SET_FOCUS not allowed in ${loop.phase}`);
      if (!FOCUS_AREAS.includes(action.area)) return reject(state, `Unknown focus area`);
      if (!Number.isInteger(action.points) || action.points < 0) {
        return reject(state, 'Points must be a non-negative integer');
      }
      const blocked = action.points > 0 ? focusAreaBlocker(state.character, action.area) : null;
      if (blocked) return reject(state, blocked);
      const next = { ...loop.allocation, [action.area]: action.points };
      if (totalAllocated(next) > loop.focusBudget) return reject(state, 'Exceeds focus budget');
      return accept(withPhase(state, { allocation: next }));
    }

    case 'BANK_REMAINING_AS_REST': {
      if (loop.phase !== 'FOCUS') return reject(state, `Not allowed in ${loop.phase}`);
      const left = loop.focusBudget - totalAllocated(loop.allocation);
      return accept(
        withPhase(state, { allocation: { ...loop.allocation, rest: loop.allocation.rest + left } }),
      );
    }

    case 'CONFIRM_FOCUS': {
      if (loop.phase !== 'FOCUS') return reject(state, `CONFIRM_FOCUS not allowed in ${loop.phase}`);
      if (totalAllocated(loop.allocation) !== loop.focusBudget) {
        return reject(state, 'All Focus Points must be allocated (or banked as Rest)');
      }
      const rng = createRng(state.rngState);
      const pendingEvents = drawEvents(state.character, pools, rng);
      return accept({ ...withPhase(state, { phase: 'DECISIONS', pendingEvents }), rngState: rng.state() });
    }

    case 'RESOLVE_EVENT': {
      if (loop.phase !== 'DECISIONS') return reject(state, `RESOLVE_EVENT not allowed in ${loop.phase}`);
      const pending = loop.pendingEvents.find((e) => e.eventId === action.eventId);
      if (!pending) return reject(state, 'Unknown event');
      if (pending.resolvedChoiceId !== null) return reject(state, 'Event already resolved');
      const choice = findChoice(pending.def, action.choiceId);
      if (!choice) return reject(state, 'Unknown choice');
      const pendingEvents = loop.pendingEvents.map((e) =>
        e.eventId === action.eventId ? { ...e, resolvedChoiceId: choice.id } : e,
      );
      const rng = createRng(state.rngState);
      const resolved = resolveChoice(state.character, choice, rng);
      // Remember when we saw this event so it can cool down (or never repeat).
      const character = { ...resolved, flags: { ...resolved.flags, [`seen.${pending.def.id}`]: resolved.age } };
      return accept({ ...withPhase(state, { pendingEvents }), character, rngState: rng.state() });
    }

    case 'PROCEED_TO_COMMIT': {
      if (loop.phase !== 'DECISIONS') return reject(state, `Not allowed in ${loop.phase}`);
      const open = loop.pendingEvents.some((e) => e.def.mandatory && e.resolvedChoiceId === null);
      if (open) return reject(state, 'Mandatory events remain unresolved');
      return accept(withPhase(state, { phase: 'COMMIT' }));
    }

    case 'CONFIRM_AGE_UP': {
      if (loop.phase !== 'COMMIT') return reject(state, `CONFIRM_AGE_UP not allowed in ${loop.phase}`);
      return accept(withPhase(state, { phase: 'AGING', agingStartedAt: action.now }));
    }

    case 'FINISH_AGING': {
      if (loop.phase !== 'AGING' || loop.agingStartedAt === null) {
        return reject(state, `FINISH_AGING not allowed in ${loop.phase}`);
      }
      if (action.now - loop.agingStartedAt < MIN_AGING_MS) {
        return reject(state, 'Aging transition has not finished');
      }
      return accept(finishYear(state, pools));
    }
  }
}

function addDeltas(a: Partial<Stats>, b: Partial<Stats>): Partial<Stats> {
  const out: Partial<Stats> = { ...a };
  for (const k of STAT_KEYS) if (b[k]) out[k] = (out[k] ?? 0) + (b[k] ?? 0);
  return out;
}

function finishYear(state: GameState, content: GameContent): GameState {
  const loop = state.yearLoop;
  const before = state.character.stats;
  const rng = createRng(state.rngState);
  const notes: string[] = [];

  const mods = traitMods(state.character, content.traits);
  const focus = focusOutcome(loop.allocation, mods.focus);
  const newAge = state.character.age + 1;
  let character = state.character;
  const recovered = applyStatDeltas(before, { energy: energyRecovery(before.energy) });
  const stats = applyStatDeltas(
    applyStatDeltas(recovered, focus.stats),
    addDeltas(agingDrift(character.age), mods.drift),
  );
  character = { ...character, stats, workXp: character.workXp + focus.workXp };

  // Life systems, in order: school → work → money → health → people → law.
  character = educationYear(character, loop.allocation.study, newAge, rng, notes);
  character = careerYear(character, loop.allocation.work, newAge, rng, notes);
  const fin = financeYear(character, focus.money, content, rng, notes);
  character = fin.character;
  character = healthYear(character, content, rng, notes);
  character = relationshipsYear(character, loop.allocation, content, rng, notes);
  character = crimeYear(character, notes);

  const summary = {
    age: character.age,
    statDeltas: diffStats(before, character.stats),
    choices: loop.pendingEvents.flatMap((e) =>
      e.resolvedChoiceId ? [{ eventId: e.eventId, choiceId: e.resolvedChoiceId }] : [],
    ),
    allocation: loop.allocation,
    cashflow: { income: fin.income, expenses: fin.expenses, net: fin.income - fin.expenses },
    notes,
  };

  const death = rollDeath(character, rng);
  const eventLog = loop.pendingEvents.flatMap((e) => {
    const ch = e.def.choices.find((x) => x.id === e.resolvedChoiceId);
    return ch ? [{ age: character.age, icon: '📖', text: `${e.def.title}: ${ch.label}.` }] : [];
  });
  character = {
    ...character,
    age: newAge,
    relationships: character.relationships.map((r) =>
      r.age === undefined || r.deceased ? r : { ...r, age: r.age + 1 },
    ),
  };
  character = appendLog(character, eventLog);
  const milestone = milestoneFor(character.age);
  if (milestone && !death) character = appendLog(character, [milestone]);
  const common = { ...state, rngState: rng.state(), prompt: null };

  if (death) {
    const detail =
      death === 'illness'
        ? (worstCondition(character)?.name.toLowerCase() ?? 'illness')
        : death === 'violence'
          ? 'prison violence'
          : death;
    character = appendLog(character, [
      { age: character.age - 1, icon: '🪦', text: `Died of ${detail}.` },
    ]);
    return checkAchievements(
      {
        ...common,
        character: { ...character, alive: false, causeOfDeath: death, causeDetail: detail },
        yearLoop: { ...loop, phase: 'DEAD', agingStartedAt: null, history: [...loop.history, summary] },
      },
      content,
    );
  }

  return checkAchievements(
    {
      ...common,
      character,
      yearLoop: {
        phase: 'BRIEFING',
        year: loop.year + 1,
        focusBudget: focusBudget(character),
        actionsLeft: ACTIONS_PER_YEAR,
        allocation: emptyAllocation(),
        pendingEvents: [],
        agingStartedAt: null,
        history: [...loop.history, summary],
      },
    },
    content,
  );
}
