import type { Shape, Zone, ZoneData } from '../types/MapData';

export class InteractionSystem {
  constructor(private readonly data: ZoneData) {}

  findZone(point: { x: number; y: number }) {
    return this.data.zones.find((zone) => InteractionSystem.contains(zone, point));
  }

  static contains(shape: Shape, point: { x: number; y: number }) {
    if (shape.type === 'rect') {
      return point.x >= shape.x && point.x <= shape.x + shape.w && point.y >= shape.y && point.y <= shape.y + shape.h;
    }

    const dx = (point.x - shape.x) / shape.rx;
    const dy = (point.y - shape.y) / shape.ry;
    return dx * dx + dy * dy <= 1;
  }

  static promptFor(zone: Zone | undefined) {
    if (!zone) {
      return '';
    }
    if (zone.prompt) {
      return zone.prompt;
    }
    return zone.kind === 'shop' ? '按 E 与商人交谈' : '按 E 交互';
  }
}
