import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { matchWithBestAI, proxyClaudeRequest } from './claudeBridge.js';
import { DEFAULT_MODEL } from './claudeMatcher.js';
import { preloadModel } from './semanticMatcher.js';

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

const app = express();
const PORT = process.env.PORT || 3001;
const hasClaude = !!process.env.ANTHROPIC_API_KEY;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:8765',
    'http://127.0.0.1:8765',
    'http://localhost:8766',
    'http://127.0.0.1:8766',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    status: 'UP',
    message: 'PriceSnap API',
    matcher: hasClaude ? 'claude' : 'local-semantic-ai',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    ai: hasClaude ? 'claude-ready' : 'semantic-ready',
    provider: hasClaude ? 'anthropic' : 'transformers.js',
    model: hasClaude ? (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL) : 'Xenova/all-MiniLM-L6-v2',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/claude/match', async (req, res) => {
  try {
    const headerKey = req.headers['x-anthropic-key'];
    const result = await proxyClaudeRequest(req.body, headerKey);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Claude processing failed', details: error.message });
  }
});

app.post('/api/ai/generate-quote-items', async (req, res) => {
  try {
    const userInput = req.body.userInput || req.body.input;
    const { priceList } = req.body;
    const clientKey = req.headers['x-anthropic-key'];

    if (!userInput?.trim()) {
      return res.status(400).json({ error: 'Missing input text for quote generation' });
    }
    if (!priceList?.length) {
      return res.status(400).json({ error: 'A valid price list is required.' });
    }

    const items = await matchWithBestAI(userInput, priceList, clientKey);
    const usedClaude = !!(clientKey || process.env.ANTHROPIC_API_KEY);

    res.json({
      items: items.map((item) => ({
        Item: item.Item,
        Quantity: item.Quantity,
      })),
      message: items.length
        ? `AI matched ${items.length} item(s) from your description`
        : 'AI could not match any catalog items. Try being more specific.',
      matcher: usedClaude ? 'claude' : 'local-semantic-ai',
      model: usedClaude ? (process.env.ANTHROPIC_MODEL || DEFAULT_MODEL) : 'Xenova/all-MiniLM-L6-v2',
    });
  } catch (error) {
    console.error('AI matching error:', error);
    res.status(500).json({
      error: 'AI processing failed',
      details: error.message,
    });
  }
});

app.post('/api/ai/demo-generate-quote-items', async (req, res) => {
  req.body.userInput = req.body.userInput || req.body.input;
  const userInput = req.body.userInput;
  const { priceList } = req.body;
  if (!userInput?.trim()) return res.status(400).json({ error: 'Missing input text for quote generation' });
  if (!priceList?.length) return res.status(400).json({ error: 'A valid price list is required.' });
  try {
    const items = await matchWithBestAI(userInput, priceList, req.headers['x-anthropic-key']);
    res.json({ items, matcher: process.env.ANTHROPIC_API_KEY ? 'claude' : 'local-semantic-ai' });
  } catch (error) {
    res.status(500).json({ error: 'AI processing failed', details: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`PriceSnap backend running at http://localhost:${PORT}`);
  if (hasClaude) {
    console.log(`Claude matcher ready (${process.env.ANTHROPIC_MODEL || DEFAULT_MODEL})`);
  } else {
    console.log('No ANTHROPIC_API_KEY in backend/.env — using local semantic AI fallback');
    console.log('Copy backend/.env.example to backend/.env and add your Claude key for best matching');
    try {
      await preloadModel();
      console.log('Local semantic AI ready');
    } catch (err) {
      console.warn('Model preload failed; will load on first quote request:', err.message);
    }
  }
});
