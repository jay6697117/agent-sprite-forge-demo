import { CROPS, isCropId } from '../config/crops';
import { StartingInventory, StartingStats } from '../config/items';
import { createDailyOrders } from '../config/orders';
import type { GameSave, Inventory, OrderSave, PlotSave, UnlockSave } from '../types/GameState';
import type { Facing, FieldPlot } from '../types/MapData';

const SAVE_KEY = 'farm-mvp-save-v1';
const DEFAULT_UNLOCKS: UnlockSave = { wheat: true, strawberry: false, forestPath: false };

export class SaveSystem {
  static load(fieldPlots: FieldPlot[], spawn: { x: number; y: number }): GameSave {
    const fallback = SaveSystem.createDefault(fieldPlots, spawn);
    if (!SaveSystem.storageAvailable()) {
      return fallback;
    }

    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = SaveSystem.asRecord(JSON.parse(raw));
      if (!parsed) {
        return fallback;
      }

      const reputation = SaveSystem.finiteNumber(parsed.reputation, fallback.reputation);
      const unlocks = SaveSystem.normalizeUnlocks(parsed.unlocks, reputation);
      const maxEnergy = Math.max(1, SaveSystem.finiteNumber(parsed.maxEnergy, fallback.maxEnergy));
      const energy = SaveSystem.clamp(SaveSystem.finiteNumber(parsed.energy, maxEnergy), 0, maxEnergy);
      const day = Math.max(1, Math.floor(SaveSystem.finiteNumber(parsed.day, fallback.day)));

      return {
        version: 2,
        day,
        gold: SaveSystem.finiteNumber(parsed.gold, fallback.gold),
        energy,
        maxEnergy,
        reputation,
        inventory: SaveSystem.normalizeInventory(parsed.inventory),
        player: SaveSystem.normalizePlayer(parsed.player, fallback.player),
        plots: SaveSystem.mergePlots(fieldPlots, parsed.plots),
        orders: SaveSystem.normalizeOrders(parsed.orders, day, unlocks),
        upgrades: {
          wateringCanLevel: SaveSystem.clampInt(SaveSystem.readNestedNumber(parsed.upgrades, 'wateringCanLevel', 1), 1, 3),
          backpackLevel: SaveSystem.clampInt(SaveSystem.readNestedNumber(parsed.upgrades, 'backpackLevel', 1), 1, 3),
          shoeLevel: SaveSystem.clampInt(SaveSystem.readNestedNumber(parsed.upgrades, 'shoeLevel', 1), 1, 3)
        },
        friendship: {
          seedSeller: SaveSystem.clampInt(SaveSystem.readNestedNumber(parsed.friendship, 'seedSeller', 0), 0, 999)
        },
        unlocks
      };
    } catch {
      return fallback;
    }
  }

  static save(state: GameSave) {
    if (!SaveSystem.storageAvailable()) {
      return;
    }
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  static reset() {
    if (!SaveSystem.storageAvailable()) {
      return;
    }
    window.localStorage.removeItem(SAVE_KEY);
  }

  static createDefault(fieldPlots: FieldPlot[], spawn: { x: number; y: number }): GameSave {
    const plots: Record<string, PlotSave> = {};
    for (const plot of fieldPlots) {
      plots[plot.id] = { cropId: null, stage: 0, wateredToday: false };
    }

    return {
      version: 2,
      day: 1,
      gold: StartingStats.gold,
      energy: StartingStats.energy,
      maxEnergy: StartingStats.maxEnergy,
      reputation: StartingStats.reputation,
      inventory: { ...StartingInventory },
      player: {
        x: spawn.x,
        y: spawn.y,
        facing: 'down'
      },
      plots,
      orders: createDailyOrders(1, DEFAULT_UNLOCKS),
      upgrades: {
        wateringCanLevel: 1,
        backpackLevel: 1,
        shoeLevel: 1
      },
      friendship: {
        seedSeller: 0
      },
      unlocks: { ...DEFAULT_UNLOCKS }
    };
  }

  private static normalizeInventory(value: unknown): Inventory {
    const saved = SaveSystem.asRecord(value);
    const inventory = { ...StartingInventory };
    for (const key of Object.keys(StartingInventory) as (keyof Inventory)[]) {
      inventory[key] = Math.max(0, Math.floor(SaveSystem.finiteNumber(saved?.[key], StartingInventory[key])));
    }
    return inventory;
  }

  private static normalizePlayer(value: unknown, fallback: GameSave['player']) {
    const saved = SaveSystem.asRecord(value);
    const facing = saved?.facing;
    return {
      x: SaveSystem.finiteNumber(saved?.x, fallback.x),
      y: SaveSystem.finiteNumber(saved?.y, fallback.y),
      facing: SaveSystem.isFacing(facing) ? facing : fallback.facing
    };
  }

  private static normalizeUnlocks(value: unknown, reputation: number): UnlockSave {
    const saved = SaveSystem.asRecord(value);
    return {
      wheat: typeof saved?.wheat === 'boolean' ? saved.wheat : true,
      strawberry: typeof saved?.strawberry === 'boolean' ? saved.strawberry : reputation >= 2,
      forestPath: typeof saved?.forestPath === 'boolean' ? saved.forestPath : reputation >= 4
    };
  }

  private static normalizeOrders(value: unknown, day: number, unlocks: UnlockSave): OrderSave[] {
    if (!Array.isArray(value)) {
      return createDailyOrders(day, unlocks);
    }

    const orders = value
      .map((item) => {
        const saved = SaveSystem.asRecord(item);
        if (!saved || !isCropId(saved.cropId)) {
          return null;
        }
        return {
          id: typeof saved.id === 'string' ? saved.id : `day_${day}_order_saved`,
          cropId: saved.cropId,
          amount: SaveSystem.clampInt(SaveSystem.finiteNumber(saved.amount, 1), 1, 99),
          rewardGold: SaveSystem.clampInt(SaveSystem.finiteNumber(saved.rewardGold, CROPS[saved.cropId].sellPrice), 1, 9999),
          rewardReputation: SaveSystem.clampInt(SaveSystem.finiteNumber(saved.rewardReputation, 1), 1, 99),
          completed: Boolean(saved.completed)
        } satisfies OrderSave;
      })
      .filter((order): order is OrderSave => order !== null);

    return orders.length > 0 ? orders : createDailyOrders(day, unlocks);
  }

  private static mergePlots(fieldPlots: FieldPlot[], savedPlots: unknown) {
    const savedPlotRecord = SaveSystem.asRecord(savedPlots);
    const plots: Record<string, PlotSave> = {};
    for (const plot of fieldPlots) {
      const saved = SaveSystem.asRecord(savedPlotRecord?.[plot.id]);
      const savedCropId = saved?.cropId;
      const cropId = isCropId(savedCropId) ? savedCropId : null;
      plots[plot.id] = cropId
        ? {
            cropId,
            stage: SaveSystem.clampInt(SaveSystem.finiteNumber(saved?.stage, 0), 0, CROPS[cropId].maxStage),
            wateredToday: Boolean(saved?.wateredToday)
          }
        : { cropId: null, stage: 0, wateredToday: false };
    }
    return plots;
  }

  private static readNestedNumber(value: unknown, key: string, fallback: number) {
    const record = SaveSystem.asRecord(value);
    return SaveSystem.finiteNumber(record?.[key], fallback);
  }

  private static isFacing(value: unknown): value is Facing {
    return value === 'down' || value === 'left' || value === 'right' || value === 'up';
  }

  private static finiteNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private static clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private static clampInt(value: number, min: number, max: number) {
    return Math.floor(SaveSystem.clamp(value, min, max));
  }

  private static asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  }

  private static storageAvailable() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}
