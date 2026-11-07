import { GameContent } from '../engine/content';
import { IdentityPools } from '../engine/identity';
import { fallbackEvents } from './fallbackEvents';
import { countries, eyeColors, hairColors, hairStylesByGender, skinTones, zodiacs } from './identityPools';
import { activities, crimes } from './activities';
import { achievements } from './achievements';
import { careers, majors } from './careers';
import { diseases } from './diseases';
import { extraEvents } from './extraEvents';
import { lifeEvents } from './lifeEvents';
import { offers } from './offers';

export const identityPools: IdentityPools = {
  countries,
  skinTones,
  hairColors,
  eyeColors,
  hairStylesByGender,
  zodiacs,
};

/** Everything the engine needs. Other content lists are filled in by their own modules. */
export const gameContent: GameContent = {
  events: [...lifeEvents, ...extraEvents],
  fallback: fallbackEvents,
  careers,
  majors,
  diseases,
  activities,
  crimes,
  offers,
  achievements,
  identity: identityPools,
};

/** Back-compat alias: the reducer takes a full GameContent (which extends EventPools). */
export const eventPools: GameContent = gameContent;
