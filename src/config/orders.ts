import { CROPS, CROP_IDS } from './crops';
import type { CropId, OrderSave, UnlockSave } from '../types/GameState';

export function createDailyOrders(day: number, unlocks: UnlockSave): OrderSave[] {
  const available = availableOrderCrops(unlocks);
  return [0, 1].map((slot) => {
    const cropId = available[(day + slot) % available.length];
    const baseAmount = cropId === 'strawberry' ? 1 : 2;
    const amount = baseAmount + ((day + slot) % 2);
    return {
      id: `day_${day}_order_${slot + 1}`,
      cropId,
      amount,
      rewardGold: CROPS[cropId].sellPrice * amount + 6 + day,
      rewardReputation: cropId === 'strawberry' ? 2 : 1,
      completed: false
    };
  });
}

export function availableOrderCrops(unlocks: UnlockSave): CropId[] {
  return CROP_IDS.filter((cropId) => {
    if (cropId === 'turnip') return true;
    if (cropId === 'wheat') return unlocks.wheat;
    return unlocks.strawberry;
  });
}
