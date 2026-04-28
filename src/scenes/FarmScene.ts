import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { cropForTool } from '../config/crops';
import { createFallbackCollision, createFallbackProps, createFallbackZones } from '../data/fallback';
import { Npc } from '../objects/Npc';
import { Player } from '../objects/Player';
import { CollisionSystem } from '../systems/CollisionSystem';
import { EffectSystem } from '../systems/EffectSystem';
import { FarmingSystem, type FarmingAction } from '../systems/FarmingSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { OrderSystem } from '../systems/OrderSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ShopSystem } from '../systems/ShopSystem';
import type { CollisionData, Facing, PropData, PropPlacement, Zone, ZoneData } from '../types/MapData';
import type { CropId, GameSave } from '../types/GameState';

const CameraZoom = {
  min: 0.6,
  max: 2.2,
  step: 0.1,
  initial: 0.6,
  displayBase: 0.6
} as const;

type SpawnOverride = {
  x: number;
  y: number;
  facing?: Facing;
};

type FarmSceneData = {
  spawnOverride?: SpawnOverride;
};

export class FarmScene extends Phaser.Scene {
  private player?: Player;
  private seedSeller?: Npc;
  private state?: GameSave;
  private inventory?: InventorySystem;
  private farming?: FarmingSystem;
  private interaction?: InteractionSystem;
  private shop?: ShopSystem;
  private orders?: OrderSystem;
  private effects?: EffectSystem;
  private activeZone?: Zone;
  private lastSaveAt = 0;
  private lastInteractAt = 0;

  constructor() {
    super('FarmScene');
  }

  create(data: FarmSceneData = {}) {
    const collision = (this.cache.json.get(AssetKey.farmCollision) as CollisionData | undefined) ?? createFallbackCollision();
    const zones = (this.cache.json.get(AssetKey.farmZones) as ZoneData | undefined) ?? createFallbackZones();
    const props = (this.cache.json.get(AssetKey.farmProps) as PropData | undefined) ?? createFallbackProps();

    this.ensureUiScene();
    this.loadProps(props, () => this.buildWorld(collision, zones, props, data));
  }

  update(time: number) {
    if (!this.player || !this.state || !this.inventory || !this.farming || !this.interaction || !this.shop || !this.effects) {
      return;
    }

    this.player.update();
    const feet = this.player.getFeetPoint();
    this.farming.updateActivePlot(feet);
    this.activeZone = this.interaction.findZone(feet);

    if (this.player.wasInteractPressed() && time - this.lastInteractAt > 180) {
      this.lastInteractAt = time;
      this.handleInteraction(feet);
    }

    const inShop = this.activeZone?.kind === 'shop';
    this.seedSeller?.updatePresence(inShop);
    if (!inShop) {
      this.player.clearShopQueuedActions();
    }

    if (inShop && this.player.wasBuyPressed()) {
      const cropId = this.selectedSeedCrop() ?? 'turnip';
      const started = this.player.playAction('shop', () => {
        const result = this.shop?.buySeed(cropId);
        this.showMessage(result?.message ?? '商店还没准备好。');
        if (result?.changed) {
          this.effects?.playGold(feet);
        }
      });
      if (started) {
        this.seedSeller?.playInteraction('trade');
      }
    }

    if (inShop && this.player.wasSellPressed()) {
      const cropId = this.selectedSeedCrop() ?? this.inventory.firstSellableCrop();
      const started = this.player.playAction('shop', () => {
        const result = this.shop?.sellCrop(cropId);
        this.showMessage(result?.message ?? '商店还没准备好。');
        if (result?.changed) {
          this.effects?.playGold(feet);
        }
      });
      if (started) {
        this.seedSeller?.playInteraction('trade');
      }
    }

    if (inShop && this.player.wasUpgradePressed()) {
      const started = this.player.playAction('shop', () => {
        const result = this.shop?.buyUpgrade();
        this.showMessage(result?.message ?? '商店还没准备好。');
        if (result?.changed) {
          this.player?.setSpeedBonus(((this.state?.upgrades.shoeLevel ?? 1) - 1) * 18);
          this.effects?.playGold(feet);
        }
      });
      if (started) {
        this.seedSeller?.playInteraction('trade');
      }
    }

    if (this.player.wasResetPressed()) {
      SaveSystem.reset();
      this.scene.stop('UIScene');
      this.scene.restart();
      return;
    }

    this.state.player.x = this.player.x;
    this.state.player.y = this.player.y;
    this.state.player.facing = this.player.facing;
    if (time - this.lastSaveAt > 1000) {
      SaveSystem.save(this.state);
      this.lastSaveAt = time;
    }

    this.emitUiUpdate();
  }

