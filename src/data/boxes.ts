import { ColoredBox, BoxColor } from '../types/game';

export const COLORED_BOXES: ColoredBox[] = [
  {
    id: 'box_red',
    color: 'Red',
    name: 'Ruby Red Box',
    hexColor: '#ef4444',
    accentHex: 0xef4444,
    position: { x: -36, y: 0.1, z: -10 },
    roomName: 'Living Room Lounge',
  },
  {
    id: 'box_blue',
    color: 'Blue',
    name: 'Sapphire Blue Box',
    hexColor: '#3b82f6',
    accentHex: 0x3b82f6,
    position: { x: -70, y: 0.1, z: -85 },
    roomName: 'Master Bedroom Study',
  },
  {
    id: 'box_green',
    color: 'Green',
    name: 'Emerald Green Box',
    hexColor: '#10b981',
    accentHex: 0x10b981,
    position: { x: 0, y: 0.1, z: 95 },
    roomName: 'Sunroom Botanical Garden',
  },
  {
    id: 'box_gold',
    color: 'Gold',
    name: 'Golden Amber Box',
    hexColor: '#eab308',
    accentHex: 0xeab308,
    position: { x: 40, y: 0.1, z: 30 },
    roomName: 'Grand Banquet Dining',
  },
];

export const BOX_COLORS_LIST: BoxColor[] = ['Red', 'Blue', 'Green', 'Gold'];

export function getRandomBoxColor(): BoxColor {
  return BOX_COLORS_LIST[Math.floor(Math.random() * BOX_COLORS_LIST.length)];
}
