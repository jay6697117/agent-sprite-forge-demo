import { CROPS } from '../config/crops';
import { createDailyOrders } from '../config/orders';
import type { GameSave } from '../types/GameState';

export function advanceDayState(state: GameSave) {
  for (const plotState of Object.values(state.plots)) {
    if (plotState.cropId && plotState.wateredToday && plotState.stage < CROPS[plotState.cropId].maxStage) {
      plotState.stage += 1;
    }
    plotState.wateredToday = false;
  }
  state.day += 1;
  state.energy = state.maxEnergy;
  state.orders = createDailyOrders(state.day, state.unlocks);
  return `晚安。第 ${state.day} 天开始了，体力已恢复。`;
}
