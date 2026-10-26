// Serveur de configuration du dashboard BelTools (remplace Supabase, supprimé).
// Un seul fichier JSON = la liste des outils de Badri, partagée entre tous ses appareils.
// En production : derrière Nginx (location /api/config), protégé par le même mot de passe
// (auth_basic) que beltools.fr ; il n'écoute que sur 127.0.0.1.
//
//   GET /api/config  → { custom_tools, builtin_state, collapsed, updated_at }  (404 si encore vide)
//   PUT /api/config  → enregistre le corps JSON, renvoie { updated_at }
//
// Variables : PORT (défaut 8787), DATA_DIR (défaut ./data), CORS_ORIGIN (dev local uniquement).

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, rename, readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const CONFIG_FILE = join(DATA_DIR, 'config.json');
const BACKUP_DIR = join(DATA_DIR, 'backups');
const MAX_BODY = 512 * 1024;
const MAX_BACKUPS = 50;

await mkdir(BACKUP_DIR, { recursive: true });

function send(res, status, body) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  if (CORS_ORIGIN) {
    Object.assign(headers, {
      'Access-Control-Allow-Origin': CORS_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
  }
  res.writeHead(status, headers);
  res.end(body === undefined ? '' : JSON.stringify(body));
}

async function readBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('too_large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function isValidConfig(c) {
  return c && typeof c === 'object' && Array.isArray(c.custom_tools) && Array.isArray(c.builtin_state);
}

// Garde une copie horodatée de la version précédente avant chaque écriture (filet de sécurité).
async function backupCurrent() {
  try {
    const current = await readFile(CONFIG_FILE);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await writeFile(join(BACKUP_DIR, `config-${stamp}.json`), current);
    const files = (await readdir(BACKUP_DIR)).filter(f => f.startsWith('config-')).sort();
    for (const f of files.slice(0, Math.max(0, files.length - MAX_BACKUPS))) await unlink(join(BACKUP_DIR, f));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path !== '/api/config') return send(res, 404, { error: 'not_found' });
  try {
    if (req.method === 'OPTIONS') return send(res, 204);
    if (req.method === 'GET') {
      try {
        return send(res, 200, JSON.parse(await readFile(CONFIG_FILE, 'utf8')));
      } catch (e) {
        if (e.code === 'ENOENT') return send(res, 404, { error: 'empty' });
        throw e;
      }
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      if (!isValidConfig(body)) return send(res, 400, { error: 'invalid_config' });
      const config = {
        custom_tools: body.custom_tools,
        builtin_state: body.builtin_state,
        collapsed: body.collapsed !== false,
        updated_at: new Date().toISOString(),
      };
      await backupCurrent();
      // Écriture atomique : fichier temporaire puis renommage (jamais de fichier à moitié écrit).
      const tmp = CONFIG_FILE + '.tmp';
      await writeFile(tmp, JSON.stringify(config, null, 2));
      await rename(tmp, CONFIG_FILE);
      return send(res, 200, { updated_at: config.updated_at });
    }
    return send(res, 405, { error: 'method_not_allowed' });
  } catch (e) {
    if (e.message === 'too_large') return send(res, 413, { error: 'too_large' });
    if (e instanceof SyntaxError) return send(res, 400, { error: 'invalid_json' });
    console.error('config-server:', e);
    return send(res, 500, { error: 'server_error' });
  }
}).listen(PORT, '127.0.0.1', () => console.log(`config-server sur 127.0.0.1:${PORT}, données dans ${DATA_DIR}`));
