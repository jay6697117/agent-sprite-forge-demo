import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { PlotSave } from '../types/GameState';
import type { FieldPlot } from '../types/MapData';

export class CropPlot {
  readonly bounds: Phaser.Geom.Rectangle;
  private readonly base: Phaser.GameObjects.Rectangle;
  private readonly crop: Phaser.GameObjects.Sprite;
  private readonly water: Phaser.GameObjects.Rectangle;
  private readonly highlight: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly data: FieldPlot,
    private readonly state: PlotSave
  ) {
    this.bounds = new Phaser.Geom.Rectangle(data.x, data.y, data.w, data.h);
    const centerX = data.x + data.w / 2;
    const centerY = data.y + data.h / 2;
    this.base = scene.add.rectangle(centerX, centerY, data.w, data.h, 0x6b4a2d, 0.18);
    this.crop = scene.add.sprite(centerX, centerY, AssetKey.cropTurnip, 0);
    this.water = scene.add.rectangle(centerX, centerY, data.w - 6, data.h - 6, 0x6db7ff, 0.25);
    this.highlight = scene.add.rectangle(centerX, centerY, data.w + 4, data.h + 4);

    this.base.setDepth(centerY - 2);
    this.crop.setDepth(centerY + 1);
    this.water.setDepth(centerY);
    this.highlight.setDepth(centerY + 2);
    this.highlight.setStrokeStyle(2, 0xfff0a0, 0.8);
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
      this.crop.setFrame(this.state.stage);
    }
  }

  destroy() {
    this.base.destroy();
    this.crop.destroy();
    this.water.destroy();
    this.highlight.destroy();
  }
}
