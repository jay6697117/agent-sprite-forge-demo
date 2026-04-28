import { TURNIP } from '../config/crops';
import type { GameSave } from '../types/GameState';
import { InventorySystem } from './InventorySystem';
import { SaveSystem } from './SaveSystem';

export class ShopSystem {
  constructor(
    private readonly state: GameSave,
    private readonly inventory: InventorySystem
  ) {}

  buySeed() {
    if (!this.inventory.spendGold(TURNIP.seedPrice)) {
      return `金币不足：种子需要 ${TURNIP.seedPrice} 金。`;
    }
    this.inventory.addTurnipSeed(1);
    SaveSystem.save(this.state);
    return `买到 1 包种子，花费 ${TURNIP.seedPrice} 金。`;
  }

  sellCrop() {
    if (!this.inventory.removeTurnipCrop(1)) {
      return '背包里没有成熟作物可以出售。';
    }
    this.inventory.addGold(TURNIP.sellPrice);
    SaveSystem.save(this.state);
    return `卖出 1 个作物，获得 ${TURNIP.sellPrice} 金。`;
  }
}