  private buildWorld(collision: CollisionData, zones: ZoneData, props: PropData, data: FarmSceneData) {
    this.renderBackdrop(collision);
    this.add.image(0, 0, AssetKey.farmBase).setOrigin(0).setDepth(-1000);
    this.renderProps(props.props);
    this.renderProps(props.foreground, 10000);

    this.physics.world.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);
    this.cameras.main.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);

    this.state = SaveSystem.load(zones.fieldPlots, collision.spawn);
    if (data.spawnOverride) {
      this.state.player.x = data.spawnOverride.x;
      this.state.player.y = data.spawnOverride.y;
      this.state.player.facing = data.spawnOverride.facing ?? this.state.player.facing;
    }
    this.inventory = new InventorySystem(this.state);
    this.player = new Player(this, this.state.player.x, this.state.player.y, this.state.player.facing, (this.state.upgrades.shoeLevel - 1) * 18);
    this.seedSeller = new Npc(this, 1000, 390);

    const collisionSystem = new CollisionSystem(this, collision);
    this.physics.add.collider(this.player, collisionSystem.group);

    this.farming = new FarmingSystem(this, zones.fieldPlots, this.state, this.inventory);
    this.interaction = new InteractionSystem(zones);
    this.shop = new ShopSystem(this.state, this.inventory);
    this.orders = new OrderSystem(this.state, this.inventory);
    this.effects = new EffectSystem(this);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.setCameraZoom(CameraZoom.initial);
    this.setupZoomControls();
    this.emitUiUpdate();
    this.showMessage(data.spawnOverride ? '回到农场门口。' : '新的一天开始啦。查看订单，种下作物，别忘了留点体力。');
  }

  private renderBackdrop(collision: CollisionData) {
    const viewWidth = Math.ceil(this.cameras.main.width / CameraZoom.min);
    const viewHeight = Math.ceil(this.cameras.main.height / CameraZoom.min);
    const extraWidth = Math.max(0, viewWidth - collision.mapSize.width);
    const extraHeight = Math.max(0, viewHeight - collision.mapSize.height);

    if (extraWidth > 0) {
      const rightEdge = this.add.tileSprite(collision.mapSize.width, 0, extraWidth, Math.max(collision.mapSize.height, viewHeight), AssetKey.farmBase)
        .setOrigin(0)
        .setDepth(-2000);
      rightEdge.setTilePosition(collision.mapSize.width - extraWidth, 0);
    }

    if (extraHeight > 0) {
      const bottomEdge = this.add.tileSprite(0, collision.mapSize.height, collision.mapSize.width + extraWidth, extraHeight, AssetKey.farmBase)
        .setOrigin(0)
        .setDepth(-2000);
      bottomEdge.setTilePosition(0, collision.mapSize.height - extraHeight);
    }
  }

  private ensureUiScene() {
    if (!this.scene.isActive('UIScene')) {
      this.scene.launch('UIScene');
    }
  }

  private loadProps(props: PropData, onComplete: () => void) {
    const allProps = [...(props.props ?? []), ...(props.foreground ?? [])];
    let queued = 0;
    for (const prop of allProps) {
      const key = this.propKey(prop);
      if (prop.image && !this.textures.exists(key)) {
        this.load.image(key, this.toPublicPath(prop.image));
        queued += 1;
      }
    }

    if (queued === 0) {
      onComplete();
      return;
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, onComplete);
    this.load.start();
  }

  private renderProps(props: PropPlacement[] = [], depthOffset = 0) {
    for (const prop of props) {
      const key = this.propKey(prop);
      const [originX, originY] = this.propOrigin(prop.anchor);
      const depth = (prop.sortY ?? prop.y) + depthOffset;
      if (this.textures.exists(key)) {
        this.add.image(prop.x, prop.y, key)
          .setOrigin(originX, originY)
          .setDisplaySize(prop.w, prop.h)
          .setDepth(depth);
      } else {
        this.add.rectangle(prop.x, prop.y, prop.w, prop.h, 0x5d7f34, 0.45)
          .setOrigin(originX, originY)
          .setDepth(depth);
      }
    }
  }

  private handleInteraction(feet: { x: number; y: number }) {
    if (!this.player || !this.state || !this.farming || !this.effects) {
      return;
    }

    if (this.activeZone?.kind === 'shop') {
      const started = this.player.playAction('talk', () => {
        this.showMessage('种子商人：B 买当前种子，V 卖作物，U 买升级。完成订单会解锁新商品。');
      });
      if (started) {
        this.seedSeller?.playInteraction('talk');
      }
      return;
    }

    if (this.activeZone?.kind === 'enter_house') {
      const farmSpawnOverride: SpawnOverride = { x: this.player.x, y: this.player.y, facing: 'down' };
      this.state.player.x = this.player.x;
      this.state.player.y = this.player.y;
      this.state.player.facing = this.player.facing;
      SaveSystem.save(this.state);
      this.scene.start('HouseScene', { farmSpawnOverride });
      return;
    }

    if (this.activeZone?.kind === 'next_day') {
      this.effects.playSleep();
      this.player.playAction('sleep', () => {
        this.showMessage(this.farming?.advanceDay() ?? '新的一天开始。');
      }, 680);
      return;
    }

    if (this.activeZone?.kind === 'info') {
      this.player.playAction('talk', () => {
        const result = this.orders?.completeReadyOrders();
        this.showMessage(result?.message ?? '公告板还没有订单。');
        if (result?.changed) {
          this.effects?.playGold(feet);
        }
      });
      return;
    }

    const action = this.actionForTool();
    this.player.playAction(action, () => {
      const result = this.farming?.useTool(this.player?.selectedTool ?? 'hand', feet);
      if (!result) {
        return;
      }
      if (result.changed && result.action && result.point) {
        this.effects?.playFarming(result.action, result.point);
      }
      this.showMessage(result.message);
    });
  }

  private actionForTool(): FarmingAction {
    if (!this.player) return 'harvest';
    if (cropForTool(this.player.selectedTool)) return 'plant';
    if (this.player.selectedTool === 'watering_can') return 'water';
    return 'harvest';
  }

  private selectedSeedCrop(): CropId | null {
    return this.player ? cropForTool(this.player.selectedTool) : null;
  }

  private setupZoomControls() {
    this.input.keyboard?.on('keydown', this.handleZoomKey, this);
    this.input.on('wheel', this.handleWheelZoom, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown', this.handleZoomKey, this);
      this.input.off('wheel', this.handleWheelZoom, this);
    });
  }

  private handleZoomKey(event: KeyboardEvent) {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      this.changeCameraZoom(CameraZoom.step, true);
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      this.changeCameraZoom(-CameraZoom.step, true);
    }
    if (event.key === '0') {
      event.preventDefault();
      this.setCameraZoom(CameraZoom.initial, true);
    }
  }

  private handleWheelZoom(_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) {
    this.changeCameraZoom(deltaY < 0 ? CameraZoom.step : -CameraZoom.step, true);
  }

  private changeCameraZoom(delta: number, announce = false) {
    this.setCameraZoom(this.cameras.main.zoom + delta, announce);
  }

  private setCameraZoom(value: number, announce = false) {
    const zoom = Phaser.Math.Clamp(Number(value.toFixed(2)), CameraZoom.min, CameraZoom.max);
    this.cameras.main.setZoom(zoom);
    if (announce) {
      this.showMessage(`地图缩放 ${Math.round((zoom / CameraZoom.displayBase) * 100)}%`);
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

  private propOrigin(anchor: PropPlacement['anchor'] = 'center-bottom'): [number, number] {
    if (anchor === 'top-left') return [0, 0];
    if (anchor === 'center') return [0.5, 0.5];
    if (anchor === 'bottom-left') return [0, 1];
    return [0.5, 1];
  }

  private propKey(prop: PropPlacement) {
    return `prop-${prop.id}`;
  }

  private toPublicPath(path: string) {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
