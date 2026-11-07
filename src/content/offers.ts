import { AssetOffer } from '../engine/content';

export const offers: AssetOffer[] = [
  // ---- Homes ----
  { id: 'home.studio', kind: 'home', name: 'Studio Flat', icon: '🏢', blurb: 'Small, central, yours.', price: 95000, minAge: 18, mean: 0.03, sd: 0.05, upkeep: 0.012, financeable: true, joy: 0.5 },
  { id: 'home.house', kind: 'home', name: 'Family House', icon: '🏡', blurb: 'A garden and a spare room.', price: 320000, minAge: 21, mean: 0.035, sd: 0.06, upkeep: 0.013, financeable: true, joy: 1 },
  { id: 'home.villa', kind: 'home', name: 'Luxury Villa', icon: '🏰', blurb: 'Pool, gates, staff.', price: 1_400_000, minAge: 25, mean: 0.04, sd: 0.08, upkeep: 0.014, financeable: true, joy: 2 },
  { id: 'home.rental', kind: 'home', name: 'Rental Property', icon: '🏘️', blurb: 'Someone else pays your mortgage.', price: 210000, minAge: 21, mean: 0.03, sd: 0.06, upkeep: 0.015, financeable: true, yield: 0.05 },

  // ---- Vehicles ----
  { id: 'car.used', kind: 'vehicle', name: 'Used Hatchback', icon: '🚗', blurb: 'Gets you there. Mostly.', price: 9000, minAge: 17, mean: -0.12, sd: 0.03, upkeep: 0.08, financeable: false, joy: 0.3 },
  { id: 'car.sedan', kind: 'vehicle', name: 'New Sedan', icon: '🚙', blurb: 'Reliable, shiny, boring.', price: 32000, minAge: 18, mean: -0.13, sd: 0.03, upkeep: 0.04, financeable: true, joy: 0.7 },
  { id: 'car.sports', kind: 'vehicle', name: 'Sports Car', icon: '🏎️', blurb: 'Turns heads, burns cash.', price: 95000, minAge: 21, mean: -0.1, sd: 0.04, upkeep: 0.03, financeable: true, joy: 1.5 },
  { id: 'car.super', kind: 'vehicle', name: 'Supercar', icon: '🚀', blurb: 'Why drive anything else?', price: 320000, minAge: 25, mean: -0.04, sd: 0.06, upkeep: 0.03, financeable: true, joy: 3 },

  // ---- Investments (divisible) ----
  { id: 'inv.savings', kind: 'investment', name: 'Savings Account', icon: '🏦', blurb: 'Safe. Slow. Boring.', price: 0, minAge: 10, mean: 0.03, sd: 0.002, upkeep: 0, divisible: true },
  { id: 'inv.bonds', kind: 'investment', name: 'Government Bonds', icon: '📜', blurb: 'Steady and sensible.', price: 0, minAge: 18, mean: 0.045, sd: 0.02, upkeep: 0, divisible: true },
  { id: 'inv.index', kind: 'investment', name: 'Index Fund', icon: '📈', blurb: 'Own a slice of everything.', price: 0, minAge: 18, mean: 0.075, sd: 0.15, upkeep: 0.002, divisible: true },
  { id: 'inv.tech', kind: 'investment', name: 'Tech Stocks', icon: '💾', blurb: 'Higher highs, lower lows.', price: 0, minAge: 18, mean: 0.11, sd: 0.3, upkeep: 0.003, divisible: true },
  { id: 'inv.gold', kind: 'investment', name: 'Gold', icon: '🥇', blurb: 'Shiny insurance.', price: 0, minAge: 18, mean: 0.04, sd: 0.12, upkeep: 0.004, divisible: true },
  { id: 'inv.crypto', kind: 'investment', name: 'Cryptocurrency', icon: '🪙', blurb: 'To the moon. Or to zero.', price: 0, minAge: 18, mean: 0.2, sd: 0.85, upkeep: 0, divisible: true },

  // ---- Businesses ----
  { id: 'biz.foodtruck', kind: 'business', name: 'Food Truck', icon: '🚚', blurb: 'Tacos on wheels.', price: 35000, minAge: 18, mean: 0.08, sd: 0.3, upkeep: 0.05, yield: 0.1, joy: 0.5 },
  { id: 'biz.cafe', kind: 'business', name: 'Coffee Shop', icon: '☕', blurb: 'Regulars and razor margins.', price: 90000, minAge: 21, mean: 0.06, sd: 0.25, upkeep: 0.05, yield: 0.09, financeable: true, joy: 0.8 },
  { id: 'biz.startup', kind: 'business', name: 'Tech Startup', icon: '🦄', blurb: 'Unicorn or zero.', price: 250000, minAge: 21, mean: 0.18, sd: 0.8, upkeep: 0.02, yield: 0, financeable: false, joy: 1 },
  { id: 'biz.farm', kind: 'business', name: 'Family Farm', icon: '🚜', blurb: 'Land, sweat, seasons.', price: 400000, minAge: 25, mean: 0.04, sd: 0.1, upkeep: 0.04, yield: 0.06, financeable: true, joy: 1 },
];
