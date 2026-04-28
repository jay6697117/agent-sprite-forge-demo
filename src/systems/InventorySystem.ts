import type { GameSave } from '../types/GameState';

export class InventorySystem {
  constructor(private readonly state: GameSave) {}

  get gold() {
    return this.state.gold;
  }

  get turnipSeed() {
    return this.state.inventory.turnipSeed;
  }

  get turnipCrop() {
    return this.state.inventory.turnipCrop;
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

  addTurnipSeed(amount: number) {
    this.state.inventory.turnipSeed += amount;
  }

  removeTurnipSeed(amount: number) {
    if (this.state.inventory.turnipSeed < amount) {
      return false;
    }
    this.state.inventory.turnipSeed -= amount;
    return true;
  }

  addTurnipCrop(amount: number) {
    this.state.inventory.turnipCrop += amount;
  }

  removeTurnipCrop(amount: number) {
    if (this.state.inventory.turnipCrop < amount) {
      return false;
    }
    this.state.inventory.turnipCrop -= amount;
    return true;
  }
}
