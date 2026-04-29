import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { CROPS } from '../config/crops';
import type { CropId, PlotSave } from '../types/GameState';
import type { FieldPlot } from '../types/MapData';

const cropRows: Record<CropId, number> = {
  turnip: 0,
  wheat: 1,
  strawberry: 2
};

const cropFrameCenterY: Record<CropId, number[]> = {
  turnip: [91.5, 81, 71.5, 68.5],
  wheat: [91.5, 75, 66.5, 64.5],
  strawberry: [92.5, 79, 75, 72.5]
};

const cropFrameSize = 128;

export class CropPlot {
  readonly bounds: Phaser.Geom.Rectangle;
  readonly center: { x: number; y: number };
  private readonly base: Phaser.GameObjects.Rectangle;
  private readonly crop: Phaser.GameObjects.Sprite;
  private readonly water: Phaser.GameObjects.Rectangle;
  private readonly highlight: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    readonly data: FieldPlot,
    private readonly state: PlotSave
  ) {
    this.bounds = new Phaser.Geom.Rectangle(data.x, data.y, data.w, data.h);
    this.center = { x: data.x + data.w / 2, y: data.y + data.h / 2 };
    this.base = scene.add.rectangle(this.center.x, this.center.y, data.w, data.h, 0x7a5130, 0.28);
    this.crop = scene.add.sprite(this.center.x, this.center.y, AssetKey.cropTurnip, 0);
    this.crop.setDisplaySize(data.w, data.h);
    this.water = scene.add.rectangle(this.center.x, this.center.y, data.w - 6, data.h - 6, 0x7cc9ff, 0.3);
    this.highlight = scene.add.rectangle(this.center.x, this.center.y, data.w, data.h);

    this.base.setDepth(this.center.y - 2);
    this.crop.setDepth(this.center.y + 1);
    this.water.setDepth(this.center.y);
    this.highlight.setDepth(this.center.y + 2);
    this.highlight.setStrokeStyle(2, 0xffe8a3, 0.95);
    this.highlight.setVisible(false);
    this.refresh();
  }

  contains(point: { x: number; y: number }) {
    return Phaser.Geom.Rectangle.Contains(this.bounds, point.x, point.y);
  }

  setHighlighted(value: boolean) {
    this.highlight.setVisible(value);
  }

  refresh() {
    this.crop.setVisible(this.state.cropId !== null);
    this.water.setVisible(this.state.cropId !== null && this.state.wateredToday);
    if (this.state.cropId) {
      const crop = CROPS[this.state.cropId];
      const stage = Math.min(this.state.stage, crop.maxStage);
      this.crop.setFrame(cropRows[this.state.cropId] * 4 + stage);
      this.crop.setPosition(this.center.x, this.cropY(this.state.cropId, stage));
      this.crop.setTint(crop.tint);
    } else {
      this.crop.setPosition(this.center.x, this.center.y);
      this.crop.clearTint();
    }
  }

  private cropY(cropId: CropId, stage: number) {
    return this.center.y + (0.5 - cropFrameCenterY[cropId][stage] / cropFrameSize) * this.data.h;
  }

  destroy() {
    this.base.destroy();
    this.crop.destroy();
    this.water.destroy();
    this.highlight.destroy();
  }
}
