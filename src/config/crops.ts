import type { CropId } from '../types/GameState';

export type CropConfig = {
  id: CropId;
  seedItem: 'turnipSeed';
  cropItem: 'turnipCrop';
  maxStage: number;
  sellPrice: number;
  seedPrice: number;
};

export const TURNIP: CropConfig = {
  id: 'turnip',
  seedItem: 'turnipSeed',
  cropItem: 'turnipCrop',
  maxStage: 3,
  sellPrice: 8,
  seedPrice: 5
};
