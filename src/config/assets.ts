export const AssetKey = {
  farmBase: 'farm-base',
  farmPreview: 'farm-preview',
  player: 'player-farmer',
  playerWalk: 'player-farmer-walk',
  npcSeedSeller: 'npc-seed-seller',
  cropTurnip: 'crop-turnip',
  itemsFarming: 'items-farming',
  fxFarming: 'fx-farming',
  uiIcons: 'ui-icons',
  farmCollision: 'farm-collision',
  farmZones: 'farm-zones',
  farmProps: 'farm-props',
  houseBase: 'house-base',
  bedBlanket: 'bed-blanket',
  houseCollision: 'house-collision',
  houseZones: 'house-zones',
  farmBgm: 'farm-bgm'
} as const;

export const AssetPath = {
  farmBase: '/assets/map/farm_v5/farm-base.png',
  farmPreview: '/assets/map/farm_v2/farm-layered-preview.png',
  player: '/assets/sprites/player_farmer_v2/action_sheet/sheet-transparent.png',
  playerWalk: '/assets/sprites/player_farmer_v2/walk/sheet-transparent.png',
  npcSeedSeller: '/assets/sprites/npc_seed_seller_v2/sheet-transparent.png',
  cropTurnip: '/assets/sprites/crops_v2/sheet-transparent.png',
  itemsFarming: '/assets/sprites/items_farming/sheet-transparent.png',
  fxFarming: '/assets/sprites/fx_farming/sheet-transparent.png',
  uiIcons: '/assets/sprites/ui_icons/sheet-transparent.png',
  farmCollision: '/data/farm-v2-collision.json',
  farmZones: '/data/farm-v2-zones.json',
  farmProps: '/data/farm-v2-props.json',
  houseBase: '/assets/map/house_v1/house-base.png',
  bedBlanket: '/assets/sprites/bed_blanket_v1/sheet-transparent.png',
  houseCollision: '/data/house-v1-collision.json',
  houseZones: '/data/house-v1-zones.json',
  farmBgm: '/assets/audio/cozy-farm-loop.wav'
} as const;

export const FrameSize = {
  character: { frameWidth: 96, frameHeight: 96 },
  tile: { frameWidth: 128, frameHeight: 128 },
  fx: { frameWidth: 128, frameHeight: 128 },
  uiIcon: { frameWidth: 128, frameHeight: 128 },
  itemIcon: { frameWidth: 32, frameHeight: 32 },
  bedBlanket: { frameWidth: 128, frameHeight: 128 }
} as const;
