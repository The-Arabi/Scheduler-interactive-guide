import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  handleProxyRequest,
  parseProxyPath,
  type ProxyRequestContext,
} from './src/proxy/handler.ts';

const APP_BASE = process.env.APP_BASE || '/';

function getPublicOrigin(req: express.Request): string {
  if (process.env.PUBLIC_ORIGIN) {
    return process.env.PUBLIC_ORIGIN.replace(/\/$/, '');
  }
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const host = (req.get('x-forwarded-host') || req.get('host') || 'localhost')
    .split(',')[0]
    .trim();
  return `${proto}://${host}`;
}

function applyProxyResponse(
  res: express.Response,
  proxyRes: Awaited<ReturnType<typeof handleProxyRequest>>
) {
  for (const [key, value] of Object.entries(proxyRes.headers)) {
    res.setHeader(key, value);
  }
  res.status(proxyRes.status);
  if (Buffer.isBuffer(proxyRes.body)) {
    res.send(proxyRes.body);
  } else {
    res.send(proxyRes.body);
  }
}

async function readRequestBody(req: express.Request): Promise<Buffer | undefined> {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method!)) return undefined;
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve());
    req.on('error', reject);
  });
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function proxyFromExpress(
  req: express.Request,
  res: express.Response,
  host: string,
  subpath: string
) {
  try {
    const body = await readRequestBody(req);
    const ctx: ProxyRequestContext = {
      method: req.method!,
      headers: req.headers as ProxyRequestContext['headers'],
      body,
      subpath,
      publicOrigin: getPublicOrigin(req),
    };
    const proxyRes = await handleProxyRequest(host, ctx, APP_BASE);
    applyProxyResponse(res, proxyRes);
  } catch (err) {
    console.error(`[Proxy] ${host}${subpath}:`, err);
    res.status(500).send(`Unable to load proxied page: ${(err as Error).message}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Health check for verifying the proxy is running in production
  app.get(`${APP_BASE}proxy-site/_health`, (_req, res) => {
    res.json({ ok: true, proxy: true });
  });

  // Referer-based proxy for assets requested with root-relative paths
  app.use(async (req, res, next) => {
    const pathValue = req.path;
    const proxyPrefix = `${APP_BASE}proxy-site`.replace(/\/+/g, '/');
    if (
      pathValue === APP_BASE.replace(/\/$/, '') ||
      pathValue === '/' ||
      pathValue === '/index.html' ||
      pathValue.startsWith('/src/') ||
      pathValue.startsWith('/node_modules/') ||
      pathValue.startsWith('/@vite/') ||
      pathValue.startsWith('/@id/') ||
      pathValue.startsWith('/@fs/') ||
      pathValue.startsWith('/@react-refresh') ||
      pathValue.startsWith(proxyPrefix)
    ) {
      return next();
    }

    const referer = req.headers.referer;
    if (referer && referer.includes('/proxy-site/')) {
      const match = referer.match(/\/proxy-site\/([^/]+)/);
      if (match?.[1]) {
        const host = match[1];
        return proxyFromExpress(req, res, host, req.originalUrl);
      }
    }
    next();
  });

  // Main proxy route: /proxy-site/<host>/...
  app.all(`${APP_BASE}proxy-site/*`, async (req, res, next) => {
    const parsed = parseProxyPath(req.path, APP_BASE);
    if (!parsed) return next();
    if (parsed.host === '_health') return next();
    await proxyFromExpress(req, res, parsed.host, parsed.subpath);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.includes('/proxy-site/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Proxy available at ${APP_BASE}proxy-site/<host>/`);
  });
}

startServer();
