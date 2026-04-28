import Phaser from 'phaser';
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

  constructor() {
    super('UIScene');
  }

  create() {
    this.createStatusPanel();
    this.createOrderPanel();
    this.createToolBar();
    this.createPromptBubble();
    this.createMessageBubble();

    this.game.events.on('ui:update', this.updateUi, this);
    this.game.events.on('ui:message', this.showMessage, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ui:update', this.updateUi, this);
      this.game.events.off('ui:message', this.showMessage, this);
    });
  }

  private createStatusPanel() {
    this.add.rectangle(16, 14, 288, 118, 0x4b2d1a, 0.88).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95);
    this.add.rectangle(24, 22, 272, 102, 0x6b4424, 0.72).setOrigin(0).setStrokeStyle(1, 0x2d1a10, 0.75);
    this.dayText = this.panelText(36, 30, 18, '#fff0b8');
    this.goldText = this.panelText(36, 55, 15, '#ffe27a');
    this.energyText = this.panelText(36, 78, 15, '#a9f0aa');
    this.reputationText = this.panelText(36, 101, 14, '#d8c7ff');
  }

  private createOrderPanel() {
    this.add.rectangle(704, 14, 240, 156, 0x5a351f, 0.9).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95);
    this.add.text(724, 28, '今日订单板', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#fff0b8',
      stroke: '#2a170d',
      strokeThickness: 4
    });
    for (let i = 0; i < 2; i += 1) {
      const note = this.add.rectangle(722, 58 + i * 50, 200, 42, 0xf1d58e, 0.95).setOrigin(0).setStrokeStyle(2, 0x8b5a2c, 0.95);
      note.setData('baseY', note.y);
      this.orderTexts.push(this.add.text(734, 64 + i * 50, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#3b2414',
        wordWrap: { width: 178 }
      }));
    }
    this.add.text(724, 145, '去公告板按 E 交付', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#f7e5b3',
      stroke: '#2a170d',
      strokeThickness: 3
    });
  }

  private createToolBar() {
    this.add.rectangle(220, 454, 520, 72, 0x4b2d1a, 0.9).setOrigin(0).setStrokeStyle(3, 0xf4d28b, 0.95);
    this.inventoryText = this.add.text(234, 432, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#fff2c8',
      stroke: '#2a170d',
      strokeThickness: 3
    });
    toolDefinitions.forEach((tool, index) => {
      const x = 244 + index * 96;
      const box = this.add.rectangle(x, 466, 78, 48, 0x7b512d, 0.92).setOrigin(0).setStrokeStyle(2, 0xba8a4b, 0.95);
      const text = this.add.text(x + 39, 490, `${tool.key}\n${tool.name}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fff4cf',
        align: 'center',
        stroke: '#2a170d',
        strokeThickness: 3
      }).setOrigin(0.5);
      this.toolItems.push({ ...tool, box, text });
    });
    this.add.text(18, 142, `${ControlText.move}\n${ControlText.interact}\n${ControlText.shop}\nR 重置`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#f6e6bd',
      stroke: '#2b1a12',
      strokeThickness: 3,
      lineSpacing: 4
    });
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
    this.messageBg = this.add.rectangle(480, 344, 560, 44, 0x5a351f, 0.94).setStrokeStyle(3, 0xf4d28b, 0.95);
    this.messageText = this.add.text(480, 344, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      color: '#fff2c8',
      align: 'center',
      wordWrap: { width: 520 },
      stroke: '#2a170d',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.messagePanel = this.add.container(0, 0, [this.messageBg, this.messageText]).setDepth(1001).setVisible(false);
  }

  private updateUi(state: UiState) {
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

    const unlockHint = state.unlocks.strawberry ? '' : '  草莓需声望 2 解锁';
    this.promptText.setText(state.prompt ? `${state.prompt}${unlockHint}` : '');
    this.promptPanel.setVisible(Boolean(state.prompt));
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
