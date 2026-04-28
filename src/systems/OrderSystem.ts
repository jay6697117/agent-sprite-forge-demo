import { CROPS } from '../config/crops';
import type { GameSave } from '../types/GameState';
import { InventorySystem } from './InventorySystem';
import { SaveSystem } from './SaveSystem';

export type OrderResult = {
  message: string;
  changed: boolean;
};

export class OrderSystem {
  constructor(
    private readonly state: GameSave,
    private readonly inventory: InventorySystem
  ) {}

  completeReadyOrders(): OrderResult {
    const completed: string[] = [];
    for (const order of this.state.orders) {
      if (order.completed || this.inventory.getCrop(order.cropId) < order.amount) {
        continue;
      }
      this.inventory.removeCrop(order.cropId, order.amount);
      this.inventory.addGold(order.rewardGold);
      this.state.reputation += order.rewardReputation;
      this.state.friendship.seedSeller += 1;
      order.completed = true;
      completed.push(`${CROPS[order.cropId].name} x${order.amount}`);
    }

    if (completed.length === 0) {
      return { message: '订单还没准备好：先种出需要的作物吧。', changed: false };
    }

    const unlockMessage = this.applyUnlocks();
    SaveSystem.save(this.state);
    return { message: `交付订单：${completed.join('、')}。金币和声望增加了。${unlockMessage}`, changed: true };
  }

  private applyUnlocks() {
    const messages: string[] = [];
    if (!this.state.unlocks.strawberry && this.state.reputation >= 2) {
      this.state.unlocks.strawberry = true;
      messages.push('莓莓果种子上架了');
    }
    if (!this.state.unlocks.forestPath && this.state.reputation >= 4) {
      this.state.unlocks.forestPath = true;
      messages.push('林地小路解锁了');
    }
    return messages.length > 0 ? ` 新内容：${messages.join('、')}。` : '';
  }
}
