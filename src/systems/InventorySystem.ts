import { CROPS } from '../config/crops';
import type { CropId, CropItem, GameSave, SeedItem } from '../types/GameState';

export class InventorySystem {
  constructor(private readonly state: GameSave) {}

  get gold() {
    return this.state.gold;
  }

  get turnipSeed() {
    return this.getSeed('turnip');
  }

  get turnipCrop() {
    return this.getCrop('turnip');
  }

  spendGold(amount: number) {
    if (this.state.gold < amount) {
      return false;
    }
    this.state.gold -= amount;
    return true;
  }

  addGold(amount: number) {
    this.state.gold += amount;
  }

  getSeed(cropId: CropId) {
    return this.state.inventory[CROPS[cropId].seedItem];
  }

  addSeed(cropId: CropId, amount: number) {
    this.state.inventory[CROPS[cropId].seedItem] += amount;
  }

  removeSeed(cropId: CropId, amount: number) {
    return this.removeItem(CROPS[cropId].seedItem, amount);
  }

  getCrop(cropId: CropId) {
    return this.state.inventory[CROPS[cropId].cropItem];
  }

  addCrop(cropId: CropId, amount: number) {
    this.state.inventory[CROPS[cropId].cropItem] += amount;
  }

  removeCrop(cropId: CropId, amount: number) {
    return this.removeItem(CROPS[cropId].cropItem, amount);
  }

  addTurnipSeed(amount: number) {
    this.addSeed('turnip', amount);
  }

  removeTurnipSeed(amount: number) {
    return this.removeSeed('turnip', amount);
  }

  addTurnipCrop(amount: number) {
    this.addCrop('turnip', amount);
  }

  removeTurnipCrop(amount: number) {
    return this.removeCrop('turnip', amount);
  }

  firstSellableCrop() {
    return (Object.keys(CROPS) as CropId[]).find((cropId) => this.getCrop(cropId) > 0) ?? null;
  }

  private removeItem(item: SeedItem | CropItem, amount: number) {
    if (this.state.inventory[item] < amount) {
      return false;
    }
    this.state.inventory[item] -= amount;
    return true;
  }
}
