import Phaser from 'phaser';
import { ControlText } from '../config/controls';
import type { ToolId } from '../types/MapData';

type UiState = {
  day: number;
  gold: number;
  turnipSeed: number;
  turnipCrop: number;
  tool: ToolId;
  prompt: string;
};

const toolLabel: Record<ToolId, string> = {
  seed: '种子',
  watering_can: '水壶',
  hand: '收获/手'
};

export class UIScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private messageTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('UIScene');
  }

  create() {
    this.statusText = this.add.text(16, 14, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#fff8d7',
      stroke: '#2b1a12',
      strokeThickness: 4
    });
    this.add.text(16, 84, `${ControlText.move}\n${ControlText.interact}\n${ControlText.tools}\n${ControlText.shop}\nR 重置存档`, {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#efe7bd',
      stroke: '#2b1a12',
      strokeThickness: 3
    });
    this.promptText = this.add.text(16, 472, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#fff0a0',
      stroke: '#2b1a12',
      strokeThickness: 4
    });
    this.messageText = this.add.text(16, 434, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#2b1a12',
      strokeThickness: 4
    });

    this.game.events.on('ui:update', this.updateUi, this);
    this.game.events.on('ui:message', this.showMessage, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off('ui:update', this.updateUi, this);
      this.game.events.off('ui:message', this.showMessage, this);
    });
  }

  private updateUi(state: UiState) {
    this.statusText.setText([
      `第 ${state.day} 天`,
      `金币：${state.gold}`,
      `种子：${state.turnipSeed}  作物：${state.turnipCrop}`,
      `当前工具：${toolLabel[state.tool]}`
    ]);
    this.promptText.setText(state.prompt);
  }

  private showMessage(message: string) {
    this.messageText.setText(message);
    this.messageTimer?.remove(false);
    this.messageTimer = this.time.delayedCall(2600, () => this.messageText.setText(''));
  }
}
