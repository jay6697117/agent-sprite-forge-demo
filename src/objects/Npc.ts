import Phaser from 'phaser';
import { AssetKey } from '../config/assets';

export type MerchantState = 'idle' | 'notice' | 'talk' | 'trade';

const MerchantAnimation = {
  idle: 'npc-seed-seller-idle-down',
  talk: 'npc-seed-seller-talk-down'
} as const;

const MerchantBubbleText: Record<Exclude<MerchantState, 'idle'>, string> = {
  notice: '欢迎，按 E 交谈',
  talk: '交谈中',
  trade: '交易中'
};

export class Npc extends Phaser.GameObjects.Sprite {
  private merchantState: MerchantState = 'idle';
  private playerNear = false;
  private restoreTimer?: Phaser.Time.TimerEvent;
  private bubbleText: Phaser.GameObjects.Text;
  private baseScaleX = 1;
  private baseScaleY = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, AssetKey.npcSeedSeller, 0);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDisplaySize(64, 64);
    this.baseScaleX = this.scaleX;
    this.baseScaleY = this.scaleY;
    this.setDepth(y);
    this.bubbleText = scene.add.text(x, y - 86, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#3b2414',
      backgroundColor: '#fff0b8',
      padding: { x: 8, y: 4 },
      stroke: '#6b4424',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(y + 120).setVisible(false);
    this.play(MerchantAnimation.idle);
  }

  updatePresence(isPlayerNear: boolean) {
    this.playerNear = isPlayerNear;
    if (this.merchantState === 'talk' || this.merchantState === 'trade') {
      return;
    }

    this.applyState(isPlayerNear ? 'notice' : 'idle');
  }

  playInteraction(state: 'talk' | 'trade', duration = 1000) {
    this.restoreTimer?.remove(false);
    this.applyState(state);
    this.restoreTimer = this.scene.time.delayedCall(duration, () => {
      this.restoreTimer = undefined;
      this.applyState(this.playerNear ? 'notice' : 'idle');
    });
  }

  destroy(fromScene?: boolean) {
    this.restoreTimer?.remove(false);
    this.bubbleText.destroy();
    super.destroy(fromScene);
  }

  private applyState(nextState: MerchantState) {
    if (this.merchantState === nextState) {
      return;
    }

    this.merchantState = nextState;
    this.clearTint();
    this.scene.tweens.killTweensOf(this);
    this.setAlpha(1);
    this.setScale(this.baseScaleX, this.baseScaleY);
    this.bubbleText.setVisible(nextState !== 'idle');

    if (nextState === 'idle') {
      this.play(MerchantAnimation.idle, true);
      return;
    }

    this.bubbleText.setText(MerchantBubbleText[nextState]);
    if (nextState === 'notice') {
      this.play(MerchantAnimation.idle, true);
      this.setTint(0xfff0b8);
      this.scene.tweens.add({
        targets: this,
        scaleX: this.baseScaleX * 1.1,
        scaleY: this.baseScaleY * 1.1,
        duration: 320,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      return;
    }

    this.play(MerchantAnimation.talk, true);
    this.setScale(this.baseScaleX * 1.12, this.baseScaleY * 1.12);
    if (nextState === 'trade') {
      this.setTint(0xffd79a);
    }
  }
}
