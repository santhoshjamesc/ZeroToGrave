import { Rng } from '../utils/rng';
import { AssetOffer, GameContent } from './content';
import { tooYoung } from './ageGates';
import { pocketMoney } from './traits';
import { accept, clamp, fmtMoney, gaussian, logIt, reject, ReduceResult } from './helpers';
import { Asset, Character, GameState } from './types';

export const TAX_RATE = 0.2;
export const DEBT_INTEREST = 0.06;
export const LIVING_COST = 14000;
export const LIVING_COST_OWNER = 7000;
const MAX_ASSETS = 24;
const SALE_FEE: Record<Asset['kind'], number> = { home: 0.06, vehicle: 0.03, investment: 0.005, business: 0.1 };

export function ownsHome(c: Character): boolean {
  return c.assets.some((a) => a.kind === 'home');
}

export function offerById(content: GameContent, id: string): AssetOffer | undefined {
  return content.offers.find((o) => o.id === id);
}

export function buyBlocker(c: Character, offer: AssetOffer, financed: boolean): string | null {
  if (c.crime.prison) return 'Not from prison.';
  if (c.age < offer.minAge) return tooYoung(c.age, offer.minAge, offer.name.toLowerCase());
  if (c.assets.length >= MAX_ASSETS) return 'You own too many things already.';
  if (financed) {
    if (!offer.financeable) return 'Cannot be financed.';
    if (!c.job && !c.retired) return 'The bank wants proof of income.';
    if (c.money < offer.price * 0.2) return `Needs a ${fmtMoney(offer.price * 0.2)} down payment.`;
    if (c.debt + offer.price * 0.8 > Math.max(40000, (c.job?.salary ?? 20000) * 6)) return 'The bank says you are over-borrowed.';
  } else if (c.money < offer.price) {
    return `Costs ${fmtMoney(offer.price)}.`;
  }
  return null;
}

export function buy(state: GameState, content: GameContent, offerId: string, financed: boolean): ReduceResult {
  const c = state.character;
  const offer = offerById(content, offerId);
  if (!offer) return reject(state, 'Unknown item');
  if (offer.divisible) return reject(state, 'Use invest for this one.');
  const blocker = buyBlocker(c, offer, financed);
  if (blocker) return reject(state, blocker);
  const asset: Asset = {
    id: `asset-${offer.id}-${c.age}-${c.assets.length}`,
    offerId: offer.id,
    name: offer.name,
    icon: offer.icon,
    kind: offer.kind,
    value: offer.price,
    cost: offer.price,
    boughtAge: c.age,
  };
  const down = financed ? Math.round(offer.price * 0.2) : offer.price;
  const next: Character = {
    ...c,
    money: c.money - down,
    debt: c.debt + (financed ? offer.price - down : 0),
    assets: [...c.assets, asset],
    stats: { ...c.stats, happiness: clamp(c.stats.happiness + (offer.joy ?? 0) * 2, 0, 100) },
  };
  return accept({
    ...state,
    character: logIt(next, offer.icon, `Bought ${offer.name} for ${fmtMoney(offer.price)}${financed ? ' (financed)' : ''}.`),
  });
}

export function invest(state: GameState, content: GameContent, offerId: string, amount: number): ReduceResult {
  const c = state.character;
  const offer = offerById(content, offerId);
  if (!offer || !offer.divisible) return reject(state, 'Not an investment');
  if (!Number.isFinite(amount) || amount <= 0) return reject(state, 'Enter an amount');
  if (c.crime.prison) return reject(state, 'Not from prison.');
  if (c.age < offer.minAge) return reject(state, tooYoung(c.age, offer.minAge, offer.name.toLowerCase()));
  const sum = Math.floor(amount);
  if (sum > c.money) return reject(state, `You only have ${fmtMoney(c.money)}.`);
  const existing = c.assets.find((a) => a.offerId === offer.id);
  const assets = existing
    ? c.assets.map((a) => (a === existing ? { ...a, value: a.value + sum, cost: a.cost + sum } : a))
    : [...c.assets, { id: `asset-${offer.id}`, offerId: offer.id, name: offer.name, icon: offer.icon, kind: offer.kind, value: sum, cost: sum, boughtAge: c.age }];
  return accept({
    ...state,
    character: logIt({ ...c, money: c.money - sum, assets }, offer.icon, `Put ${fmtMoney(sum)} into ${offer.name}.`),
  });
}

