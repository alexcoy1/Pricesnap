import { matchQuoteItemsWithClaude, callClaudeMessages } from '../backend/claudeMatcher.js';

let body = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { body += chunk; });
process.stdin.on('end', async () => {
  try {
    const parsed = JSON.parse(body || '{}');
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('Missing Anthropic API key');

    if (parsed.userInput && parsed.priceList) {
      const items = await matchQuoteItemsWithClaude(parsed.userInput, parsed.priceList, key, {
        model: parsed.model,
      });
      process.stdout.write(JSON.stringify({ items, matcher: 'claude' }));
      process.exit(0);
    }

    const text = await callClaudeMessages(key, parsed.system, parsed.userMessage, parsed.model);
    process.stdout.write(JSON.stringify({ text }));
    process.exit(0);
  } catch (err) {
    process.stderr.write(err.message || String(err));
    process.exit(1);
  }
});
