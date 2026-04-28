import { StartingInventory } from '../config/items';
import type { GameSave, PlotSave } from '../types/GameState';
import type { Facing, FieldPlot } from '../types/MapData';

const SAVE_KEY = 'farm-mvp-save-v1';

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
      const parsed = JSON.parse(raw) as Partial<GameSave>;
      if (parsed.version !== 1 || !parsed.inventory || !parsed.player || !parsed.plots) {
        return fallback;
      }

      return {
        version: 1,
        day: Number.isFinite(parsed.day) ? Number(parsed.day) : fallback.day,
        gold: Number.isFinite(parsed.gold) ? Number(parsed.gold) : fallback.gold,
        inventory: {
          turnipSeed: Number.isFinite(parsed.inventory.turnipSeed) ? Number(parsed.inventory.turnipSeed) : fallback.inventory.turnipSeed,
          turnipCrop: Number.isFinite(parsed.inventory.turnipCrop) ? Number(parsed.inventory.turnipCrop) : fallback.inventory.turnipCrop
        },
        player: {
          x: Number.isFinite(parsed.player.x) ? Number(parsed.player.x) : fallback.player.x,
          y: Number.isFinite(parsed.player.y) ? Number(parsed.player.y) : fallback.player.y,
          facing: SaveSystem.isFacing(parsed.player.facing) ? parsed.player.facing : fallback.player.facing
        },
        plots: SaveSystem.mergePlots(fieldPlots, parsed.plots)
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
      version: 1,
      day: 1,
      gold: StartingInventory.gold,
      inventory: {
        turnipSeed: StartingInventory.turnipSeed,
        turnipCrop: StartingInventory.turnipCrop
      },
      player: {
        x: spawn.x,
        y: spawn.y,
        facing: 'down'
      },
      plots
    };
  }

  private static mergePlots(fieldPlots: FieldPlot[], savedPlots: Record<string, PlotSave>) {
    const plots: Record<string, PlotSave> = {};
    for (const plot of fieldPlots) {
      const saved = savedPlots[plot.id];
      plots[plot.id] = saved
        ? {
            cropId: saved.cropId === 'turnip' ? 'turnip' : null,
            stage: Math.max(0, Math.min(3, Number(saved.stage) || 0)),
            wateredToday: Boolean(saved.wateredToday)
          }
        : { cropId: null, stage: 0, wateredToday: false };
    }
    return plots;
  }

  private static isFacing(value: unknown): value is Facing {
    return value === 'down' || value === 'left' || value === 'right' || value === 'up';
  }

  private static storageAvailable() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }
}
