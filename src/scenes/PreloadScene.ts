import Phaser from 'phaser';
import { AssetKey, AssetPath, FrameSize } from '../config/assets';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    this.load.image(AssetKey.farmBase, AssetPath.farmBase);
    this.load.image(AssetKey.farmPreview, AssetPath.farmPreview);
    this.load.spritesheet(AssetKey.player, AssetPath.player, FrameSize.character);
    this.load.spritesheet(AssetKey.playerWalk, AssetPath.playerWalk, FrameSize.character);
    this.load.spritesheet(AssetKey.npcSeedSeller, AssetPath.npcSeedSeller, FrameSize.character);
    this.load.spritesheet(AssetKey.cropTurnip, AssetPath.cropTurnip, FrameSize.tile);
    this.load.spritesheet(AssetKey.itemsFarming, AssetPath.itemsFarming, FrameSize.itemIcon);
    this.load.spritesheet(AssetKey.fxFarming, AssetPath.fxFarming, FrameSize.fx);
    this.load.spritesheet(AssetKey.uiIcons, AssetPath.uiIcons, FrameSize.uiIcon);
    this.load.json(AssetKey.farmCollision, AssetPath.farmCollision);
    this.load.json(AssetKey.farmZones, AssetPath.farmZones);
    this.load.json(AssetKey.farmProps, AssetPath.farmProps);
    this.load.image(AssetKey.houseBase, AssetPath.houseBase);
    this.load.spritesheet(AssetKey.bedBlanket, AssetPath.bedBlanket, FrameSize.bedBlanket);
    this.load.json(AssetKey.houseCollision, AssetPath.houseCollision);
    this.load.json(AssetKey.houseZones, AssetPath.houseZones);
    this.load.audio(AssetKey.farmBgm, AssetPath.farmBgm);
  }

  create() {
    this.ensureFarmTexture(AssetKey.farmBase);
    this.ensureFarmTexture(AssetKey.farmPreview);
    this.ensureCharacterTexture(AssetKey.player, '#2959a8', '#d9b45f');
    this.ensureCharacterTexture(AssetKey.playerWalk, '#2959a8', '#d9b45f');
    this.ensureCharacterTexture(AssetKey.npcSeedSeller, '#7a4b28', '#6aa84f');
    this.ensureCropTexture();
    this.ensureItemTexture();
    this.ensureHouseTexture();
    this.createAnimations();
    this.scene.start('FarmScene');
  }

  private ensureFarmTexture(key: string) {
    if (this.textures.exists(key)) {
      return;
    }

    const texture = this.textures.createCanvas(key, 1280, 960);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#5f9e43';
    ctx.fillRect(0, 0, 1280, 960);

    ctx.fillStyle = '#6caf4d';
    for (let x = 0; x < 1280; x += 64) {
      for (let y = 0; y < 960; y += 64) {
        if ((x + y) % 128 === 0) {
          ctx.fillRect(x + 12, y + 18, 18, 6);
          ctx.fillRect(x + 36, y + 42, 12, 5);
        }
      }
    }

    ctx.fillStyle = '#c49a61';
    ctx.fillRect(230, 290, 90, 410);
    ctx.fillRect(320, 638, 490, 62);
    ctx.fillRect(720, 440, 70, 198);

    ctx.fillStyle = '#75472c';
    ctx.fillRect(116, 126, 220, 164);
    ctx.fillStyle = '#b45a36';
    ctx.fillRect(100, 102, 252, 54);
    ctx.fillStyle = '#2f1f18';
    ctx.fillRect(188, 226, 54, 64);

    ctx.fillStyle = '#6b4a2d';
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        ctx.fillRect(424 + col * 40, 520 + row * 40, 32, 32);
      }
    }

    ctx.fillStyle = '#3b83b7';
    ctx.beginPath();
    ctx.ellipse(980, 662, 130, 86, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2c5f87';
    ctx.beginPath();
    ctx.ellipse(1008, 642, 62, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8b5a32';
    ctx.fillRect(370, 372, 390, 18);
    ctx.fillRect(776, 388, 120, 62);
    ctx.fillStyle = '#d7a55f';
    ctx.fillRect(760, 360, 152, 34);

    this.drawTree(ctx, 1040, 214);
    this.drawTree(ctx, 1110, 298);
    this.drawTree(ctx, 1080, 810);
    texture.refresh();
  }

  private ensureCharacterTexture(key: string, shirt: string, accent: string) {
    if (this.textures.exists(key)) {
      return;
    }

    const frameWidth = FrameSize.character.frameWidth;
    const frameHeight = FrameSize.character.frameHeight;
    const texture = this.textures.createCanvas(key, frameWidth * 4, frameHeight * 4);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, frameWidth * 4, frameHeight * 4);
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        this.drawCharacter(ctx, col * frameWidth + 32, row * frameHeight + 24, shirt, accent, col);
      }
    }
    texture.refresh();
  }

  private ensureCropTexture() {
    if (this.textures.exists(AssetKey.cropTurnip)) {
      return;
    }

    const texture = this.textures.createCanvas(AssetKey.cropTurnip, 128, 32);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 128, 32);
    const heights = [8, 14, 20, 24];
    for (let i = 0; i < 4; i += 1) {
      const x = i * 32 + 16;
      ctx.fillStyle = '#2f7d32';
      ctx.fillRect(x - 2, 26 - heights[i], 4, heights[i]);
      ctx.fillRect(x - 8, 18 - i * 2, 7, 4);
      ctx.fillRect(x + 1, 15 - i * 2, 8, 4);
      if (i === 3) {
        ctx.fillStyle = '#f2f0dc';
        ctx.fillRect(x - 7, 19, 14, 8);
        ctx.fillStyle = '#b88bb8';
        ctx.fillRect(x - 5, 21, 10, 5);
      }
    }
    texture.refresh();
  }

  private ensureItemTexture() {
    if (this.textures.exists(AssetKey.itemsFarming)) {
      return;
    }

    const texture = this.textures.createCanvas(AssetKey.itemsFarming, 128, 32);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 128, 32);
    ctx.strokeStyle = '#2d2118';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, 6);
    ctx.lineTo(16, 26);
    ctx.moveTo(10, 10);
    ctx.lineTo(22, 10);
    ctx.stroke();

    ctx.fillStyle = '#7eb6d9';
    ctx.fillRect(44, 12, 14, 12);
    ctx.fillStyle = '#d6eef8';
    ctx.fillRect(48, 8, 8, 5);

    ctx.fillStyle = '#c8a45a';
    ctx.fillRect(76, 10, 12, 14);
    ctx.fillStyle = '#4c8c2b';
    ctx.fillRect(80, 7, 5, 5);

    ctx.fillStyle = '#f2f0dc';
    ctx.fillRect(106, 12, 14, 11);
    ctx.fillStyle = '#b88bb8';
    ctx.fillRect(108, 15, 10, 6);
    texture.refresh();
  }

  private ensureHouseTexture() {
    if (this.textures.exists(AssetKey.houseBase)) {
      return;
    }

    const texture = this.textures.createCanvas(AssetKey.houseBase, 640, 480);
    if (!texture) {
      return;
    }

    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#8b5a32';
    ctx.fillRect(40, 54, 560, 378);
    ctx.fillStyle = '#b9824d';
    for (let y = 74; y < 420; y += 28) {
      ctx.fillRect(60, y, 520, 3);
    }
    ctx.fillStyle = '#5d3423';
    ctx.fillRect(40, 54, 560, 34);
    ctx.fillRect(40, 398, 240, 34);
    ctx.fillRect(360, 398, 240, 34);
    ctx.fillRect(40, 54, 34, 378);
    ctx.fillRect(566, 54, 34, 378);
    ctx.fillStyle = '#6f3f2b';
    ctx.fillRect(90, 118, 154, 82);
    ctx.fillStyle = '#e9d39c';
    ctx.fillRect(110, 136, 114, 44);
    ctx.fillStyle = '#6a482e';
    ctx.fillRect(382, 132, 128, 72);
    ctx.fillStyle = '#3f2a1b';
    ctx.fillRect(286, 402, 68, 30);
    texture.refresh();
  }

  private createAnimations() {
    this.createWalkAnimation('down', [0, 1, 2, 3]);
    this.createWalkAnimation('left', [4, 5, 6, 7]);
    this.createWalkAnimation('right', [8, 9, 10, 11]);
    this.createWalkAnimation('up', [12, 13, 14, 15]);
    this.createNpcAnimation('idle-down', [0, 1], 2);
    this.createNpcAnimation('talk-down', [2, 3], 5);
  }

  private createWalkAnimation(direction: string, frames: number[]) {
    const key = `player-walk-${direction}`;
    if (this.anims.exists(key)) {
      return;
    }
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(AssetKey.playerWalk, { frames }),
      frameRate: 8,
      repeat: -1
    });
  }

  private createNpcAnimation(action: string, frames: number[], frameRate: number) {
    const key = `npc-seed-seller-${action}`;
    if (this.anims.exists(key)) {
      return;
    }
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(AssetKey.npcSeedSeller, { frames }),
      frameRate,
      repeat: -1
    });
  }

  private drawCharacter(ctx: CanvasRenderingContext2D, x: number, y: number, shirt: string, accent: string, step: number) {
    const bob = step === 1 || step === 3 ? 1 : 0;
    ctx.fillStyle = accent;
    ctx.fillRect(x + 9, y + 7 + bob, 14, 6);
    ctx.fillStyle = '#d8a070';
    ctx.fillRect(x + 11, y + 13 + bob, 10, 9);
    ctx.fillStyle = '#3a2418';
    ctx.fillRect(x + 10, y + 12 + bob, 12, 3);
    ctx.fillStyle = shirt;
    ctx.fillRect(x + 10, y + 24 + bob, 12, 13);
    ctx.fillStyle = '#3d2a1e';
    ctx.fillRect(x + 9, y + 37, 5, 6);
    ctx.fillRect(x + 18, y + 37, 5, 6);
  }

  private drawTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#6b3f24';
    ctx.fillRect(x - 8, y + 18, 16, 42);
    ctx.fillStyle = '#2f6f31';
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3e8a3e';
    ctx.beginPath();
    ctx.arc(x - 18, y - 12, 26, 0, Math.PI * 2);
    ctx.arc(x + 18, y - 8, 28, 0, Math.PI * 2);
    ctx.fill();
  }
}
