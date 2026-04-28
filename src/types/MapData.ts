export type Facing = 'down' | 'left' | 'right' | 'up';
export type ToolId = 'turnip_seed' | 'wheat_seed' | 'strawberry_seed' | 'watering_can' | 'hand';

export type RectShape = {
  id: string;
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
};

export type EllipseShape = {
  id: string;
  type: 'ellipse';
  x: number;
  y: number;
  rx: number;
  ry: number;
};

export type Shape = RectShape | EllipseShape;

export type CollisionData = {
  mapSize: { width: number; height: number };
  spawn: { x: number; y: number };
  blockers: Shape[];
};

export type Zone = Shape & {
  kind: 'shop' | 'next_day' | 'info';
  prompt?: string;
};

export type FieldPlot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ZoneData = {
  zones: Zone[];
  fieldPlots: FieldPlot[];
};

export type PropPlacement = {
  id: string;
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
  sortY?: number;
  layer?: 'props' | 'foreground';
  anchor?: 'center-bottom' | 'top-left' | 'center' | 'bottom-left';
};

export type PropData = {
  props: PropPlacement[];
  foreground?: PropPlacement[];
};
