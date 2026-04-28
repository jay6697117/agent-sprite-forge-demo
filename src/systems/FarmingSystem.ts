import { TURNIP } from '../config/crops';
import { CropPlot } from '../objects/CropPlot';
import type { GameSave } from '../types/GameState';
import type { FieldPlot, ToolId } from '../types/MapData';
import { InventorySystem } from './InventorySystem';
import { SaveSystem } from './SaveSystem';

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

  useTool(tool: ToolId, point: { x: number; y: number }) {
    const plot = this.findPlot(point);
    if (!plot) {
      return '站到农田格子上再操作。';
    }

    const plotState = this.state.plots[plot.data.id];
    if (tool === 'seed') {
      return this.plant(plot, plotState);
    }
    if (tool === 'watering_can') {
      return this.water(plot, plotState);
    }
    return this.harvest(plot, plotState);
  }

  advanceDay() {
    for (const plot of this.plots) {
      const plotState = this.state.plots[plot.data.id];
      if (plotState.cropId && plotState.wateredToday && plotState.stage < TURNIP.maxStage) {
        plotState.stage += 1;
      }
      plotState.wateredToday = false;
      plot.refresh();
    }
    this.state.day += 1;
    SaveSystem.save(this.state);
    return `第 ${this.state.day} 天开始了。`;
  }

  refreshAll() {
    for (const plot of this.plots) {
      plot.refresh();
    }
  }

  private plant(plot: CropPlot, plotState: { cropId: 'turnip' | null; stage: number; wateredToday: boolean }) {
    if (plotState.cropId) {
      return '这里已经有作物了。';
    }
    if (!this.inventory.removeTurnipSeed(1)) {
      return '没有种子了，去找种子商人购买。';
    }
    plotState.cropId = TURNIP.id;
    plotState.stage = 0;
    plotState.wateredToday = false;
    plot.refresh();
    SaveSystem.save(this.state);
    return '播下一包种子。';
  }

  private water(plot: CropPlot, plotState: { cropId: 'turnip' | null; stage: number; wateredToday: boolean }) {
    if (!plotState.cropId) {
      return '这里还没有种子。';
    }
    if (plotState.stage >= TURNIP.maxStage) {
      return '作物已经成熟，可以收获。';
    }
    if (plotState.wateredToday) {
      return '今天已经浇过水了。';
    }
    plotState.wateredToday = true;
    plot.refresh();
    SaveSystem.save(this.state);
    return '浇水完成，睡觉后会成长。';
  }

  private harvest(plot: CropPlot, plotState: { cropId: 'turnip' | null; stage: number; wateredToday: boolean }) {
    if (!plotState.cropId) {
      return '这里没有可以收获的作物。';
    }
    if (plotState.stage < TURNIP.maxStage) {
      return '作物还没成熟。';
    }
    plotState.cropId = null;
    plotState.stage = 0;
    plotState.wateredToday = false;
    this.inventory.addTurnipCrop(1);
    plot.refresh();
    SaveSystem.save(this.state);
    return '收获 1 个作物。';
  }

  private findPlot(point: { x: number; y: number }) {
    return this.plots.find((plot) => plot.contains(point));
  }
}
