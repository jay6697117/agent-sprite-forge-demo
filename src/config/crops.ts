import type { CropId, CropItem, SeedItem } from '../types/GameState';
import type { ToolId } from '../types/MapData';

export type CropConfig = {
  id: CropId;
  name: string;
  seedName: string;
  seedItem: SeedItem;
  cropItem: CropItem;
  maxStage: number;
  sellPrice: number;
  seedPrice: number;
  tint: number;
};

export const CROPS: Record<CropId, CropConfig> = {
  turnip: {
    id: 'turnip',
    name: '甜萝卜',
    seedName: '甜萝卜种子',
    seedItem: 'turnipSeed',
    cropItem: 'turnipCrop',
    maxStage: 3,
    sellPrice: 8,
    seedPrice: 5,
    tint: 0xffffff
  },
  wheat: {
    id: 'wheat',
    name: '金麦穗',
    seedName: '金麦种子',
    seedItem: 'wheatSeed',
    cropItem: 'wheatCrop',
    maxStage: 3,
    sellPrice: 12,
    seedPrice: 7,
    tint: 0xffd36a
  },
  strawberry: {
    id: 'strawberry',
    name: '莓莓果',
    seedName: '莓莓果种子',
    seedItem: 'strawberrySeed',
    cropItem: 'strawberryCrop',
    maxStage: 3,
    sellPrice: 18,
    seedPrice: 10,
    tint: 0xff8aa0
  }
};

export const CROP_IDS = Object.keys(CROPS) as CropId[];

export const TURNIP = CROPS.turnip;

export function isCropId(value: unknown): value is CropId {
  return value === 'turnip' || value === 'wheat' || value === 'strawberry';
}

export function cropForTool(tool: ToolId): CropId | null {
  if (tool === 'turnip_seed') return 'turnip';
  if (tool === 'wheat_seed') return 'wheat';
  if (tool === 'strawberry_seed') return 'strawberry';
  return null;
}

export function seedToolForCrop(cropId: CropId): ToolId {
  if (cropId === 'wheat') return 'wheat_seed';
  if (cropId === 'strawberry') return 'strawberry_seed';
  return 'turnip_seed';
}
