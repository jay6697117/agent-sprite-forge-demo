import type { Inventory } from '../types/GameState';

export const StartingInventory: Inventory = {
  turnipSeed: 5,
  wheatSeed: 2,
  strawberrySeed: 0,
  turnipCrop: 0,
  wheatCrop: 0,
  strawberryCrop: 0
};

export const StartingStats = {
  gold: 30,
  energy: 24,
  maxEnergy: 24,
  reputation: 0
} as const;

export const UpgradeCosts = {
  wateringCan: [0, 30, 60],
  backpack: [0, 40, 80],
  shoes: [0, 45, 90]
} as const;
