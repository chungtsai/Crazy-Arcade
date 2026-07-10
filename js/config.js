// Game configuration constants
const TILE_SIZE = 48;
const GRID_COLS = 15;
const GRID_ROWS = 13;
const GAME_WIDTH = GRID_COLS * TILE_SIZE;
const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

// Map configurations containing layout and visual themes
const MAPS_CONFIG = {
  sea14: {
    name: '海盜 14',
    badge: 'Patrit 14',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
      [2, 2, 0, 1, 2, 2, 2, 0, 2, 2, 2, 1, 0, 2, 2],
      [2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2],
      [2, 2, 0, 2, 0, 1, 1, 0, 1, 1, 0, 2, 0, 2, 2],
      [2, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 2],
      [2, 2, 0, 2, 0, 1, 1, 0, 1, 1, 0, 2, 0, 2, 2],
      [2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2],
      [2, 2, 0, 1, 2, 2, 2, 0, 2, 2, 2, 1, 0, 2, 2],
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0x4a5d6e,
    wallBorderColor: 0x7c94a8,
    wallInnerColor: 0x273542,
    crateColor: 0xbf7130,
    crateBorderColor: 0x824413,
    crateInnerColor: 0x542a0b,
    bgTileColorDark: 0x0a1c36,
    bgTileColorLight: 0x07152a,
    bgGridColor: 0x0d284f
  },
  village10: {
    name: '村莊 10',
    badge: 'Village 10',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0],
      [0, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 0],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [0, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 0],
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0xe05638,       // Red roof houses
    wallBorderColor: 0xf7a361, // Light orange wall
    wallInnerColor: 0xfce497,  // Yellow brick window/facade
    crateColor: 0xe6b450,       // Light yellow wood box
    crateBorderColor: 0xb58010, // Medium wood border
    crateInnerColor: 0x7a5405,  // Dark wood details
    bgTileColorDark: 0x337d43,  // Dark green grass
    bgTileColorLight: 0x3b8c4c, // Light green grass
    bgGridColor: 0x1f5c2e       // Deep grass divider lines
  },
  forest05: {
    name: '森林 05',
    badge: 'Forest 05',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 2, 0],
      [2, 1, 0, 2, 2, 0, 1, 0, 1, 0, 2, 2, 0, 1, 2],
      [2, 0, 2, 1, 0, 0, 2, 0, 2, 0, 0, 1, 2, 0, 2],
      [2, 0, 2, 0, 2, 1, 1, 0, 1, 1, 2, 0, 2, 0, 2],
      [2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 2],
      [2, 0, 0, 2, 2, 0, 2, 0, 2, 0, 2, 2, 0, 0, 2],
      [2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 2, 2],
      [2, 0, 2, 0, 2, 1, 1, 0, 1, 1, 2, 0, 2, 0, 2],
      [2, 0, 2, 1, 0, 0, 2, 0, 2, 0, 0, 1, 2, 0, 2],
      [2, 1, 0, 2, 2, 0, 1, 0, 1, 0, 2, 2, 0, 1, 2],
      [0, 2, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 1, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0x2d5a27,
    wallBorderColor: 0x448a3b,
    wallInnerColor: 0x1f3f1b,
    crateColor: 0x8b5a2b,
    crateBorderColor: 0x5c3a21,
    crateInnerColor: 0x3d2516,
    bgTileColorDark: 0x1e3f20,
    bgTileColorLight: 0x254e28,
    bgGridColor: 0x152c16
  },
  desert08: {
    name: '沙漠 08',
    badge: 'Desert 08',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 1, 2, 1, 2, 0, 0, 0, 2, 1, 2, 1, 2, 0],
      [2, 2, 0, 0, 0, 2, 2, 1, 2, 2, 0, 0, 0, 2, 2],
      [2, 1, 2, 1, 2, 1, 0, 2, 0, 1, 2, 1, 2, 1, 2],
      [2, 2, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 2, 2],
      [2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 0, 2],
      [2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2],
      [2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 2, 2, 2, 0, 2],
      [2, 2, 0, 0, 0, 2, 2, 0, 2, 2, 0, 0, 0, 2, 2],
      [2, 1, 2, 1, 2, 1, 0, 2, 0, 1, 2, 1, 2, 1, 2],
      [2, 2, 0, 0, 0, 2, 2, 1, 2, 2, 0, 0, 0, 2, 2],
      [0, 2, 1, 2, 1, 2, 0, 0, 0, 2, 1, 2, 1, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0xd2b48c,
    wallBorderColor: 0xb8860b,
    wallInnerColor: 0x8b6508,
    crateColor: 0xcd853f,
    crateBorderColor: 0x8b4513,
    crateInnerColor: 0x5c2e0b,
    bgTileColorDark: 0xeed8ae,
    bgTileColorLight: 0xf5deb3,
    bgGridColor: 0xcdb891
  },
  ice03: {
    name: '冰河 03',
    badge: 'Ice 03',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
      [2, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 2],
      [2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2],
      [2, 0, 0, 0, 2, 2, 2, 0, 2, 2, 2, 0, 0, 0, 2],
      [2, 2, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 2, 2],
      [2, 0, 1, 0, 2, 0, 1, 0, 1, 0, 2, 0, 1, 0, 2],
      [2, 2, 1, 0, 2, 0, 0, 0, 0, 0, 2, 0, 1, 2, 2],
      [2, 0, 0, 0, 2, 2, 2, 0, 2, 2, 2, 0, 0, 0, 2],
      [2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2],
      [2, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 2],
      [0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0xadd8e6,
    wallBorderColor: 0x5f9ea0,
    wallInnerColor: 0x4682b4,
    crateColor: 0xe0ffff,
    crateBorderColor: 0xafeeee,
    crateInnerColor: 0x87ceeb,
    bgTileColorDark: 0x008080,
    bgTileColorLight: 0x008b8b,
    bgGridColor: 0x004d4d
  },
  factory07: {
    name: '玩具工廠 07',
    badge: 'Factory 07',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 2, 1, 1, 2, 2, 0, 2, 2, 1, 1, 2, 2, 0],
      [2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 2, 2],
      [2, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 2],
      [2, 1, 0, 1, 2, 0, 0, 0, 0, 0, 2, 1, 0, 1, 2],
      [2, 2, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 2, 2],
      [2, 0, 0, 0, 0, 2, 1, 0, 1, 2, 0, 0, 0, 0, 2],
      [2, 2, 2, 2, 0, 2, 2, 0, 2, 2, 0, 2, 2, 2, 2],
      [2, 1, 0, 1, 2, 0, 0, 0, 0, 0, 2, 1, 0, 1, 2],
      [2, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 2],
      [2, 2, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 2, 2],
      [0, 2, 2, 1, 1, 2, 2, 0, 2, 2, 1, 1, 2, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0x708090,
    wallBorderColor: 0x778899,
    wallInnerColor: 0x2f4f4f,
    crateColor: 0xff4500,
    crateBorderColor: 0xff8c00,
    crateInnerColor: 0x8b0000,
    bgTileColorDark: 0x1c1c1c,
    bgTileColorLight: 0x2b2b2b,
    bgGridColor: 0x111111
  },
  space02: {
    name: '太空 02',
    badge: 'Space 02',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0],
      [2, 0, 1, 2, 1, 2, 0, 1, 0, 2, 1, 2, 1, 0, 2],
      [2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 2],
      [2, 0, 1, 2, 1, 0, 2, 0, 2, 0, 1, 2, 1, 0, 2],
      [2, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 2],
      [2, 1, 1, 0, 2, 2, 1, 0, 1, 2, 2, 0, 1, 1, 2],
      [2, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 2],
      [2, 0, 1, 2, 1, 0, 2, 0, 2, 0, 1, 2, 1, 0, 2],
      [2, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 2],
      [2, 0, 1, 2, 1, 2, 0, 1, 0, 2, 1, 2, 1, 0, 2],
      [0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 2, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0x4b0082,
    wallBorderColor: 0x8a2be2,
    wallInnerColor: 0x1a0f30,
    crateColor: 0x00ffff,
    crateBorderColor: 0x008b8b,
    crateInnerColor: 0x004848,
    bgTileColorDark: 0x050510,
    bgTileColorLight: 0x0d0d26,
    bgGridColor: 0x19194d
  }
};

