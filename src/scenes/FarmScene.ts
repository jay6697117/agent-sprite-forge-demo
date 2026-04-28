import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { createFallbackCollision, createFallbackProps, createFallbackZones } from '../data/fallback';
import { Npc } from '../objects/Npc';
import { Player } from '../objects/Player';
import { CollisionSystem } from '../systems/CollisionSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { InteractionSystem } from '../systems/InteractionSystem';
import { InventorySystem } from '../systems/InventorySystem';
import { SaveSystem } from '../systems/SaveSystem';
import { ShopSystem } from '../systems/ShopSystem';
import type { CollisionData, PropData, PropPlacement, Zone, ZoneData } from '../types/MapData';
import type { GameSave } from '../types/GameState';

export class FarmScene extends Phaser.Scene {
  private player?: Player;
  private state?: GameSave;
  private inventory?: InventorySystem;
  private farming?: FarmingSystem;
  private interaction?: InteractionSystem;
  private shop?: ShopSystem;
  private activeZone?: Zone;
  private lastSaveAt = 0;

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
    if (!this.player || !this.state || !this.inventory || !this.farming || !this.interaction || !this.shop) {
      return;
    }

    this.player.update();
    const feet = this.player.getFeetPoint();
    this.farming.updateActivePlot(feet);
    this.activeZone = this.interaction.findZone(feet);

    if (this.player.wasInteractPressed()) {
      this.handleInteraction(feet);
    }

    if (this.activeZone?.kind === 'shop' && this.player.wasBuyPressed()) {
      this.showMessage(this.shop.buySeed());
    }

    if (this.activeZone?.kind === 'shop' && this.player.wasSellPressed()) {
      this.showMessage(this.shop.sellCrop());
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
    this.player = new Player(this, this.state.player.x, this.state.player.y, this.state.player.facing);
    new Npc(this, 820, 438);

    const collisionSystem = new CollisionSystem(this, collision);
    this.physics.add.collider(this.player, collisionSystem.group);

    this.farming = new FarmingSystem(this, zones.fieldPlots, this.state, this.inventory);
    this.interaction = new InteractionSystem(zones);
    this.shop = new ShopSystem(this.state, this.inventory);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1.5);
    this.emitUiUpdate();
    this.showMessage('农场准备好了。先去农田播种，靠近商人可买卖。');
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
    if (!this.player || !this.farming || !this.activeZone) {
      const message = this.farming?.useTool(this.player?.selectedTool ?? 'seed', feet);
      if (message) {
        this.showMessage(message);
      }
      return;
    }

    if (this.activeZone.kind === 'shop') {
      this.showMessage('种子商人：按 B 买种子，按 V 卖成熟作物。');
      return;
    }

    if (this.activeZone.kind === 'next_day') {
      this.showMessage(this.farming.advanceDay());
      return;
    }

    this.showMessage(this.farming.useTool(this.player.selectedTool, feet));
  }

  private emitUiUpdate() {
    if (!this.state || !this.player) {
      return;
    }

    this.game.events.emit('ui:update', {
      day: this.state.day,
      gold: this.state.gold,
      turnipSeed: this.state.inventory.turnipSeed,
      turnipCrop: this.state.inventory.turnipCrop,
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
