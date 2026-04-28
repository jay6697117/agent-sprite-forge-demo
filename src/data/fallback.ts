import type { CollisionData, PropData, ZoneData } from '../types/MapData';

export function createFallbackCollision(): CollisionData {
  return {
    mapSize: { width: 1280, height: 960 },
    spawn: { x: 640, y: 760 },
    blockers: [
      { id: 'north-boundary', type: 'rect', x: 0, y: 0, w: 1280, h: 32 },
      { id: 'south-boundary', type: 'rect', x: 0, y: 928, w: 1280, h: 32 },
      { id: 'west-boundary', type: 'rect', x: 0, y: 0, w: 32, h: 960 },
      { id: 'east-boundary', type: 'rect', x: 1248, y: 0, w: 32, h: 960 },
      { id: 'farmhouse', type: 'rect', x: 116, y: 126, w: 220, h: 164 },
      { id: 'pond', type: 'ellipse', x: 980, y: 662, rx: 130, ry: 86 },
      { id: 'north-fence', type: 'rect', x: 370, y: 372, w: 390, h: 18 },
      { id: 'tree-01', type: 'ellipse', x: 1040, y: 214, rx: 34, ry: 24 },
      { id: 'tree-02', type: 'ellipse', x: 1110, y: 298, rx: 34, ry: 24 },
      { id: 'tree-03', type: 'ellipse', x: 1080, y: 810, rx: 34, ry: 24 },
      { id: 'shop-stall', type: 'rect', x: 776, y: 388, w: 120, h: 62 }
    ]
  };
}

export function createFallbackZones(): ZoneData {
  const fieldPlots = [];
  const startX = 424;
  const startY = 520;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      fieldPlots.push({
        id: `plot_${row * 4 + col + 1}`,
        x: startX + col * 40,
        y: startY + row * 40,
        w: 32,
        h: 32
      });
    }
  }

  return {
    zones: [
      {
        id: 'npc_shop',
        kind: 'shop',
        type: 'rect',
        x: 736,
        y: 376,
        w: 188,
        h: 132,
        prompt: '按 E 与种子商人交谈'
      },
      {
        id: 'sleep_next_day',
        kind: 'next_day',
        type: 'rect',
        x: 90,
        y: 190,
        w: 270,
        h: 170,
        prompt: '按 E 睡觉并进入下一天'
      },
      {
        id: 'order_board',
        kind: 'info',
        type: 'rect',
        x: 330,
        y: 292,
        w: 150,
        h: 82,
        prompt: '按 E 查看并交付今日订单'
      }
    ],
    fieldPlots
  };
}

export function createFallbackProps(): PropData {
  return { props: [] };
}
