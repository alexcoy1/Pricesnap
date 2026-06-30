import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';

const API_PATH = '/api/ai/extract-invoice';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Anthropic-Key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(CORS)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(body));
}

export function paytrailApiPlugin(mode: string): Plugin {
  return {
    name: 'paytrail-api',
    configureServer(server) {
      const env = loadEnv(mode, process.cwd(), '');

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0];
        if (path !== API_PATH) {
          next();
          return;
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          for (const [key, value] of Object.entries(CORS)) {
            res.setHeader(key, value);
          }
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }

        try {
          process.env.PAYTRAIL_DEV = 'true';
          if (env.ANTHROPIC_API_KEY) {
            process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
          }
          if (env.ANTHROPIC_MODEL) {
            process.env.ANTHROPIC_MODEL = env.ANTHROPIC_MODEL;
          }

          const body = await readBody(req);
          const handler = (await import('./netlify/functions/extract-invoice.mjs')).default;
          const forwardHeaders: Record<string, string> = {
            'Content-Type': req.headers['content-type'] || 'application/json',
          };
          const devKey = req.headers['x-anthropic-key'];
          if (typeof devKey === 'string' && devKey.trim()) {
            forwardHeaders['X-Anthropic-Key'] = devKey.trim();
          }
          const webReq = new Request(`http://localhost${API_PATH}`, {
            method: 'POST',
            headers: forwardHeaders,
            body,
          });
          const webRes = await handler(webReq);

          res.statusCode = webRes.status;
          webRes.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'content-length') return;
            res.setHeader(key, value);
          });
          res.end(Buffer.from(await webRes.arrayBuffer()));
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          sendJson(res, 500, {
            error: message,
            details:
              'Local API error. Add ANTHROPIC_API_KEY to apps/paytrail/.env and restart npm run dev.',
          });
        }
      });
    },
  };
}