// Character configs
const CHARACTER_CONFIGS = {
  dao: { name: '藍寶', maxBubbles: 1, maxLen: 2, speed: 2.5, color: 0x0066cc, faceColor: 0x5ebcff },
  bazzi: { name: '困寶', maxBubbles: 1, maxLen: 2, speed: 3.2, color: 0xcc0033, faceColor: 0xff7ea5 },
  marid: { name: '妮妮', maxBubbles: 2, maxLen: 2, speed: 2.0, color: 0xcca300, faceColor: 0xffe66d }
};

const CPU_START_POSITIONS = [
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 0, dirY: -1 }, // Bottom-Right
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: TILE_SIZE * 0.5 + 2, dirX: -1, dirY: 0 },              // Top-Right
  { x: TILE_SIZE * 0.5 + 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 1, dirY: 0 },               // Bottom-Left
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 6.5, dirX: 1, dirY: 0 }, // Center safe spot
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 4.5, dirX: -1, dirY: 0 }, // Top-Middle
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 8.5, dirX: 1, dirY: 0 } // Bottom-Middle
];

// Items
const ITEM_TYPES = {
  BUBBLE_UP: 3,
  LENGTH_UP: 4,
  SPEED_UP: 5,
  NEEDLE: 6,
  DART: 7,
  PET: 8,
  PET_FAST_TURTLE: 9,
  PET_SLOW_TURTLE: 10,
  KICK_SHOE: 11,
  SPRING_SHOE: 12,
  DEVIL: 13
};
