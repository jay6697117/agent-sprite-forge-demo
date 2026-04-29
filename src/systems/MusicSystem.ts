import Phaser from 'phaser';
import { AssetKey } from '../config/assets';

const MusicVolume = 0.22;

let backgroundMusic: Phaser.Sound.BaseSound | undefined;
let waitingForUnlock = false;

export function startBackgroundMusic(scene: Phaser.Scene) {
  if (backgroundMusic?.isPlaying) {
    return;
  }

  const play = () => {
    waitingForUnlock = false;
    if (!backgroundMusic || backgroundMusic.pendingRemove) {
      backgroundMusic = scene.sound.add(AssetKey.farmBgm, { loop: true, volume: MusicVolume });
    }
    if (!backgroundMusic.isPlaying) {
      backgroundMusic.play();
    }
  };

  if (scene.sound.locked) {
    if (!waitingForUnlock) {
      waitingForUnlock = true;
      scene.sound.once(Phaser.Sound.Events.UNLOCKED, play);
    }
    return;
  }

  play();
}
