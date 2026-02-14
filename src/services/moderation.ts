const BLOCKED_KEYWORDS = [
  'suicide', 'kill myself', 'self harm', 'self-harm',
  'nude', 'naked', 'sex', 'porn',
  'drug dealer', 'buy drugs',
  'bomb', 'terrorist', 'attack plan',
];

const PII_PATTERNS = [
  /\b\d{12}\b/,                          // Aadhaar number
  /\b\d{10}\b/,                          // Phone number
  /\b[A-Z]{5}\d{4}[A-Z]\b/,             // PAN card
  /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/,        // Email
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Card number
];

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

export function moderateInput(text: string): ModerationResult {
  const lower = text.toLowerCase();

  for (const keyword of BLOCKED_KEYWORDS) {
    if (lower.includes(keyword)) {
      return { safe: false, reason: 'Message contains inappropriate content' };
    }
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: 'Please don\'t share personal information like phone numbers, Aadhaar, or email addresses in chat' };
    }
  }

  return { safe: true };
}
