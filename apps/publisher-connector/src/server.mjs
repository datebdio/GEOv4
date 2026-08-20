import { createServer } from 'node:http'; import fs from 'node:fs/promises'; import path from 'node:path';
import { publishWithBrowser } from './automation.mjs';
const port = Number(process.env.CONNECTOR_PORT ?? 3200), token = process.env.CONNECTOR_TOKEN, dataDir = process.env.CONNECTOR_DATA_DIR ?? '/data';
if (!token) throw new Error('CONNECTOR_TOKEN is required'); await fs.mkdir(dataDir, { recursive: true });
const resultFile = path.join(dataDir, 'idempotency.json'); let results = {}; try { results = JSON.parse(await fs.readFile(resultFile, 'utf8')); } catch {}
async function readBody(request) { const chunks = []; for await (const chunk of request) chunks.push(chunk); return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
const server = createServer(async (request, response) => {
  response.setHeader('content-type', 'application/json');
  if (request.url === '/health') { response.end(JSON.stringify({ status: 'ok' })); return; }
  if (request.method !== 'POST' || request.url !== '/v1/publish') { response.writeHead(404).end(JSON.stringify({ error: 'not_found' })); return; }
  if (request.headers.authorization !== `Bearer ${token}`) { response.writeHead(401).end(JSON.stringify({ error: 'unauthorized' })); return; }
  try { const input = await readBody(request), key = request.headers['idempotency-key']; if (!key || key !== input.idempotencyKey) throw new Error('invalid_idempotency_key'); if (results[key]) { response.end(JSON.stringify(results[key])); return; }
    const result = await publishWithBrowser(input, { dataDir, headless: process.env.CONNECTOR_HEADLESS !== 'false', mode: process.env.CONNECTOR_MODE === 'publish' ? 'publish' : 'draft' }); results[key] = result; await fs.writeFile(resultFile, JSON.stringify(results, null, 2)); response.end(JSON.stringify(result));
  } catch (error) { response.writeHead(422).end(JSON.stringify({ error: error instanceof Error ? error.message : 'publish_failed' })); }
});
server.listen(port, process.env.CONNECTOR_HOST ?? '127.0.0.1');
