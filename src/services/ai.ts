import Anthropic from '@anthropic-ai/sdk';
import { Character, CharacterDynamic, Message } from '../types';
import { getDynamicsForGroup } from '../data/dynamics';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

const MODEL = 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = 300;
const TEMPERATURE = 0.85;
const CONTEXT_MESSAGES = 20;

// ── Layer 1: Base System Prompt ──────────────────────────────────────────

const BASE_PROMPT = `You are a character in a WhatsApp-style chat app. You MUST:
- Keep responses SHORT (1-3 sentences max, like real WhatsApp messages)
- Write in Hinglish (mix of Hindi and English, using Roman script for Hindi)
- NEVER break character, NEVER mention you're an AI
- Use emojis naturally (1-2 per message, not more)
- React to the conversation naturally, like a real person would on WhatsApp
- Match the energy and tone of the conversation
- You can use slang, abbreviations, and casual language
- Sometimes send just reactions or short responses like "haan yaar", "lol", "sahi mein?"`;

// ── Layer 2: Character Identity ──────────────────────────────────────────

function buildIdentityPrompt(character: Character): string {
  return `You are ${character.name}, a ${character.age}-year-old from ${character.city}.
Archetype: ${character.archetype}
Backstory: ${character.backstory}
Speaking style: ${character.speakingStyle}

Example messages you would send:
${character.sampleMessages.map((m) => `- "${m}"`).join('\n')}`;
}

// ── Layer 3: Personality Matrix ──────────────────────────────────────────

function buildPersonalityPrompt(character: Character): string {
  const { humor, sarcasm, warmth, desiMeter, energy, wisdom } = character.personality;
  const traits: string[] = [];

  if (humor >= 7) traits.push('You are very funny and crack jokes often');
  if (sarcasm >= 7) traits.push('You are quite sarcastic and use witty comebacks');
  if (warmth >= 8) traits.push('You are very warm and caring in your messages');
  if (desiMeter >= 8) traits.push('You use a LOT of Hindi words and desi references');
  if (energy >= 8) traits.push('You are high energy, use caps and exclamation marks');
  if (energy <= 4) traits.push('You are chill and laid-back, never rush your words');
  if (wisdom >= 8) traits.push('You drop casual wisdom and philosophical observations');

  return traits.length > 0
    ? `Personality notes:\n${traits.map((t) => `- ${t}`).join('\n')}`
    : '';
}

// ── Layer 4: Cultural DNA ────────────────────────────────────────────────

function buildCulturalPrompt(character: Character): string {
  const { hindiPhrases, references, food } = character.culturalDNA;
  return `Cultural context you naturally reference:
- Phrases you use: ${hindiPhrases.join(', ')}
- Things you reference: ${references.join(', ')}
- Food you talk about: ${food.join(', ')}`;
}

// ── Layer 5: Relationship Dynamics (Group only) ──────────────────────────

function buildDynamicsPrompt(
  character: Character,
  groupCharacterIds: string[],
  dynamics: CharacterDynamic[]
): string {
  const relevantDynamics = dynamics.filter(
    (d) =>
      (d.pair[0] === character.id || d.pair[1] === character.id) &&
      groupCharacterIds.includes(d.pair[0]) &&
      groupCharacterIds.includes(d.pair[1])
  );

  if (relevantDynamics.length === 0) return '';

  return `Group dynamics you MUST follow:\n${relevantDynamics.map((d) => d.promptModifier).join('\n\n')}`;
}

// ── Layer 6: Conversation Context ────────────────────────────────────────

function buildContextMessages(
  messages: Message[],
  characterMap: Record<string, string>,
  userName: string
): { role: 'user' | 'assistant'; content: string }[] {
  const recent = messages.slice(-CONTEXT_MESSAGES);
  const claudeMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const msg of recent) {
    if (msg.senderId === 'user') {
      claudeMessages.push({ role: 'user', content: `${userName}: ${msg.content}` });
    } else {
      const name = characterMap[msg.senderId] || msg.senderId;
      // Other characters' messages go as user messages with name prefix
      // Current character's messages go as assistant messages
      claudeMessages.push({ role: 'assistant', content: `${name}: ${msg.content}` });
    }
  }

  // Ensure alternation: Claude API requires user/assistant alternation
  const alternated: { role: 'user' | 'assistant'; content: string }[] = [];
  for (let i = 0; i < claudeMessages.length; i++) {
    const msg = claudeMessages[i];
    if (alternated.length === 0) {
      if (msg.role === 'assistant') {
        alternated.push({ role: 'user', content: '[conversation start]' });
      }
      alternated.push(msg);
    } else {
      const last = alternated[alternated.length - 1];
      if (last.role === msg.role) {
        // Merge same-role messages
        alternated[alternated.length - 1] = {
          role: last.role,
          content: `${last.content}\n${msg.content}`,
        };
      } else {
        alternated.push(msg);
      }
    }
  }

  // Ensure last message is from user
  if (alternated.length > 0 && alternated[alternated.length - 1].role === 'assistant') {
    alternated.push({ role: 'user', content: '[continue the conversation naturally]' });
  }

  // Ensure first message is from user
  if (alternated.length > 0 && alternated[0].role === 'assistant') {
    alternated.unshift({ role: 'user', content: '[conversation start]' });
  }

  return alternated;
}

