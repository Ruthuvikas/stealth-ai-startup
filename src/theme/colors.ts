export const colors = {
  // Dark WhatsApp-like base
  bg: '#0B141A',
  bgCard: '#111B21',
  bgElevated: '#1F2C33',
  bgInput: '#1F2C33',

  // Primary brand green + accent
  primary: '#00A884',
  primaryDark: '#008069',
  primaryLight: '#25D366',
  accent: '#F59E0B',
  accentSoft: '#F59E0B1A',

  // Gradients
  gradientStart: '#00A884',
  gradientEnd: '#00C98D',

  // Text on dark backgrounds
  textPrimary: '#E9EDEF',
  textSecondary: '#B4C0C7',
  textMuted: '#8696A0',
  textLink: '#53BDEB',

  // Status
  online: '#00A884',
  error: '#EA4335',
  warning: '#F59E0B',

  // Chat bubbles
  bubbleUser: '#005C4B',
  bubbleUserDark: '#004A3D',
  bubbleAI: '#1F2C33',
  bubbleAIDark: '#1A252B',

  // Chat background
  chatBg: '#0B141A',
  chatPattern: '#1A2A31',

  // Borders
  border: '#22313A',
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