export function sell(state: GameState, assetId: string, amount?: number): ReduceResult {
  const c = state.character;
  const a = c.assets.find((x) => x.id === assetId);
  if (!a) return reject(state, 'Unknown asset');
  const partial = amount !== undefined && a.kind === 'investment' && amount < a.value;
  const gross = partial ? Math.max(1, Math.floor(amount)) : a.value;
  const proceeds = Math.round(gross * (1 - SALE_FEE[a.kind]));
  const assets = partial
    ? c.assets.map((x) => (x === a ? { ...x, value: x.value - gross, cost: Math.round(x.cost * (1 - gross / x.value)) } : x))
    : c.assets.filter((x) => x !== a);
  return accept({
    ...state,
    character: logIt({ ...c, money: c.money + proceeds, assets }, '🏷️', `Sold ${partial ? 'part of ' : ''}${a.name} for ${fmtMoney(proceeds)}.`),
  });
}

export function repayDebt(state: GameState, amount: number): ReduceResult {
  const c = state.character;
  const pay = Math.floor(Math.min(amount, c.money, c.debt));
  if (!(pay > 0)) return reject(state, c.debt <= 0 ? 'You owe nothing.' : 'No cash to repay with.');
  return accept({
    ...state,
    character: logIt({ ...c, money: c.money - pay, debt: c.debt - pay }, '🏦', `Repaid ${fmtMoney(pay)} of debt.`),
  });
}

export interface YearFinance {
  character: Character;
  income: number;
  expenses: number;
}

/** Year-end money: pay, tax, bills, pension, asset returns and debt interest. */
export function financeYear(
  c: Character,
  sideMoney: number,
  content: GameContent,
  rng: Rng,
  notes: string[],
): YearFinance {
  const age = c.age;
  const salary = c.job?.salary ?? 0;
  const tax = salary > 12000 ? Math.round(salary * TAX_RATE) : 0;
  const pension = c.retired || age >= 67 ? Number(c.flags.pension ?? 12000) : 0;
  let income = salary - tax + pension + sideMoney + pocketMoney(c);

  // Assets: random returns, running costs, fixed yields.
  let joy = 0;
  const assets: Asset[] = [];
  let upkeep = 0;
  for (const a of c.assets) {
    const offer = offerById(content, a.offerId);
    if (!offer) {
      assets.push(a);
      continue;
    }
    const ret = clamp(offer.mean + offer.sd * gaussian(rng), -0.92, 3);
    const value = Math.max(0, Math.round(a.value * (1 + ret)));
    upkeep += Math.round(value * offer.upkeep);
    income += Math.round(value * (offer.yield ?? 0));
    joy += offer.joy ?? 0;
    if (value < a.value * 0.5 && a.value > 5000) notes.push(`${a.name} lost ${Math.round((1 - value / a.value) * 100)}%`);
    if (value > a.value * 1.4 && a.value > 5000) notes.push(`${a.name} surged ${Math.round((value / a.value - 1) * 100)}%`);
    assets.push({ ...a, value });
  }

  // Bills.
  let living = 0;
  if (age >= 18) {
    const parentsHelp = age < 22 && !c.job && c.relationships.some((r) => r.kind === 'parent' && !r.deceased);
    living = parentsHelp ? 0 : ownsHome(c) ? LIVING_COST_OWNER : LIVING_COST;
    if (c.crime.prison) living = 0;
  }
  const kids = c.relationships.filter((r) => r.kind === 'child' && !r.deceased && (r.age ?? 0) < 18).length;
  const kidCost = kids * 5000;
  const interest = Math.round(c.debt * DEBT_INTEREST);
  let expenses = living + kidCost + upkeep + interest;

  // Auto minimum payment on debt, then settle the year.
  let money = c.money + income - expenses;
  let debt = c.debt + interest;
  const minPay = Math.min(debt, Math.round(debt * 0.1));
  if (money > minPay && minPay > 0) {
    money -= minPay;
    debt -= minPay;
    expenses += minPay;
  }
  if (money < 0) {
    debt += -money;
    money = 0;
    if (living > 0) notes.push('Ran out of money; borrowed to cover bills');
  }
  const happiness = clamp(c.stats.happiness + clamp(joy, 0, 6) - (debt > 50000 ? 4 : debt > 5000 ? 1 : 0), 0, 100);
  return {
    income: Math.round(income),
    expenses: Math.round(expenses),
    character: { ...c, money: Math.round(money), debt: Math.round(debt), assets, stats: { ...c.stats, happiness } },
  };
}
