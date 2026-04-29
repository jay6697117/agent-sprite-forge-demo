import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { ControlText } from '../config/controls';
import { CROPS } from '../config/crops';
import type { FriendshipSave, Inventory, OrderSave, UnlockSave, UpgradeSave } from '../types/GameState';
import type { ToolId } from '../types/MapData';

type UiState = {
  day: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  inventory: Inventory;
  orders: OrderSave[];
  upgrades: UpgradeSave;
  friendship: FriendshipSave;
  unlocks: UnlockSave;
  tool: ToolId;
  prompt: string;
};

type ToolUi = {
  id: ToolId;
  key: string;
  name: string;
  box: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
};

const toolDefinitions: Array<Omit<ToolUi, 'box' | 'text'>> = [
  { id: 'turnip_seed', key: '1', name: '萝卜' },
  { id: 'wheat_seed', key: '2', name: '小麦' },
  { id: 'strawberry_seed', key: '3', name: '草莓' },
  { id: 'watering_can', key: '4', name: '水壶' },
  { id: 'hand', key: '5', name: '手' }
];

export class UIScene extends Phaser.Scene {
  private compactStatusPanel!: Phaser.GameObjects.Container;
  private compactDayText!: Phaser.GameObjects.Text;
  private compactGoldText!: Phaser.GameObjects.Text;
  private compactEnergyText!: Phaser.GameObjects.Text;
  private fullStatusPanel!: Phaser.GameObjects.Container;
  private orderPanel!: Phaser.GameObjects.Container;
  private toolbarPanel!: Phaser.GameObjects.Container;
  private inventoryPanel!: Phaser.GameObjects.Container;
  private helpPanel!: Phaser.GameObjects.Container;
  private dayText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;
  private energyText!: Phaser.GameObjects.Text;
  private reputationText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private orderTexts: Phaser.GameObjects.Text[] = [];
  private toolItems: ToolUi[] = [];
  private promptPanel!: Phaser.GameObjects.Container;
  private promptBg!: Phaser.GameObjects.Rectangle;
  private promptText!: Phaser.GameObjects.Text;
  private messagePanel!: Phaser.GameObjects.Container;
  private messageBg!: Phaser.GameObjects.Rectangle;
  private messageText!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;
  private fullHudOpen = false;
  private helpOpen = false;
  private orderBoardOpen = false;
  private hudKeysDown = new Set<string>();

  constructor() {
    super('UIScene');
  }

