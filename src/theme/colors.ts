export const colors = {
  // Background — warm dark, not cold
  bg: '#0B141A',
  bgCard: '#111B21',
  bgElevated: '#1F2C33',
  bgInput: '#1F2C33',

  // WhatsApp-inspired primary green + our purple accent
  primary: '#00A884',
  primaryDark: '#008069',
  primaryLight: '#00A884',
  accent: '#8B5CF6',
  accentSoft: '#8B5CF620',

  // Gradient for buttons and highlights
  gradientStart: '#00A884',
  gradientEnd: '#00D4AA',

  // Text
  textPrimary: '#E9EDEF',
  textSecondary: '#8696A0',
  textMuted: '#667781',
  textLink: '#53BDEB',

  // Status
  online: '#00A884',
  error: '#EA4335',
  warning: '#F59E0B',

  // Chat bubbles — WhatsApp style
  bubbleUser: '#005C4B',
  bubbleUserDark: '#004A3D',
  bubbleAI: '#1F2C33',
  bubbleAIDark: '#1A252B',

  // Chat background pattern
  chatBg: '#0B141A',
  chatPattern: '#0D1A1F',

  // Borders
  border: '#222D34',
  borderLight: '#2A3942',

  // Unread badge
  badge: '#00A884',

  // Character accent colors (vibrant for group chats)
  characterColors: [
    '#FF6B6B', // Coral red
    '#FFD93D', // Sunny yellow
    '#6BCB77', // Fresh green
    '#4D96FF', // Sky blue
    '#FF6BD6', // Hot pink
    '#845EF7', // Purple
    '#FF922B', // Orange
    '#20C997', // Teal
    '#F06595', // Rose
    '#339AF0', // Blue
  ] as const,
} as const;

export type Colors = typeof colors;
