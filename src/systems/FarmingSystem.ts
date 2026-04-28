import Phaser from 'phaser';
import { CROPS, cropForTool } from '../config/crops';
import { CropPlot } from '../objects/CropPlot';
import type { CropId, GameSave, PlotSave } from '../types/GameState';
import type { FieldPlot, ToolId } from '../types/MapData';
import { advanceDayState } from './DaySystem';
import { InventorySystem } from './InventorySystem';
import { SaveSystem } from './SaveSystem';

export type FarmingAction = 'plant' | 'water' | 'harvest';

export type FarmingResult = {
  message: string;
  changed: boolean;
  action?: FarmingAction;
  point?: { x: number; y: number };
};

const ENERGY_COST: Record<FarmingAction, number> = {
  plant: 2,
  water: 1,
  harvest: 2
};

export class FarmingSystem {
  private readonly plots: CropPlot[];

  constructor(
    scene: Phaser.Scene,
    fieldPlots: FieldPlot[],
    private readonly state: GameSave,
    private readonly inventory: InventorySystem
  ) {
    this.plots = fieldPlots.map((plot) => new CropPlot(scene, plot, state.plots[plot.id]));
  }

  updateActivePlot(point: { x: number; y: number }) {
    const active = this.findPlot(point);
    for (const plot of this.plots) {
      plot.setHighlighted(plot === active);
    }
    return active;
  }

  useTool(tool: ToolId, point: { x: number; y: number }): FarmingResult {
    const plot = this.findPlot(point);
    if (!plot) {
      return { message: '靠近农田格子再操作。', changed: false };
    }

    const plotState = this.state.plots[plot.data.id];
    const cropId = cropForTool(tool);
    if (cropId) {
      return this.plant(plot, plotState, cropId);
    }
    if (tool === 'watering_can') {
      return this.water(plot, plotState);
    }
    return this.harvest(plot, plotState);
  }

  advanceDay() {
    const message = advanceDayState(this.state);
    this.refreshAll();
    SaveSystem.save(this.state);
    return message;
  }

  refreshAll() {
    for (const plot of this.plots) {
      plot.refresh();
    }
  }

  private plant(plot: CropPlot, plotState: PlotSave, cropId: CropId): FarmingResult {
    const crop = CROPS[cropId];
    if (plotState.cropId) {
      return { message: '这里已经有作物了。', changed: false };
    }
    if (!this.inventory.removeSeed(cropId, 1)) {
      return { message: `${crop.seedName} 不够，去商店买一些吧。`, changed: false };
    }
    if (!this.spendEnergy('plant')) {
      this.inventory.addSeed(cropId, 1);
      return { message: '体力不够了，回屋睡一觉吧。', changed: false };
    }
    plotState.cropId = crop.id;
    plotState.stage = 0;
    plotState.wateredToday = false;
    plot.refresh();
    SaveSystem.save(this.state);
    return {
      message: `撒下 1 包${crop.seedName}，小苗会慢慢长大。`,
      changed: true,
      action: 'plant',
      point: plot.center
    };
  }

  private water(plot: CropPlot, plotState: PlotSave): FarmingResult {
    if (!plotState.cropId) {
      return { message: '这里还没有种子。', changed: false };
    }
    if (plotState.stage >= CROPS[plotState.cropId].maxStage) {
      return { message: '作物已经成熟，可以收获。', changed: false };
    }
    if (plotState.wateredToday) {
      return { message: '今天已经浇过水了。', changed: false };
    }
    if (!this.spendEnergy('water')) {
      return { message: '体力不够了，水壶都举不起来了。', changed: false };
    }
    plotState.wateredToday = true;
    plot.refresh();
    SaveSystem.save(this.state);
    return {
      message: '水珠落进土里，作物睡觉后会成长。',
      changed: true,
      action: 'water',
      point: plot.center
    };
  }

  private harvest(plot: CropPlot, plotState: PlotSave): FarmingResult {
    if (!plotState.cropId) {
      return { message: '这里没有可以收获的作物。', changed: false };
    }
    const crop = CROPS[plotState.cropId];
    if (plotState.stage < crop.maxStage) {
      return { message: `${crop.name} 还没成熟，再照顾一天吧。`, changed: false };
    }
    if (!this.spendEnergy('harvest')) {
      return { message: '体力不够了，明天再收获吧。', changed: false };
    }
    plotState.cropId = null;
    plotState.stage = 0;
    plotState.wateredToday = false;
    this.inventory.addCrop(crop.id, 1);
    plot.refresh();
    SaveSystem.save(this.state);
    return {
      message: `收获 1 个${crop.name}，可以交订单或出售。`,
      changed: true,
      action: 'harvest',
      point: plot.center
    };
  }

  private spendEnergy(action: FarmingAction) {
    const cost = ENERGY_COST[action];
    if (this.state.energy < cost) {
      return false;
    }
    this.state.energy -= cost;
    return true;
  }

  private findPlot(point: { x: number; y: number }) {
    const containingPlot = this.plots.find((plot) => plot.contains(point));
    if (containingPlot) {
      return containingPlot;
    }

    let bestPlot: CropPlot | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const plot of this.plots) {
      const distance = Phaser.Math.Distance.Between(point.x, point.y, plot.center.x, plot.center.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPlot = plot;
      }
    }

    return bestDistance <= 58 ? bestPlot : undefined;
  }
}
