import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { createFallbackCollision, createFallbackZones } from '../data/fallback';
import { Player } from '../objects/Player';
import { CollisionSystem } from '../systems/CollisionSystem';
import { advanceDayState } from '../systems/DaySystem';
import { EffectSystem } from '../systems/EffectSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import type { GameSave } from '../types/GameState';
import type { CollisionData, Facing, Zone, ZoneData } from '../types/MapData';

type SpawnOverride = {
  x: number;
  y: number;
  facing?: Facing;
};

type HouseSceneData = {
  farmSpawnOverride?: SpawnOverride;
  spawnOverride?: SpawnOverride;
};

const SleepPosition = { x: 124, y: 174 };
const WakePosition = { x: 152, y: 266 };

export class HouseScene extends Phaser.Scene {
  private player?: Player;
  private state?: GameSave;
  private interaction?: InteractionSystem;
  private effects?: EffectSystem;
  private activeZone?: Zone;
  private farmSpawnOverride: SpawnOverride = { x: 190, y: 315, facing: 'down' };
  private lastInteractAt = 0;

  constructor() {
    super('HouseScene');
  }

  create(data: HouseSceneData = {}) {
    const collision = (this.cache.json.get(AssetKey.houseCollision) as CollisionData | undefined) ?? createFallbackHouseCollision();
    const zones = (this.cache.json.get(AssetKey.houseZones) as ZoneData | undefined) ?? createFallbackHouseZones();
    const farmZones = (this.cache.json.get(AssetKey.farmZones) as ZoneData | undefined) ?? createFallbackZones();
    const farmCollision = (this.cache.json.get(AssetKey.farmCollision) as CollisionData | undefined) ?? createFallbackCollision();
    const spawn = data.spawnOverride ?? { ...collision.spawn, facing: 'up' as Facing };

    this.farmSpawnOverride = data.farmSpawnOverride ?? this.defaultFarmSpawn(farmZones);
    this.ensureUiScene();
    this.add.image(0, 0, AssetKey.houseBase).setOrigin(0).setDisplaySize(collision.mapSize.width, collision.mapSize.height).setDepth(-1000);
    this.physics.world.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);
    this.cameras.main.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);

    this.state = SaveSystem.load(farmZones.fieldPlots, farmCollision.spawn);
    this.player = new Player(this, spawn.x, spawn.y, spawn.facing ?? 'up', (this.state.upgrades.shoeLevel - 1) * 18);

    const collisionSystem = new CollisionSystem(this, collision);
    this.physics.add.collider(this.player, collisionSystem.group);

    this.interaction = new InteractionSystem(zones);
    this.effects = new EffectSystem(this);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.5);
    this.emitUiUpdate();
    this.showMessage('回到屋里了。可以睡觉，也可以从门口回农场。');
  }

  update(time: number) {
    if (!this.player || !this.state || !this.interaction || !this.effects) {
      return;
    }

    this.player.update();
    const feet = this.player.getFeetPoint();
    this.activeZone = this.findActiveZone(feet);

    if (this.player.wasInteractPressed() && time - this.lastInteractAt > 180) {
      this.lastInteractAt = time;
      this.handleInteraction();
    }

    if (this.player.wasResetPressed()) {
      SaveSystem.reset();
      this.scene.stop('UIScene');
      this.scene.start('FarmScene');
      return;
    }

    this.emitUiUpdate();
  }

  private handleInteraction() {
    if (!this.player || !this.state || !this.effects) {
      return;
    }

    if (this.activeZone?.kind === 'exit_house') {
      this.scene.start('FarmScene', { spawnOverride: this.farmSpawnOverride });
      return;
    }

    if (this.activeZone?.kind === 'bed_sleep' || this.activeZone?.kind === 'next_day') {
      const state = this.state;
      this.player.setPosition(SleepPosition.x, SleepPosition.y);
      this.player.facing = 'right';
      this.effects.playSleep();
      this.player.playAction('sleep', () => {
        const message = advanceDayState(state);
        SaveSystem.save(state);
        this.player?.setPosition(WakePosition.x, WakePosition.y);
        this.showMessage(message);
      }, 900);
      return;
    }

    this.showMessage('屋里可以睡觉，也可以从门口回农场。');
  }

  private findActiveZone(feet: { x: number; y: number }) {
    const directZone = this.interaction?.findZone(feet);
    if (directZone || !this.player || !this.interaction) {
      return directZone;
    }

    const reachPoint = { x: feet.x, y: feet.y };
    if (this.player.facing === 'left') reachPoint.x -= 44;
    if (this.player.facing === 'right') reachPoint.x += 44;
    if (this.player.facing === 'up') reachPoint.y -= 44;
    if (this.player.facing === 'down') reachPoint.y += 44;
    return this.interaction.findZone(reachPoint);
  }

  private ensureUiScene() {
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
  }

  private emitUiUpdate() {
    if (!this.state || !this.player) {
      return;
    }

    this.game.events.emit('ui:update', {
      day: this.state.day,
      gold: this.state.gold,
      energy: this.state.energy,
      maxEnergy: this.state.maxEnergy,
      reputation: this.state.reputation,
      inventory: this.state.inventory,
      orders: this.state.orders,
      upgrades: this.state.upgrades,
      friendship: this.state.friendship,
      unlocks: this.state.unlocks,
      tool: this.player.selectedTool,
      prompt: InteractionSystem.promptFor(this.activeZone)
    });
  }

  private showMessage(message: string) {
    this.game.events.emit('ui:message', message);
    this.emitUiUpdate();
  }

  private defaultFarmSpawn(farmZones: ZoneData): SpawnOverride {
    const door = farmZones.zones.find((zone) => zone.kind === 'enter_house');
    if (!door) {
      return { x: 190, y: 315, facing: 'down' };
    }
    if (door.type === 'rect') {
      return { x: door.x + door.w / 2, y: door.y + door.h / 2, facing: 'down' };
    }
    return { x: door.x, y: door.y, facing: 'down' };
  }
}

