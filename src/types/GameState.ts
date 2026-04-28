import type { Facing } from './MapData';

export type CropId = 'turnip';

export type PlotSave = {
  cropId: CropId | null;
  stage: number;
  wateredToday: boolean;
};

export type Inventory = {
  turnipSeed: number;
  turnipCrop: number;
};

export type GameSave = {
  version: 1;
  day: number;
  gold: number;
  inventory: Inventory;
  player: {
    x: number;
    y: number;
    facing: Facing;
  };
  plots: Record<string, PlotSave>;
};
