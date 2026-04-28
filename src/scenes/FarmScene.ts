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
import type { CollisionData, PropData, PropPlacement, Zone, ZoneData } from '../types/MapData';
import type { CropId, GameSave } from '../types/GameState';

export class FarmScene extends Phaser.Scene {
  private player?: Player;
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

  create() {
    const collision = (this.cache.json.get(AssetKey.farmCollision) as CollisionData | undefined) ?? createFallbackCollision();
    const zones = (this.cache.json.get(AssetKey.farmZones) as ZoneData | undefined) ?? createFallbackZones();
    const props = (this.cache.json.get(AssetKey.farmProps) as PropData | undefined) ?? createFallbackProps();

    this.scene.launch('UIScene');
    this.loadProps(props, () => this.buildWorld(collision, zones, props));
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

    if (this.activeZone?.kind === 'shop' && this.player.wasBuyPressed()) {
      const cropId = this.selectedSeedCrop() ?? 'turnip';
      this.player.playAction('shop', () => {
        this.showMessage(this.shop?.buySeed(cropId) ?? '商店还没准备好。');
        this.effects?.playGold(feet);
      });
    }

    if (this.activeZone?.kind === 'shop' && this.player.wasSellPressed()) {
      const cropId = this.selectedSeedCrop() ?? this.inventory.firstSellableCrop();
      this.player.playAction('shop', () => {
        this.showMessage(this.shop?.sellCrop(cropId) ?? '商店还没准备好。');
        this.effects?.playGold(feet);
      });
    }

    if (this.activeZone?.kind === 'shop' && this.player.wasUpgradePressed()) {
      this.player.playAction('shop', () => {
        this.showMessage(this.shop?.buyUpgrade() ?? '商店还没准备好。');
        this.player?.setSpeedBonus(((this.state?.upgrades.shoeLevel ?? 1) - 1) * 18);
        this.effects?.playGold(feet);
      });
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

  private buildWorld(collision: CollisionData, zones: ZoneData, props: PropData) {
    this.add.image(0, 0, AssetKey.farmBase).setOrigin(0).setDepth(-1000);
    this.renderProps(props.props);

    this.physics.world.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);
    this.cameras.main.setBounds(0, 0, collision.mapSize.width, collision.mapSize.height);

    this.state = SaveSystem.load(zones.fieldPlots, collision.spawn);
    this.inventory = new InventorySystem(this.state);
    this.player = new Player(this, this.state.player.x, this.state.player.y, this.state.player.facing, (this.state.upgrades.shoeLevel - 1) * 18);
    new Npc(this, 820, 438);

    const collisionSystem = new CollisionSystem(this, collision);
    this.physics.add.collider(this.player, collisionSystem.group);

    this.farming = new FarmingSystem(this, zones.fieldPlots, this.state, this.inventory);
    this.interaction = new InteractionSystem(zones);
    this.shop = new ShopSystem(this.state, this.inventory);
    this.orders = new OrderSystem(this.state, this.inventory);
    this.effects = new EffectSystem(this);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.5);
    this.emitUiUpdate();
    this.showMessage('新的一天开始啦。查看订单，种下作物，别忘了留点体力。');
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

  private renderProps(props: PropPlacement[] = []) {
    for (const prop of props) {
      const key = this.propKey(prop);
      if (this.textures.exists(key)) {
        this.add.image(prop.x, prop.y, key)
          .setOrigin(0.5, 1)
          .setDisplaySize(prop.w, prop.h)
          .setDepth(prop.sortY ?? prop.y);
      } else {
        this.add.rectangle(prop.x, prop.y - prop.h / 2, prop.w, prop.h, 0x5d7f34, 0.45)
          .setDepth(prop.sortY ?? prop.y);
      }
    }
  }

  private handleInteraction(feet: { x: number; y: number }) {
    if (!this.player || !this.farming || !this.effects) {
      return;
    }

    if (this.activeZone?.kind === 'shop') {
      this.player.playAction('talk', () => {
        this.showMessage('种子商人：B 买当前种子，V 卖作物，U 买升级。完成订单会解锁新商品。');
      });
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
        this.showMessage(this.orders?.completeReadyOrders() ?? '公告板还没有订单。');
        this.effects?.playGold(feet);
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

  private propKey(prop: PropPlacement) {
    return `prop-${prop.id}`;
  }

  private toPublicPath(path: string) {
    return path.startsWith('/') ? path : `/${path}`;
  }
}
