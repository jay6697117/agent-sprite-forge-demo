import Phaser from 'phaser';
import { AssetKey } from '../config/assets';
import { CROPS } from '../config/crops';
import type { FriendshipSave, Inventory, OrderSave, UnlockSave, UpgradeSave } from '../types/GameState';
import type { ToolId } from '../types/MapData';

type ScreenBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

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
  playerBounds?: ScreenBounds;
};

type HudPanel = {
  container: Phaser.GameObjects.Container;
  bounds: ScreenBounds;
};

type ToolUi = {
  id: ToolId;
  key: string;
  name: string;
  box: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  iconSize: number;
  keyText: Phaser.GameObjects.Text;
  text: Phaser.GameObjects.Text;
};

type ToolIconSource = {
  texture: string;
  frame: number;
  size: number;
};

const toolDefinitions: Array<Omit<ToolUi, 'box' | 'icon' | 'iconSize' | 'keyText' | 'text'>> = [
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
  private introPanel!: Phaser.GameObjects.Container;
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
  private introOpen = false;
  private playerBounds?: ScreenBounds;
  private hudPanels: HudPanel[] = [];
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
    this.introOpen = true;
    this.playerBounds = undefined;
    this.hudPanels = [];
    this.hudKeysDown.clear();

    this.createStatusPanel();
    this.createOrderPanel();
    this.createToolBar();
    this.createPromptBubble();
    this.createMessageBubble();
    this.createIntroPanel();
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
      this.add.rectangle(16, 14, 270, 42, 0x3f2818, 0.72).setOrigin(0).setStrokeStyle(2, 0xf4d28b, 0.88),
      this.add.rectangle(22, 20, 258, 30, 0x6b4424, 0.5).setOrigin(0).setStrokeStyle(1, 0x2d1a10, 0.55),
      this.addIcon(32, 35, 0, 17),
      this.addIcon(100, 35, 1, 16),
      this.addIcon(164, 35, 2, 16)
    );
    this.compactDayText = this.panelText(44, 26, 13, '#fff0b8');
    this.compactGoldText = this.panelText(112, 26, 13, '#ffe27a');
    this.compactEnergyText = this.panelText(176, 26, 13, '#a9f0aa');
    compactChildren.push(this.compactDayText, this.compactGoldText, this.compactEnergyText);
    this.compactStatusPanel = this.add.container(0, 0, compactChildren).setDepth(900);
    this.registerHudPanel(this.compactStatusPanel, { left: 16, top: 14, right: 286, bottom: 56 });

    const fullChildren: Phaser.GameObjects.GameObject[] = [];
    fullChildren.push(
      this.add.rectangle(16, 14, 238, 82, 0x2f2118, 0.82).setOrigin(0).setStrokeStyle(2, 0xeac06f, 0.9),
      this.add.rectangle(22, 20, 226, 70, 0x5b3a22, 0.48).setOrigin(0).setStrokeStyle(1, 0x160d08, 0.45),
      this.addIcon(36, 36, 5, 16),
      this.add.text(56, 27, '状态', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#fff4c7',
        stroke: '#201109',
        strokeThickness: 3
      }),
      this.add.rectangle(34, 48, 188, 1, 0xf4d28b, 0.36).setOrigin(0),
      this.addIcon(35, 62, 0, 14),
      this.addIcon(35, 81, 1, 14),
      this.addIcon(126, 62, 2, 14),
      this.addIcon(126, 81, 5, 14)
    );
    this.dayText = this.panelText(52, 54, 12, '#fff0b8');
    this.goldText = this.panelText(52, 73, 12, '#ffe27a');
    this.energyText = this.panelText(143, 54, 12, '#a9f0aa');
    this.reputationText = this.panelText(143, 73, 11, '#d8c7ff');
    fullChildren.push(this.dayText, this.goldText, this.energyText, this.reputationText);
    this.fullStatusPanel = this.add.container(0, 0, fullChildren).setDepth(900);
    this.registerHudPanel(this.fullStatusPanel, { left: 16, top: 14, right: 254, bottom: 96 });
  }

  private createOrderPanel() {
    const children: Phaser.GameObjects.GameObject[] = [];
    children.push(
      this.add.rectangle(724, 14, 220, 122, 0x2f2118, 0.84).setOrigin(0).setStrokeStyle(2, 0xeac06f, 0.92),
      this.add.rectangle(730, 20, 208, 110, 0x5b3a22, 0.5).setOrigin(0).setStrokeStyle(1, 0x160d08, 0.46),
      this.addIcon(746, 36, 3, 16),
      this.add.text(768, 27, '订单', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#fff4c7',
        stroke: '#201109',
        strokeThickness: 3
      })
    );
    for (let i = 0; i < 2; i += 1) {
      const note = this.add.rectangle(742, 52 + i * 34, 178, 28, 0xf1d58e, 0.9).setOrigin(0).setStrokeStyle(1, 0x8b5a2c, 0.78);
      const pin = this.add.circle(750, 61 + i * 34, 3, 0xc65f35, 0.92).setStrokeStyle(1, 0x6f2a18, 0.82);
      const text = this.add.text(760, 55 + i * 34, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#3b2414',
        wordWrap: { width: 152 }
      });
      this.orderTexts.push(text);
      children.push(note, pin, text);
    }
    children.push(this.add.text(744, 117, 'E 交付  Q 查看', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#f7e5b3',
      stroke: '#201109',
      strokeThickness: 2
    }));
    this.orderPanel = this.add.container(0, 0, children).setDepth(900);
    this.registerHudPanel(this.orderPanel, { left: 724, top: 14, right: 944, bottom: 136 });
  }

  private createToolBar() {
    const toolbarChildren: Phaser.GameObjects.GameObject[] = [];
    toolbarChildren.push(
      this.add.rectangle(230, 462, 500, 68, 0x2a1b12, 0.86).setOrigin(0).setStrokeStyle(3, 0xeac06f, 0.92),
      this.add.rectangle(240, 472, 480, 48, 0x5b3a22, 0.52).setOrigin(0).setStrokeStyle(1, 0x160d08, 0.44),
      this.add.text(248, 446, '工具栏', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff0b8',
        stroke: '#201109',
        strokeThickness: 2
      })
    );
    toolDefinitions.forEach((tool, index) => {
      const x = 256 + index * 90;
      const selected = index === 0;
      const iconSource = this.toolIconSource(tool.id);
      const box = this.add.rectangle(x, 477, 72, 38, selected ? 0xb8793d : 0x68411f, selected ? 0.95 : 0.78)
        .setOrigin(0)
        .setStrokeStyle(selected ? 3 : 2, selected ? 0xfff0a0 : 0xba8a4b, selected ? 0.98 : 0.76);
      const keyText = this.add.text(x + 10, 488, tool.key, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#fff8d8',
        stroke: '#201109',
        strokeThickness: 2
      }).setOrigin(0.5);
      const icon = this.add.image(x + 32, 496, iconSource.texture, iconSource.frame).setDisplaySize(iconSource.size, iconSource.size);
      const text = this.add.text(x + 54, 499, tool.name, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#fff4cf',
        align: 'center',
        stroke: '#201109',
        strokeThickness: 2
      }).setOrigin(0.5);
      this.toolItems.push({ ...tool, box, icon, iconSize: iconSource.size, keyText, text });
      toolbarChildren.push(box, keyText, icon, text);
    });
    this.toolbarPanel = this.add.container(0, 0, toolbarChildren).setDepth(900);
    this.registerHudPanel(this.toolbarPanel, { left: 230, top: 446, right: 730, bottom: 530 });

    this.inventoryText = this.add.text(374, 437, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#fff2c8',
      stroke: '#201109',
      strokeThickness: 2,
      lineSpacing: 2,
      wordWrap: { width: 238 }
    });
    this.inventoryPanel = this.add.container(0, 0, [
      this.add.rectangle(306, 428, 348, 44, 0x2f2118, 0.82).setOrigin(0).setStrokeStyle(2, 0xeac06f, 0.86),
      this.add.rectangle(312, 434, 336, 32, 0x5b3a22, 0.46).setOrigin(0).setStrokeStyle(1, 0x160d08, 0.4),
      this.addIcon(330, 450, 4, 16),
      this.add.text(350, 438, '背包', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        color: '#fff0b8',
        stroke: '#201109',
        strokeThickness: 2
      }),
      this.inventoryText
    ]).setDepth(900);
    this.registerHudPanel(this.inventoryPanel, { left: 306, top: 428, right: 654, bottom: 472 });

    const helpText = this.add.text(34, 136, [
      '移动 WASD    操作 E    工具 1-5',
      '买卖 B/V     升级 U    订单 Q    HUD Tab'
    ], {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#fff0c8',
      stroke: '#201109',
      strokeThickness: 2,
      lineSpacing: 5
    });
    this.helpPanel = this.add.container(0, 0, [
      this.add.rectangle(16, 106, 286, 76, 0x2f2118, 0.82).setOrigin(0).setStrokeStyle(2, 0xeac06f, 0.86),
      this.add.rectangle(22, 112, 274, 64, 0x5b3a22, 0.44).setOrigin(0).setStrokeStyle(1, 0x160d08, 0.38),
      this.addIcon(34, 123, 4, 15),
      this.add.text(54, 116, '帮助', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff4c7',
        stroke: '#201109',
        strokeThickness: 3
      }),
      helpText
    ]).setDepth(900);
    this.registerHudPanel(this.helpPanel, { left: 16, top: 106, right: 302, bottom: 182 });
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

  private createIntroPanel() {
    const overlay = this.add.rectangle(0, 0, 960, 540, 0x000000, 0.46).setOrigin(0).setInteractive();
    overlay.on('pointerdown', () => this.closeIntroPanel());
    const buttonBg = this.add.rectangle(480, 442, 190, 42, 0x2f7d46, 0.96).setStrokeStyle(3, 0xf4d28b, 0.95);
    const buttonText = this.add.text(480, 442, '开始游戏', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#fff8d8',
      stroke: '#15351e',
      strokeThickness: 4
    }).setOrigin(0.5);
    buttonBg.setInteractive({ useHandCursor: true });
    buttonText.setInteractive({ useHandCursor: true });
    buttonBg.on('pointerdown', () => this.closeIntroPanel());
    buttonText.on('pointerdown', () => this.closeIntroPanel());

    const body = this.add.text(188, 138, [
      '玩法目标',
      '种下作物、浇水、成熟后收获；完成订单赚钱，去商人那里买种子和升级。',
      '',
      '基础流程',
      '1. 用 1 / 2 / 3 选择种子，在田地旁按 E 播种。',
      '2. 用 4 选择水壶，给作物浇水；成熟后用 5 选择手来收获。',
      '3. 去公告板交订单；去商人旁按 B 买、V 卖、U 升级。'
    ], {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      color: '#fff3cf',
      stroke: '#2a170d',
      strokeThickness: 3,
      lineSpacing: 6,
      wordWrap: { width: 584 }
    });
    const keys = this.add.text(188, 330, [
      '常用按键：WASD / 方向键移动，E 操作，Tab 展开 HUD，H 帮助，Q 订单板。',
      '地图缩放：+ / - / 鼠标滚轮，0 复位。卡住或想重开时按 R 重置。',
      '关闭说明：点击“开始游戏”，或按 Enter / Space / Esc。'
    ], {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#f8e7b9',
      stroke: '#2a170d',
      strokeThickness: 3,
      lineSpacing: 7,
      wordWrap: { width: 584 }
    });

    this.introPanel = this.add.container(0, 0, [
      overlay,
      this.add.rectangle(480, 270, 660, 414, 0x4b2d1a, 0.96).setStrokeStyle(4, 0xf4d28b, 0.98),
      this.add.rectangle(480, 270, 626, 380, 0x6b4424, 0.66).setStrokeStyle(2, 0x2d1a10, 0.65),
      this.add.text(480, 94, '欢迎来到小农场', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '28px',
        color: '#fff0b8',
        stroke: '#2a170d',
        strokeThickness: 6
      }).setOrigin(0.5),
      this.add.text(480, 120, '先看 30 秒，后面就不会迷路。', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f7e5b3',
        stroke: '#2a170d',
        strokeThickness: 3
      }).setOrigin(0.5),
      body,
      keys,
      buttonBg,
      buttonText
    ]).setDepth(1200).setVisible(true);
  }

  private closeIntroPanel() {
    if (!this.introOpen) {
      return;
    }
    this.introOpen = false;
    this.introPanel.setVisible(false);
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
    if (this.introOpen) {
      if (this.introCloseKeyFromEvent(event)) {
        event.preventDefault();
        this.closeIntroPanel();
      }
      return;
    }

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

  private introCloseKeyFromEvent(event: KeyboardEvent) {
    return event.code === 'Enter' || event.code === 'Space' || event.code === 'Escape' || event.key === ' ';
  }

  private applyHudVisibility() {
    this.compactStatusPanel.setVisible(!this.fullHudOpen);
    this.fullStatusPanel.setVisible(this.fullHudOpen);
    this.orderPanel.setVisible(this.orderBoardOpen);
    this.toolbarPanel.setVisible(true);
    this.inventoryPanel.setVisible(this.fullHudOpen);
    this.helpPanel.setVisible(this.helpOpen);
    this.updateHudTransparency();
  }

  private updateUi(state: UiState) {
    this.playerBounds = state.playerBounds;
    this.compactDayText.setText(`第${state.day}天`);
    this.compactGoldText.setText(`${state.gold}`);
    this.compactEnergyText.setText(`${state.energy}/${state.maxEnergy}`);
    this.dayText.setText(`第${state.day}天`);
    this.goldText.setText(`${state.gold}金`);
    this.energyText.setText(`${state.energy}/${state.maxEnergy}`);
    this.reputationText.setText(`${state.reputation}声 ${state.friendship.seedSeller}好`);
    this.inventoryText.setText([
      `种子：萝${state.inventory.turnipSeed} 小麦${state.inventory.wheatSeed} 草莓${state.inventory.strawberrySeed}`,
      `作物：萝${state.inventory.turnipCrop} 小麦${state.inventory.wheatCrop} 草莓${state.inventory.strawberryCrop}`
    ]);

    for (let i = 0; i < this.orderTexts.length; i += 1) {
      const order = state.orders[i];
      this.orderTexts[i].setText(order ? this.orderLine(order, state.inventory) : '今天没有订单');
    }

    for (const item of this.toolItems) {
      const selected = item.id === state.tool;
      item.box.setFillStyle(selected ? 0xb8793d : 0x68411f, selected ? 0.98 : 0.82);
      item.box.setStrokeStyle(selected ? 4 : 2, selected ? 0xfff0a0 : 0xba8a4b, selected ? 1 : 0.86);
      const iconDisplaySize = item.iconSize * (selected ? 1.08 : 1);
      item.icon.setDisplaySize(iconDisplaySize, iconDisplaySize);
      item.icon.setAlpha(selected ? 1 : 0.88);
      item.keyText.setScale(selected ? 1.08 : 1);
      item.text.setScale(selected ? 1.06 : 1);
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
    return `${crop.name} ${status}\n奖励 ${order.rewardGold}金`;
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

  private registerHudPanel(container: Phaser.GameObjects.Container, bounds: ScreenBounds) {
    this.hudPanels.push({ container, bounds });
  }

  private updateHudTransparency() {
    for (const panel of this.hudPanels) {
      if (!panel.container.visible || !this.playerBounds) {
        panel.container.setAlpha(1);
        continue;
      }
      panel.container.setAlpha(this.boundsOverlap(panel.bounds, this.playerBounds) ? 0.56 : 1);
    }
  }

  private boundsOverlap(a: ScreenBounds, b: ScreenBounds) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  private toolIconSource(toolId: ToolId): ToolIconSource {
    if (toolId === 'turnip_seed') {
      return { texture: AssetKey.cropTurnip, frame: 3, size: 40 };
    }
    if (toolId === 'wheat_seed') {
      return { texture: AssetKey.cropTurnip, frame: 7, size: 40 };
    }
    if (toolId === 'strawberry_seed') {
      return { texture: AssetKey.cropTurnip, frame: 11, size: 40 };
    }
    if (toolId === 'watering_can') {
      return { texture: AssetKey.itemsFarming, frame: 1, size: 36 };
    }
    return { texture: AssetKey.itemsFarming, frame: 0, size: 36 };
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