  create() {
    this.orderTexts = [];
    this.toolItems = [];
    this.fullHudOpen = false;
    this.helpOpen = false;
    this.orderBoardOpen = false;
    this.hudKeysDown.clear();

    this.createStatusPanel();
    this.createOrderPanel();
    this.createToolBar();
    this.createPromptBubble();
    this.createMessageBubble();
    this.registerHudKeys();
    this.applyHudVisibility();

    this.game.events.on('ui:update', this.updateUi, this);
    this.game.events.on('ui:message', this.showMessage, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ui:update', this.updateUi, this);
      this.game.events.off('ui:message', this.showMessage, this);
      this.unregisterHudKeys();
      this.messageTimer?.remove(false);
      this.messageTimer = undefined;
      this.tweens.killTweensOf(this.messagePanel);
    });
  }

  private createStatusPanel() {
    const compactChildren: Phaser.GameObjects.GameObject[] = [];
    compactChildren.push(
      this.add.rectangle(16, 14, 270, 42, 0x4b2d1a, 0.82).setOrigin(0).setStrokeStyle(2, 0xf4d28b, 0.9),
      this.add.rectangle(22, 20, 258, 30, 0x6b4424, 0.6).setOrigin(0).setStrokeStyle(1, 0x2d1a10, 0.65),
      this.addIcon(32, 35, 0, 17),
      this.addIcon(100, 35, 1, 16),
      this.addIcon(164, 35, 2, 16)
    );
    this.compactDayText = this.panelText(44, 26, 13, '#fff0b8');
    this.compactGoldText = this.panelText(112, 26, 13, '#ffe27a');
    this.compactEnergyText = this.panelText(176, 26, 13, '#a9f0aa');
    compactChildren.push(this.compactDayText, this.compactGoldText, this.compactEnergyText);
    this.compactStatusPanel = this.add.container(0, 0, compactChildren).setDepth(900);

    const fullChildren: Phaser.GameObjects.GameObject[] = [];
    fullChildren.push(
      this.add.rectangle(16, 14, 288, 118, 0x4b2d1a, 0.88).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95),
      this.add.rectangle(24, 22, 272, 102, 0x6b4424, 0.72).setOrigin(0).setStrokeStyle(1, 0x2d1a10, 0.75),
      this.addIcon(30, 40, 0, 22),
      this.addIcon(30, 64, 1, 19),
      this.addIcon(30, 87, 2, 19),
      this.addIcon(30, 109, 5, 18)
    );
    this.dayText = this.panelText(48, 30, 18, '#fff0b8');
    this.goldText = this.panelText(48, 55, 15, '#ffe27a');
    this.energyText = this.panelText(48, 78, 15, '#a9f0aa');
    this.reputationText = this.panelText(48, 101, 14, '#d8c7ff');
    fullChildren.push(this.dayText, this.goldText, this.energyText, this.reputationText);
    this.fullStatusPanel = this.add.container(0, 0, fullChildren).setDepth(900);
  }

  private createOrderPanel() {
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(
      this.add.rectangle(704, 14, 240, 156, 0x5a351f, 0.9).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95),
      this.addIcon(718, 38, 3, 24),
      this.add.text(744, 28, '今日订单板', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#fff0b8',
        stroke: '#2a170d',
        strokeThickness: 4
      })
    );
    for (let i = 0; i < 2; i += 1) {
      const note = this.add.rectangle(722, 58 + i * 50, 200, 42, 0xf1d58e, 0.95).setOrigin(0).setStrokeStyle(2, 0x8b5a2c, 0.95);
      const text = this.add.text(734, 64 + i * 50, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#3b2414',
        wordWrap: { width: 178 }
      });
      this.orderTexts.push(text);
      children.push(note, text);
    }
    children.push(this.add.text(724, 145, '去公告板按 E 交付', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#f7e5b3',
      stroke: '#2a170d',
      strokeThickness: 3
    }));
    this.orderPanel = this.add.container(0, 0, children).setDepth(900);
  }

  private createToolBar() {
    const toolbarChildren: Phaser.GameObjects.GameObject[] = [];
    toolbarChildren.push(this.add.rectangle(270, 468, 420, 52, 0x4b2d1a, 0.88).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95));
    toolDefinitions.forEach((tool, index) => {
      const x = 284 + index * 78;
      const box = this.add.rectangle(x, 476, 66, 36, 0x7b512d, 0.92).setOrigin(0).setStrokeStyle(2, 0xba8a4b, 0.95);
      const text = this.add.text(x + 33, 494, `${tool.key}\n${tool.name}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff4cf',
        align: 'center',
        stroke: '#2a170d',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.toolItems.push({ ...tool, box, text });
      toolbarChildren.push(box, text);
    });
    this.toolbarPanel = this.add.container(0, 0, toolbarChildren).setDepth(900);

    this.inventoryText = this.add.text(316, 426, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#fff2c8',
      stroke: '#2a170d',
      strokeThickness: 3
    });
    this.inventoryPanel = this.add.container(0, 0, [
      this.add.rectangle(304, 418, 352, 42, 0x4b2d1a, 0.82).setOrigin(0).setStrokeStyle(2, 0xf4d28b, 0.9),
      this.inventoryText
    ]).setDepth(900);

    const helpText = this.add.text(28, 154, [
      ControlText.move,
      ControlText.interact,
      ControlText.tools,
      ControlText.shop,
      ControlText.zoom,
      ControlText.hud,
      `${ControlText.help}，${ControlText.orders}`,
      'R 重置'
    ], {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#f6e6bd',
      stroke: '#2b1a12',
      strokeThickness: 3,
      lineSpacing: 3
    });
    this.helpPanel = this.add.container(0, 0, [
      this.add.rectangle(16, 142, 326, 150, 0x4b2d1a, 0.84).setOrigin(0).setStrokeStyle(2, 0xf4d28b, 0.9),
      helpText
    ]).setDepth(900);
  }

  private createPromptBubble() {
    this.promptBg = this.add.rectangle(480, 396, 420, 38, 0xfff0b8, 0.94).setStrokeStyle(2, 0x6b4424, 0.95);
    this.promptText = this.add.text(480, 396, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#3b2414'
    }).setOrigin(0.5);
    this.promptPanel = this.add.container(0, 0, [this.promptBg, this.promptText]).setDepth(1000).setVisible(false);
  }

  private createMessageBubble() {
    this.messageBg = this.add.rectangle(480, 76, 380, 34, 0x5a351f, 0.86).setStrokeStyle(2, 0xf4d28b, 0.9);
    this.messageText = this.add.text(480, 76, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#fff2c8',
      align: 'center',
      wordWrap: { width: 340 },
      stroke: '#2a170d',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.messagePanel = this.add.container(0, 0, [this.messageBg, this.messageText]).setDepth(1001).setVisible(false);
  }

  private registerHudKeys() {
    this.input.keyboard?.on('keydown', this.handleHudKeyDown, this);
    this.input.keyboard?.on('keyup', this.handleHudKeyUp, this);
  }

  private unregisterHudKeys() {
    this.input.keyboard?.off('keydown', this.handleHudKeyDown, this);
    this.input.keyboard?.off('keyup', this.handleHudKeyUp, this);
  }

  private handleHudKeyDown(event: KeyboardEvent) {
    const hudKey = this.hudKeyFromEvent(event);
    if (!hudKey) {
      return;
    }
    if (hudKey === 'tab') {
      event.preventDefault();
    }
    if (this.hudKeysDown.has(hudKey)) {
      return;
    }
    this.hudKeysDown.add(hudKey);
    if (hudKey === 'tab') {
      this.fullHudOpen = !this.fullHudOpen;
      this.helpOpen = this.fullHudOpen;
      this.orderBoardOpen = this.fullHudOpen;
      this.applyHudVisibility();
      return;
    }
    if (hudKey === 'h') {
      this.helpOpen = !this.helpOpen;
      this.applyHudVisibility();
      return;
    }
    this.orderBoardOpen = !this.orderBoardOpen;
    this.applyHudVisibility();
  }

  private handleHudKeyUp(event: KeyboardEvent) {
    const hudKey = this.hudKeyFromEvent(event);
    if (hudKey) {
      this.hudKeysDown.delete(hudKey);
    }
  }

  private hudKeyFromEvent(event: KeyboardEvent) {
    const key = event.key.toLowerCase();
    if (event.code === 'Tab' || key === 'tab') {
      return 'tab';
    }
    if (event.code === 'KeyH' || key === 'h') {
      return 'h';
    }
    if (event.code === 'KeyQ' || key === 'q') {
      return 'q';
    }
    return '';
  }

  private applyHudVisibility() {
    this.compactStatusPanel.setVisible(!this.fullHudOpen);
    this.fullStatusPanel.setVisible(this.fullHudOpen);
    this.orderPanel.setVisible(this.orderBoardOpen);
    this.toolbarPanel.setVisible(true);
    this.inventoryPanel.setVisible(this.fullHudOpen);
    this.helpPanel.setVisible(this.helpOpen);
  }

  private updateUi(state: UiState) {
    this.compactDayText.setText(`第${state.day}天`);
    this.compactGoldText.setText(`${state.gold}`);
    this.compactEnergyText.setText(`${state.energy}/${state.maxEnergy}`);
    this.dayText.setText(`第 ${state.day} 天`);
    this.goldText.setText(`金币 ${state.gold}`);
    this.energyText.setText(`体力 ${state.energy}/${state.maxEnergy}`);
    this.reputationText.setText(`声望 ${state.reputation}  商人好感 ${state.friendship.seedSeller}`);
    this.inventoryText.setText([
      `种子：萝卜 ${state.inventory.turnipSeed}  小麦 ${state.inventory.wheatSeed}  草莓 ${state.inventory.strawberrySeed}`,
      `作物：萝卜 ${state.inventory.turnipCrop}  小麦 ${state.inventory.wheatCrop}  草莓 ${state.inventory.strawberryCrop}`
    ]);

    for (let i = 0; i < this.orderTexts.length; i += 1) {
      const order = state.orders[i];
      this.orderTexts[i].setText(order ? this.orderLine(order, state.inventory) : '今天没有订单');
    }

    for (const item of this.toolItems) {
      const selected = item.id === state.tool;
      item.box.setFillStyle(selected ? 0xb8793d : 0x7b512d, selected ? 1 : 0.92);
      item.box.setStrokeStyle(selected ? 4 : 2, selected ? 0xfff0a0 : 0xba8a4b, 0.95);
      item.text.setScale(selected ? 1.08 : 1);
    }

    const prompt = state.prompt.trim();
    this.promptText.setText(prompt);
    this.promptPanel.setVisible(Boolean(prompt));
    this.applyHudVisibility();
  }

  private orderLine(order: OrderSave, inventory: Inventory) {
    const crop = CROPS[order.cropId];
    const have = inventory[crop.cropItem];
    const status = order.completed ? '完成' : `${Math.min(have, order.amount)}/${order.amount}`;
    return `${order.completed ? '已交付' : '进行中'} ${crop.name}\n${status}  奖励 ${order.rewardGold} 金`;
  }

  private showMessage(message: string) {
    this.messageText.setText(message);
    this.messagePanel.setVisible(true);
    this.messagePanel.setAlpha(1);
    this.messageTimer?.remove(false);
    this.tweens.killTweensOf(this.messagePanel);
    this.messageTimer = this.time.delayedCall(2600, () => {
      this.tweens.add({
        targets: this.messagePanel,
        alpha: 0,
        duration: 300,
        onComplete: () => this.messagePanel.setVisible(false)
      });
    });
  }

  private addIcon(x: number, y: number, frame: number, size: number) {
    return this.add.image(x, y, AssetKey.uiIcons, frame).setDisplaySize(size, size);
  }

  private panelText(x: number, y: number, fontSize: number, color: string) {
    return this.add.text(x, y, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: `${fontSize}px`,
      color,
      stroke: '#2a170d',
      strokeThickness: 3
    });
  }
}
