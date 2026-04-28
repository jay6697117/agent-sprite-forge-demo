import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { FarmingAction } from './FarmingSystem';

type FxTween = {
  x?: number;
  y?: number;
  alpha?: number;
  scale?: number;
  angle?: number;
  duration: number;
};

export class EffectSystem {
  constructor(private readonly scene: Phaser.Scene) {}

  playFarming(action: FarmingAction, point: { x: number; y: number }) {
    if (action === 'plant') {
      this.playPlant(point);
      return;
    }
    if (action === 'water') {
      this.playWater(point);
      return;
    }
    this.playHarvest(point);
  }

  playGold(point: { x: number; y: number }) {
    this.playFxSprite(3, point, 34, { y: point.y - 38, alpha: 0, scale: 0.4, duration: 720 });
    const text = this.scene.add.text(point.x, point.y - 36, '+金币', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#ffe27a',
      stroke: '#4a2d14',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(point.y + 80);
    this.scene.tweens.add({
      targets: text,
      y: text.y - 28,
      alpha: 0,
      duration: 780,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }

  playSleep() {
    const camera = this.scene.cameras.main;
    camera.fadeOut(260, 23, 18, 36);
    this.scene.time.delayedCall(320, () => camera.fadeIn(420, 23, 18, 36));
  }

  private playPlant(point: { x: number; y: number }) {
    this.floatText(point, '撒种', '#ffe0a3');
    this.playFxSprite(0, point, 44, { alpha: 0, scale: 0.55, duration: 520 });
    for (let i = 0; i < 5; i += 1) {
      const dust = this.scene.add.circle(point.x, point.y, 3, 0xc48a52, 0.75).setDepth(point.y + 10);
      this.scene.tweens.add({
        targets: dust,
        x: point.x + Phaser.Math.Between(-18, 18),
        y: point.y + Phaser.Math.Between(-10, 8),
        alpha: 0,
        scale: 1.8,
        duration: 520,
        ease: 'Sine.easeOut',
        onComplete: () => dust.destroy()
      });
    }
  }

  private playWater(point: { x: number; y: number }) {
    this.floatText(point, '浇水', '#a7ddff');
    this.playFxSprite(1, { x: point.x, y: point.y - 18 }, 42, { y: point.y + 8, alpha: 0, duration: 420 });
    for (let i = 0; i < 7; i += 1) {
      const drop = this.scene.add.circle(point.x + Phaser.Math.Between(-14, 14), point.y - 32, 3, 0x80d5ff, 0.9).setDepth(point.y + 10);
      this.scene.tweens.add({
        targets: drop,
        y: point.y + Phaser.Math.Between(-8, 10),
        alpha: 0.15,
        duration: 360 + i * 35,
        ease: 'Quad.easeIn',
        onComplete: () => drop.destroy()
      });
    }
  }

  private playHarvest(point: { x: number; y: number }) {
    this.floatText(point, '收获', '#fff0a0');
    this.playFxSprite(2, { x: point.x, y: point.y - 8 }, 42, { alpha: 0, scale: 0.7, angle: 120, duration: 680 });
    for (let i = 0; i < 6; i += 1) {
      const sparkle = this.scene.add.star(point.x, point.y - 10, 5, 3, 8, 0xfff0a0, 0.95).setDepth(point.y + 20);
      this.scene.tweens.add({
        targets: sparkle,
        x: point.x + Phaser.Math.Between(-24, 24),
        y: point.y + Phaser.Math.Between(-28, 8),
        angle: 180,
        alpha: 0,
        scale: 0.2,
        duration: 720,
        ease: 'Sine.easeOut',
        onComplete: () => sparkle.destroy()
      });
    }
  }

  private playFxSprite(frame: number, point: { x: number; y: number }, size: number, tween: FxTween) {
    const sprite = this.scene.add.sprite(point.x, point.y, AssetKey.fxFarming, frame).setDisplaySize(size, size).setDepth(point.y + 30);
    this.scene.tweens.add({
      targets: sprite,
      ease: 'Sine.easeOut',
      onComplete: () => sprite.destroy(),
      ...tween
    });
  }

  private floatText(point: { x: number; y: number }, label: string, color: string) {
    const text = this.scene.add.text(point.x, point.y - 30, label, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color,
      stroke: '#3a2418',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(point.y + 40);
    this.scene.tweens.add({
      targets: text,
      y: text.y - 18,
      alpha: 0,
      duration: 760,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy()
    });
  }
}
