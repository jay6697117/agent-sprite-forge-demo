import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import type { Facing, ToolId } from '../types/MapData';

const idleFrame: Record<Facing, number> = {
  down: 0,
  left: 4,
  right: 8,
  up: 12
};

type PlayerAction = 'plant' | 'water' | 'harvest' | 'talk' | 'shop' | 'sleep';
type PlayerKeys = Record<
  'w' | 'a' | 's' | 'd' | 'e' | 'one' | 'two' | 'three' | 'four' | 'five' | 'b' | 'v' | 'u' | 'r',
  Phaser.Input.Keyboard.Key
>;

const actionTint: Record<PlayerAction, number> = {
  plant: 0xffe0a3,
  water: 0xa7ddff,
  harvest: 0xfff0a0,
  talk: 0xffffff,
  shop: 0xffd79a,
  sleep: 0xc9c7ff
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  facing: Facing;
  selectedTool: ToolId = 'turnip_seed';
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly keys: PlayerKeys;
  private speed: number;
  private actionLocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number, facing: Facing, speedBonus = 0) {
    super(scene, x, y, AssetKey.player, idleFrame[facing]);
    this.facing = facing;
    this.speed = 130 + speedBonus;
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
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
      b: Phaser.Input.Keyboard.KeyCodes.B,
      v: Phaser.Input.Keyboard.KeyCodes.V,
      u: Phaser.Input.Keyboard.KeyCodes.U,
      r: Phaser.Input.Keyboard.KeyCodes.R
    }) as PlayerKeys;

    keyboard.on('keydown', this.handleKeyDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off('keydown', this.handleKeyDown, this);
    });

    this.setOrigin(0.5, 0.5);
    this.setSize(20, 12);
    this.setOffset(14, 34);
    this.setCollideWorldBounds(true);
    this.setDepth(this.y);
  }

  update() {
    this.updateToolSelection();

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.actionLocked) {
      body.setVelocity(0, 0);
      this.setDepth(this.y + 18);
      return;
    }

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

  get isActing() {
    return this.actionLocked;
  }

  setSpeedBonus(speedBonus: number) {
    this.speed = 130 + speedBonus;
  }

  playAction(action: PlayerAction, onComplete: () => void, duration = 360) {
    if (this.actionLocked) {
      return false;
    }

    this.actionLocked = true;
    this.anims.stop();
    this.setFrame(idleFrame[this.facing]);
    this.setTint(actionTint[action]);

    const tweenConfig = this.actionTween(action, duration);
    this.scene.tweens.add({
      targets: this,
      ...tweenConfig,
      yoyo: true,
      ease: 'Sine.easeInOut',
      duration: duration / 2
    });

    this.scene.time.delayedCall(duration, () => {
      this.actionLocked = false;
      this.clearTint();
      this.setScale(1);
      this.setAngle(0);
      this.setAlpha(1);
      onComplete();
    });
    return true;
  }

  wasInteractPressed() {
    return !this.actionLocked && Phaser.Input.Keyboard.JustDown(this.keys.e);
  }

  wasBuyPressed() {
    return !this.actionLocked && Phaser.Input.Keyboard.JustDown(this.keys.b);
  }

  wasSellPressed() {
    return !this.actionLocked && Phaser.Input.Keyboard.JustDown(this.keys.v);
  }

  wasUpgradePressed() {
    return !this.actionLocked && Phaser.Input.Keyboard.JustDown(this.keys.u);
  }

  wasResetPressed() {
    return Phaser.Input.Keyboard.JustDown(this.keys.r);
  }

  private updateToolSelection() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) {
      this.selectedTool = 'turnip_seed';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) {
      this.selectedTool = 'wheat_seed';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) {
      this.selectedTool = 'strawberry_seed';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.four)) {
      this.selectedTool = 'watering_can';
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.five)) {
      this.selectedTool = 'hand';
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.key === '1' || event.code === 'Digit1' || event.code === 'Numpad1') {
      this.selectedTool = 'turnip_seed';
    }
    if (event.key === '2' || event.code === 'Digit2' || event.code === 'Numpad2') {
      this.selectedTool = 'wheat_seed';
    }
    if (event.key === '3' || event.code === 'Digit3' || event.code === 'Numpad3') {
      this.selectedTool = 'strawberry_seed';
    }
    if (event.key === '4' || event.code === 'Digit4' || event.code === 'Numpad4') {
      this.selectedTool = 'watering_can';
    }
    if (event.key === '5' || event.code === 'Digit5' || event.code === 'Numpad5') {
      this.selectedTool = 'hand';
    }
  }

  private actionTween(action: PlayerAction, duration: number) {
    if (action === 'plant') {
      return { scaleX: 1.08, scaleY: 0.86 };
    }
    if (action === 'water') {
      return { angle: this.facing === 'left' ? -10 : 10 };
    }
    if (action === 'harvest') {
      return { scaleX: 1.15, scaleY: 0.95 };
    }
    if (action === 'sleep') {
      return { alpha: 0.45 };
    }
    return { scale: 1.08, duration };
  }
}
