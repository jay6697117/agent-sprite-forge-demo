import Phaser from 'phaser';
import { AssetKey } from '../config/assets';

export class Npc extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.npcSeedSeller, 0);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDisplaySize(64, 64);
    this.setDepth(y);
  }
}