// ── Layer 7: Guardrails ──────────────────────────────────────────────────

const GUARDRAILS = `SAFETY RULES (never violate):
- NEVER give medical, legal, or financial advice
- NEVER share personal information or encourage sharing PII
- Keep everything age-appropriate and fun
- If asked about self-harm or violence, gently deflect and suggest talking to someone they trust
- Stay in character but never be mean-spirited or hurtful
- NEVER say you are an AI, chatbot, or language model
- Respond ONLY as your character, in first person. Do NOT prefix your response with your name or any label.`;

// ── Public API ───────────────────────────────────────────────────────────

export async function streamCharacterResponse(
  character: Character,
  messages: Message[],
  userName: string,
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const systemPrompt = [
    BASE_PROMPT,
    buildIdentityPrompt(character),
    buildPersonalityPrompt(character),
    buildCulturalPrompt(character),
    GUARDRAILS,
  ]
    .filter(Boolean)
    .join('\n\n');

  const characterMap: Record<string, string> = { [character.id]: character.name };
  const contextMessages = buildContextMessages(messages, characterMap, userName);

  // Ensure we have at least one user message
  if (contextMessages.length === 0) {
    contextMessages.push({ role: 'user', content: `${userName}: Hi!` });
  }

  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: contextMessages,
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const token = event.delta.text;
        fullText += token;
        onToken(token);
      }
    }

    // Strip character name prefix if the model added it
    fullText = stripCharacterPrefix(fullText, character.name);
    onComplete(fullText);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

export async function streamGroupResponse(
  character: Character,
  allCharacterIds: string[],
  allCharacters: Character[],
  messages: Message[],
  userName: string,
  onToken: (token: string) => void,
  onComplete: (fullText: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  const dynamics = getDynamicsForGroup(allCharacterIds);

  const systemPrompt = [
    BASE_PROMPT,
    buildIdentityPrompt(character),
    buildPersonalityPrompt(character),
    buildCulturalPrompt(character),
    buildDynamicsPrompt(character, allCharacterIds, dynamics),
    `You are in a GROUP CHAT with these people: ${allCharacters.map((c) => `${c.name} (${c.archetype})`).join(', ')}, and the user (${userName}). Respond as ${character.name} only. Keep it natural and reactive to what others said.`,
    GUARDRAILS,
  ]
    .filter(Boolean)
    .join('\n\n');

  const characterMap: Record<string, string> = {};
  for (const c of allCharacters) {
    characterMap[c.id] = c.name;
  }

  const contextMessages = buildContextMessages(messages, characterMap, userName);

  if (contextMessages.length === 0) {
    contextMessages.push({ role: 'user', content: `${userName}: Hey everyone!` });
  }

  try {
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: systemPrompt,
      messages: contextMessages,
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const token = event.delta.text;
        fullText += token;
        onToken(token);
      }
    }

    fullText = stripCharacterPrefix(fullText, character.name);
    onComplete(fullText);
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

function stripCharacterPrefix(text: string, characterName: string): string {
  // Remove "Name: " prefix if the model added it
  const prefixPattern = new RegExp(`^${characterName}:\\s*`, 'i');
  return text.replace(prefixPattern, '').trim();
}

/**
 * Determine which characters should respond in a group chat
 * and in what order (based on message content relevance).
 */
export function determineGroupResponders(
  message: string,
  characterIds: string[],
  characters: Character[],
  mutedIds: string[]
): string[] {
  const available = characterIds.filter((id) => !mutedIds.includes(id));
  if (available.length === 0) return [];

  const messageLower = message.toLowerCase();

  // Score each character by relevance to the message
  const scored = available.map((id) => {
    const char = characters.find((c) => c.id === id);
    if (!char) return { id, score: 0 };

    let score = Math.random() * 3; // Base randomness

    // Check if character is mentioned by name
    if (messageLower.includes(char.name.toLowerCase())) score += 10;

    // Check keyword relevance
    const keywords: Record<string, string[]> = {
      bunny: ['startup', 'business', 'idea', 'funding', 'pitch', 'pivot'],
      kavya: ['food', 'khana', 'mummy', 'mom', 'ghar', 'home', 'sharma'],
      zoya: ['breakup', 'ex', 'shopping', 'bestie', 'drama', 'fight'],
      vikram: ['gym', 'workout', 'protein', 'fitness', 'muscle', 'exercise'],
      tara: ['zodiac', 'sign', 'horoscope', 'star', 'mercury', 'kundli', 'astrology'],
      rohan: ['job', 'upsc', 'government', 'sarkari', 'naukri', 'exam'],
      meera: ['america', 'nri', 'abroad', 'us', 'dollar', 'visa'],
      faizan: ['meme', 'funny', 'hera pheri', 'movie', 'dialogue', 'joke'],
      ananya: ['study', 'plan', 'notion', 'productive', 'career', 'kota'],
      dev: ['stress', 'chill', 'relax', 'life', 'peace', 'goa', 'philosophy'],
    };

    for (const kw of keywords[id] || []) {
      if (messageLower.includes(kw)) score += 5;
    }

    return { id, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // 1-3 characters respond
  const numResponders = Math.min(available.length, Math.random() > 0.4 ? 2 : available.length > 2 ? 3 : 1);
  return scored.slice(0, numResponders).map((s) => s.id);
}
