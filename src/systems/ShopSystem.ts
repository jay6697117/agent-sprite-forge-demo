import { CROPS } from '../config/crops';
import { UpgradeCosts } from '../config/items';
import type { CropId, GameSave } from '../types/GameState';
import { InventorySystem } from './InventorySystem';
import { SaveSystem } from './SaveSystem';

export class ShopSystem {
  constructor(
    private readonly state: GameSave,
    private readonly inventory: InventorySystem
  ) {}

  buySeed(cropId: CropId) {
    const crop = CROPS[cropId];
    if (!this.canBuyCrop(cropId)) {
      return `${crop.seedName} 还没上架，先完成订单提升声望吧。`;
    }
    if (!this.inventory.spendGold(crop.seedPrice)) {
      return `金币不足：${crop.seedName} 需要 ${crop.seedPrice} 金。`;
    }
    this.inventory.addSeed(cropId, 1);
    SaveSystem.save(this.state);
    return `买到 1 包${crop.seedName}，花费 ${crop.seedPrice} 金。`;
  }

  sellCrop(cropId?: CropId | null) {
    const targetCrop = cropId && this.inventory.getCrop(cropId) > 0 ? cropId : this.inventory.firstSellableCrop();
    if (!targetCrop) {
      return '背包里没有成熟作物可以出售。';
    }
    const crop = CROPS[targetCrop];
    if (!this.inventory.removeCrop(targetCrop, 1)) {
      return `没有可出售的${crop.name}。`;
    }
    this.inventory.addGold(crop.sellPrice);
    SaveSystem.save(this.state);
    return `卖出 1 个${crop.name}，获得 ${crop.sellPrice} 金。`;
  }

  buyUpgrade() {
    const nextUpgrade = this.nextUpgrade();
    if (!nextUpgrade) {
      return '今天的升级都买完啦，商人给你比了个大拇指。';
    }
    if (!this.inventory.spendGold(nextUpgrade.cost)) {
      return `${nextUpgrade.name} 需要 ${nextUpgrade.cost} 金。`;
    }
    nextUpgrade.apply();
    SaveSystem.save(this.state);
    return `升级完成：${nextUpgrade.name}。`;
  }

  private canBuyCrop(cropId: CropId) {
    if (cropId === 'turnip') return true;
    if (cropId === 'wheat') return this.state.unlocks.wheat;
    return this.state.unlocks.strawberry;
  }

  private nextUpgrade() {
    if (this.state.upgrades.wateringCanLevel < 3) {
      const nextLevel = this.state.upgrades.wateringCanLevel + 1;
      return {
        name: `水壶 Lv.${nextLevel}`,
        cost: UpgradeCosts.wateringCan[this.state.upgrades.wateringCanLevel],
        apply: () => {
          this.state.upgrades.wateringCanLevel = nextLevel;
          this.state.maxEnergy += 4;
          this.state.energy = this.state.maxEnergy;
        }
      };
    }
    if (this.state.upgrades.backpackLevel < 3) {
      const nextLevel = this.state.upgrades.backpackLevel + 1;
      return {
        name: `背包 Lv.${nextLevel}`,
        cost: UpgradeCosts.backpack[this.state.upgrades.backpackLevel],
        apply: () => {
          this.state.upgrades.backpackLevel = nextLevel;
          this.state.maxEnergy += 2;
          this.state.energy = this.state.maxEnergy;
        }
      };
    }
    if (this.state.upgrades.shoeLevel < 3) {
      const nextLevel = this.state.upgrades.shoeLevel + 1;
      return {
        name: `轻快鞋 Lv.${nextLevel}`,
        cost: UpgradeCosts.shoes[this.state.upgrades.shoeLevel],
        apply: () => {
          this.state.upgrades.shoeLevel = nextLevel;
        }
      };
    }
    return null;
  }
}
