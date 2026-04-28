import type { Facing } from './MapData';

export type CropId = 'turnip' | 'wheat' | 'strawberry';
export type SeedItem = 'turnipSeed' | 'wheatSeed' | 'strawberrySeed';
export type CropItem = 'turnipCrop' | 'wheatCrop' | 'strawberryCrop';

export type PlotSave = {
  cropId: CropId | null;
  stage: number;
  wateredToday: boolean;
};

export type Inventory = Record<SeedItem | CropItem, number>;

export type OrderSave = {
  id: string;
  cropId: CropId;
  amount: number;
  rewardGold: number;
  rewardReputation: number;
  completed: boolean;
};

export type UpgradeSave = {
  wateringCanLevel: number;
  backpackLevel: number;
  shoeLevel: number;
};

export type FriendshipSave = {
  seedSeller: number;
};

export type UnlockSave = {
  wheat: boolean;
  strawberry: boolean;
  forestPath: boolean;
};

export type GameSave = {
  version: 2;
  day: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  inventory: Inventory;
  player: {
    x: number;
    y: number;
    facing: Facing;
  };
  plots: Record<string, PlotSave>;
  orders: OrderSave[];
  upgrades: UpgradeSave;
  friendship: FriendshipSave;
  unlocks: UnlockSave;
};
