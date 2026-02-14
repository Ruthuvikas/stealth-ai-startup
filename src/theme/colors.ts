export const colors = {
  // Light, warm WhatsApp-like base
  bg: '#F8F2E8',
  bgCard: '#FFFDF8',
  bgElevated: '#FFF7EA',
  bgInput: '#FFFFFF',

  // Primary brand green + warm accent
  primary: '#1FA463',
  primaryDark: '#178550',
  primaryLight: '#4FC586',
  accent: '#E28A31',
  accentSoft: '#E28A311A',

  // Gradients
  gradientStart: '#2AAE6E',
  gradientEnd: '#1E9860',

  // Text on light backgrounds
  textPrimary: '#1F2A1F',
  textSecondary: '#4E5B4F',
  textMuted: '#7A8778',
  textLink: '#238A7B',

  // Status
  online: '#00A884',
  error: '#EA4335',
  warning: '#F59E0B',

  // Chat bubbles
  bubbleUser: '#DCF8C6',
  bubbleUserDark: '#CDEEB3',
  bubbleAI: '#FFFFFF',
  bubbleAIDark: '#F7F1E8',

  // Chat background
  chatBg: '#EFE6DA',
  chatPattern: '#E7DCCD',

  // Borders
  border: '#E2D7C8',
  borderLight: '#D7CBB9',

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
