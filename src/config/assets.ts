export const AssetKey = {
  farmBase: 'farm-base',
  farmPreview: 'farm-preview',
  player: 'player-farmer',
  npcSeedSeller: 'npc-seed-seller',
  cropTurnip: 'crop-turnip',
  itemsFarming: 'items-farming',
  farmCollision: 'farm-collision',
  farmZones: 'farm-zones',
  farmProps: 'farm-props'
} as const;

export const AssetPath = {
  farmBase: '/assets/map/farm/farm-base.png',
  farmPreview: '/assets/map/farm/farm-layered-preview.png',
  player: '/assets/sprites/player_farmer/sheet-transparent.png',
  npcSeedSeller: '/assets/sprites/npc_seed_seller/sheet-transparent.png',
  cropTurnip: '/assets/sprites/crop_turnip/sheet-transparent.png',
  itemsFarming: '/assets/sprites/items_farming/sheet-transparent.png',
  farmCollision: '/data/farm-collision.json',
  farmZones: '/data/farm-zones.json',
  farmProps: '/data/farm-props.json'
} as const;

export const FrameSize = {
  character: { frameWidth: 48, frameHeight: 48 },
  tile: { frameWidth: 32, frameHeight: 32 }
} as const;
