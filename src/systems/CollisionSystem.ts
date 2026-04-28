import type Phaser from 'phaser';
import type { CollisionData, Shape } from '../types/MapData';

export class CollisionSystem {
  readonly group: Phaser.Physics.Arcade.StaticGroup;

  constructor(private readonly scene: Phaser.Scene, data: CollisionData) {
    this.group = scene.physics.add.staticGroup();
    for (const blocker of data.blockers) {
      this.addBlocker(blocker);
    }
  }

  private addBlocker(blocker: Shape) {
    const rect = blocker.type === 'rect'
      ? { x: blocker.x, y: blocker.y, w: blocker.w, h: blocker.h }
      : { x: blocker.x - blocker.rx, y: blocker.y - blocker.ry, w: blocker.rx * 2, h: blocker.ry * 2 };

    const object = this.scene.add.rectangle(
      rect.x + rect.w / 2,
      rect.y + rect.h / 2,
      rect.w,
      rect.h,
      0xff0000,
      0
    );

    this.scene.physics.add.existing(object, true);
    const body = object.body as Phaser.Physics.Arcade.StaticBody;
    body.setSize(rect.w, rect.h);
    body.updateFromGameObject();
    this.group.add(object);
  }
}
