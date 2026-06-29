import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { matchQuoteItemsWithClaude, callClaudeMessages, buildClaudePrompt, parseClaudeItems, DEFAULT_MODEL } from './claudeMatcher.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

export async function matchWithBestAI(userInput, priceList, clientApiKey) {
  const apiKey = clientApiKey || process.env.ANTHROPIC_API_KEY;
  if (apiKey?.trim()) {
    return matchQuoteItemsWithClaude(userInput, priceList, apiKey);
  }
  const { matchQuoteItemsAI } = await import('./semanticMatcher.js');
  return matchQuoteItemsAI(userInput, priceList);
}

export async function proxyClaudeRequest(body, headerKey) {
  const apiKey = headerKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Claude API key missing');

  if (body.userInput && body.priceList) {
    const items = await matchQuoteItemsWithClaude(body.userInput, body.priceList, apiKey);
    return { items, matcher: 'claude', model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL };
  }

  const text = await callClaudeMessages(
    apiKey,
    body.system,
    body.userMessage,
    body.model || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
  );
  return { text };
}

export { buildClaudePrompt, parseClaudeItems };
