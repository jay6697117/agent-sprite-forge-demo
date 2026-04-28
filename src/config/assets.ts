export const AssetKey = {
  farmBase: 'farm-base',
  farmPreview: 'farm-preview',
  player: 'player-farmer',
  npcSeedSeller: 'npc-seed-seller',
  cropTurnip: 'crop-turnip',
  itemsFarming: 'items-farming',
  fxFarming: 'fx-farming',
  uiIcons: 'ui-icons',
  farmCollision: 'farm-collision',
  farmZones: 'farm-zones',
  farmProps: 'farm-props'
} as const;

export const AssetPath = {
  farmBase: '/assets/map/farm_v2/farm-base.png',
  farmPreview: '/assets/map/farm_v2/farm-layered-preview.png',
  player: '/assets/sprites/player_farmer_v2/action_sheet/sheet-transparent.png',
  npcSeedSeller: '/assets/sprites/npc_seed_seller_v2/sheet-transparent.png',
  cropTurnip: '/assets/sprites/crops_v2/sheet-transparent.png',
  itemsFarming: '/assets/sprites/ui_icons/sheet-transparent.png',
  fxFarming: '/assets/sprites/fx_farming/sheet-transparent.png',
  uiIcons: '/assets/sprites/ui_icons/sheet-transparent.png',
  farmCollision: '/data/farm-v2-collision.json',
  farmZones: '/data/farm-v2-zones.json',
  farmProps: '/data/farm-v2-props.json'
} as const;

export const FrameSize = {
  character: { frameWidth: 96, frameHeight: 96 },
  tile: { frameWidth: 128, frameHeight: 128 },
  fx: { frameWidth: 128, frameHeight: 128 },
  uiIcon: { frameWidth: 128, frameHeight: 128 }
} as const;
