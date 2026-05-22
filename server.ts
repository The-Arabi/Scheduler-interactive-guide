import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function handleProxyRequest(targetUrl: string, host: string, req: express.Request, res: express.Response) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value) continue;
      const lowerKey = key.toLowerCase();
      // Skip certain headers that are host-specific or raw request trackers
      if (
        lowerKey === 'host' || 
        lowerKey === 'connection' || 
        lowerKey === 'sec-fetch-dest' || 
        lowerKey === 'sec-fetch-mode' || 
        lowerKey === 'sec-fetch-site' ||
        lowerKey === 'content-length'
      ) {
        continue;
      }
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.append(key, value);
      }
    }

    // Force target headers
    headers.set('host', host);
    headers.set('origin', `https://${host}`);
    
    const incomingReferer = req.headers.referer;
    if (incomingReferer && incomingReferer.includes('/proxy-site/')) {
      const match = incomingReferer.match(/\/proxy-site\/([^/]+)(.*)/);
      if (match) {
        const refHost = match[1];
        const refPath = match[2] || '/';
        headers.set('referer', `https://${refHost}${refPath}`);
      }
    } else {
      headers.set('referer', `https://${host}/`);
    }

    // Capture body of request if not a GET
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method!)) {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve());
        req.on('error', err => reject(err));
      });
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    }

    console.log(`[Proxy Request] Sending ${req.method} to ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: 'manual'
    });

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      let location = response.headers.get('location');
      console.log(`[Proxy Redirect] ${targetUrl} redirects to ${location}`);
      if (location) {
        if (location.startsWith('http://') || location.startsWith('https://')) {
          const urlObj = new URL(location);
          location = `/proxy-site/${urlObj.host}${urlObj.pathname}${urlObj.search}`;
        } else if (location.startsWith('/')) {
          location = `/proxy-site/${host}${location}`;
        } else {
          location = `/proxy-site/${host}/${location}`;
        }
      }
      res.setHeader('Location', location || '');
      res.status(response.status);
      copyResponseHeaders(response, res);
      return res.end();
    }

    // Copy cookies and normal response headers
    copyResponseHeaders(response, res);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let htmlText = await response.text();

      // Inject base tag
      const baseTag = `<base href="/proxy-site/${host}/" />`;
      if (htmlText.includes('<head>')) {
        htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
      } else if (htmlText.includes('<HEAD>')) {
        htmlText = htmlText.replace('<HEAD>', `<HEAD>${baseTag}`);
      } else {
        htmlText = baseTag + htmlText;
      }

      res.status(response.status);
      return res.send(htmlText);
    } else {
      const buffer = await response.arrayBuffer();
      res.status(response.status);
      return res.send(Buffer.from(buffer));
    }

  } catch (err) {
    console.error(`[Proxy Exception] Error for ${targetUrl}:`, err);
    res.status(500).send(`Unable to load proxied page: ${(err as Error).message}`);
  }
}

function copyResponseHeaders(fetchResponse: Response, res: express.Response) {
  fetchResponse.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    
    // Strip security frame constraints and raw gzip compression headers
    if (
      lowerKey === 'x-frame-options' ||
      lowerKey === 'content-security-policy' ||
      lowerKey === 'content-security-policy-report-only' ||
      lowerKey === 'strict-transport-security' ||
      lowerKey === 'frame-options' ||
      lowerKey === 'content-encoding' 
    ) {
      return;
    }

    if (lowerKey === 'set-cookie') {
      const values = typeof fetchResponse.headers.getSetCookie === 'function'
        ? fetchResponse.headers.getSetCookie()
        : (fetchResponse.headers.get('set-cookie') ? [fetchResponse.headers.get('set-cookie')!] : []);

      const rewrittenCookies = values.map(cookieVal => {
        // Strip out the Domain attribute entirely
        let cleaned = cookieVal.replace(/domain=[^;]+(;?)/gi, '');
        // Strip out secure attribute so it functions perfectly on local HTTP
        cleaned = cleaned.replace(/secure(;?)/gi, '');
        return cleaned;
      });

      res.setHeader('Set-Cookie', rewrittenCookies);
      return;
    }

    res.setHeader(key, value);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Wildcard Referer-based proxy for absolute assets / fetches of the proxied apps
  app.use(async (req, res, next) => {
    const pathValue = req.path;
    // Allow Vite dev files or local assets to bypass proxy
    if (
      pathValue === '/' ||
      pathValue === '/index.html' ||
      pathValue.startsWith('/src/') ||
      pathValue.startsWith('/node_modules/') ||
      pathValue.startsWith('/@vite/') ||
      pathValue.startsWith('/@id/') ||
      pathValue.startsWith('/@fs/') ||
      pathValue.startsWith('/@react-refresh') ||
      pathValue.startsWith('/proxy-site') ||
      pathValue.startsWith('/api/proxy')
    ) {
      return next();
    }

    const referer = req.headers.referer;
    if (referer && referer.includes('/proxy-site/')) {
      try {
        const match = referer.match(/\/proxy-site\/([^/]+)/);
        if (match && match[1]) {
          const host = match[1];
          const targetUrl = `https://${host}${req.originalUrl}`;
          return await handleProxyRequest(targetUrl, host, req, res);
        }
      } catch (err) {
        console.error('[Referer Matching Exception]', err);
      }
    }
    next();
  });

  // 2. Main parameterized proxy route
  app.all('/proxy-site/:host*', async (req, res) => {
    const host = req.params['host'] || '';
    const prefix = `/proxy-site/${host}`;
    let subpath = req.originalUrl.substring(prefix.length);
    const targetUrl = `https://${host}${subpath}`;
    await handleProxyRequest(targetUrl, host, req, res);
  });

  // 3. Vite development middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
