import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { Facing, ToolId } from '../types/MapData';

const idleFrame: Record<Facing, number> = {
  down: 0,
  left: 4,
  right: 8,
  up: 12
};

type PlayerKeys = Record<'w' | 'a' | 's' | 'd' | 'e' | 'one' | 'two' | 'three' | 'b' | 'v' | 'r', Phaser.Input.Keyboard.Key>;

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing;
  selectedTool: ToolId = 'seed';
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: PlayerKeys;
  private readonly speed = 130;

  constructor(scene: Phaser.Scene, x: number, y: number, facing: Facing) {
    super(scene, x, y, AssetKey.player, idleFrame[facing]);
    this.facing = facing;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is not available.');
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      b: Phaser.Input.Keyboard.KeyCodes.B,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      r: Phaser.Input.Keyboard.KeyCodes.R
    }) as PlayerKeys;

    this.setOrigin(0.5, 0.5);
    this.setSize(20, 12);
    this.setOffset(14, 34);
    this.setCollideWorldBounds(true);
    this.setDepth(this.y);
  }

  update() {
    this.updateToolSelection();

    const left = Boolean(this.cursors.left?.isDown || this.keys.a.isDown);
    const right = Boolean(this.cursors.right?.isDown || this.keys.d.isDown);
    const up = Boolean(this.cursors.up?.isDown || this.keys.w.isDown);
    const down = Boolean(this.cursors.down?.isDown || this.keys.s.isDown);

    let vx = 0;
    let vy = 0;
    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);
    if (vx !== 0 || vy !== 0) {
      body.velocity.normalize().scale(this.speed);
      this.facing = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 'left' : 'right') : (vy < 0 ? 'up' : 'down');
      this.anims.play(`player-walk-${this.facing}`, true);
    } else {
      body.setVelocity(0, 0);
      this.anims.stop();
      this.setFrame(idleFrame[this.facing]);
    }

    this.setDepth(this.y + 18);
  }

  getFeetPoint() {
    return { x: this.x, y: this.y + 18 };
  }

  wasInteractPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.e);
  }

  wasBuyPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.b);
  }

  wasSellPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.v);
  }

  wasResetPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.r);
  }

  private updateToolSelection() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.selectedTool = 'seed';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.selectedTool = 'watering_can';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      this.selectedTool = 'hand';
    }
  }
}
