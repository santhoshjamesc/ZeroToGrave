import { GameContent } from '../engine/content';
import { IdentityPools } from '../engine/identity';
import { fallbackEvents } from './fallbackEvents';
import { countries, eyeColors, hairColors, hairStylesByGender, skinTones, zodiacs } from './identityPools';
import { activities, crimes } from './activities';
import { achievements } from './achievements';
import { careers, majors } from './careers';
import { moreCareers, moreMajors } from './moreCareers';
import { moreCountries } from './moreCountries';
import { diseases } from './diseases';
import { extraEvents } from './extraEvents';
import { childEvents } from './childEvents';
import { teenEvents } from './teenEvents';
import { adultEvents } from './adultEvents';
import { seniorEvents } from './seniorEvents';
import { lifeEvents } from './lifeEvents';
import { offers } from './offers';
import { moreActivities } from './moreActivities';
import { moreDiseases } from './moreDiseases';
import { moreAchievements } from './moreAchievements';
import { traits } from './traits';

export const identityPools: IdentityPools = {
  countries: [...countries, ...moreCountries],
  skinTones,
  hairColors,
  eyeColors,
  hairStylesByGender,
  zodiacs,
  traits,
};

/** Everything the engine needs. Other content lists are filled in by their own modules. */
export const gameContent: GameContent = {
  events: [...lifeEvents, ...extraEvents, ...childEvents, ...teenEvents, ...adultEvents, ...seniorEvents],
  fallback: fallbackEvents,
  careers: [...careers, ...moreCareers],
  majors: [...majors, ...moreMajors],
  diseases: [...diseases, ...moreDiseases],
  activities: [...activities, ...moreActivities],
  crimes,
  offers,
  achievements: [...achievements, ...moreAchievements],
  identity: identityPools,
  traits,
};

/** Back-compat alias: the reducer takes a full GameContent (which extends EventPools). */
export const eventPools: GameContent = gameContent;