function createFallbackHouseCollision(): CollisionData {
  return {
    mapSize: { width: 640, height: 480 },
    spawn: { x: 320, y: 414 },
    blockers: [
      { id: 'north-boundary', type: 'rect', x: 0, y: 0, w: 640, h: 24 },
      { id: 'south-boundary-left', type: 'rect', x: 0, y: 456, w: 270, h: 24 },
      { id: 'south-boundary-right', type: 'rect', x: 370, y: 456, w: 270, h: 24 },
      { id: 'west-boundary', type: 'rect', x: 0, y: 0, w: 24, h: 480 },
      { id: 'east-boundary', type: 'rect', x: 616, y: 0, w: 24, h: 480 },
      { id: 'bed', type: 'rect', x: 64, y: 72, w: 120, h: 156 },
      { id: 'cabinet', type: 'rect', x: 260, y: 64, w: 120, h: 48 },
      { id: 'table', type: 'rect', x: 422, y: 92, w: 116, h: 78 },
      { id: 'chair', type: 'rect', x: 456, y: 176, w: 48, h: 42 },
      { id: 'storage-crate-left', type: 'rect', x: 72, y: 336, w: 72, h: 64 },
      { id: 'storage-crate-right', type: 'rect', x: 164, y: 352, w: 76, h: 48 }
    ]
  };
}

function createFallbackHouseZones(): ZoneData {
  return {
    zones: [
      { id: 'bed_sleep', kind: 'bed_sleep', type: 'rect', x: 72, y: 232, w: 150, h: 58, prompt: '按 E 上床睡觉并进入下一天' },
      { id: 'exit_house', kind: 'exit_house', type: 'rect', x: 240, y: 386, w: 160, h: 90, prompt: '按 E 出门' }
    ],
    fieldPlots: []
  };
}
