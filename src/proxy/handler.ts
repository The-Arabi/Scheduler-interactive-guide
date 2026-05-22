export interface ProxyRequestContext {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body?: Buffer;
  /** Path after /proxy-site/<host>, including leading slash and query string. */
  subpath: string;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: Buffer | string;
}

const STRIPPED_RESPONSE_HEADERS = new Set([
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'strict-transport-security',
  'frame-options',
  'content-encoding',
  'transfer-encoding',
]);

const SKIP_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'sec-fetch-dest',
  'sec-fetch-mode',
  'sec-fetch-site',
]);

function rewriteSetCookie(cookieVal: string, proxyPathPrefix: string): string {
  let cleaned = cookieVal.replace(/;\s*domain=[^;]+/gi, '');
  cleaned = cleaned.replace(/;\s*secure/gi, '');
  if (!/;\s*path=/i.test(cleaned)) {
    cleaned += `; Path=${proxyPathPrefix}`;
  } else {
    cleaned = cleaned.replace(/;\s*path=[^;]*/i, `; Path=${proxyPathPrefix}`);
  }
  if (!/;\s*samesite=/i.test(cleaned)) {
    cleaned += '; SameSite=Lax';
  }
  return cleaned;
}

function joinProxyPath(prefix: string, subpath: string): string {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const path = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${base}${path}`;
}

function rewriteLocationHeader(
  location: string,
  host: string,
  proxyPathPrefix: string
): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    const urlObj = new URL(location);
    return joinProxyPath(proxyPathPrefix, `${urlObj.pathname}${urlObj.search}${urlObj.hash}`);
  }
  if (location.startsWith('/')) {
    return joinProxyPath(proxyPathPrefix, location);
  }
  return joinProxyPath(proxyPathPrefix, `/${location}`);
}

function rewriteHtmlUrls(html: string, host: string, proxyPathPrefix: string): string {
  const hostPattern = host.replace(/\./g, '\\.');
  const originHttps = `https://${host}`;
  const originHttp = `http://${host}`;

  let result = html;

  const baseTag = `<base href="${proxyPathPrefix}" />`;
  if (result.includes('<head>')) {
    result = result.replace('<head>', `<head>${baseTag}`);
  } else if (result.includes('<HEAD>')) {
    result = result.replace('<HEAD>', `<HEAD>${baseTag}`);
  } else {
    result = baseTag + result;
  }

  // Rewrite absolute URLs for this host to stay on the proxy path.
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])${originHttps}(/[^"']*)?\\2`, 'gi'),
    (_m, attr, quote, path = '/') => `${attr}=${quote}${proxyPathPrefix}${path}${quote}`
  );
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])${originHttp}(/[^"']*)?\\2`, 'gi'),
    (_m, attr, quote, path = '/') => `${attr}=${quote}${proxyPathPrefix}${path}${quote}`
  );
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])(/[^"']*)\\2`, 'gi'),
    (_m, attr, quote, path) => {
      if (path.startsWith(proxyPathPrefix) || path.startsWith('//')) return _m;
      return `${attr}=${quote}${proxyPathPrefix}${path}${quote}`;
    }
  );

  return result;
}

export async function handleProxyRequest(
  host: string,
  ctx: ProxyRequestContext,
  appBase = '/'
): Promise<ProxyResponse> {
  const appBaseNorm = appBase.endsWith('/') ? appBase : `${appBase}/`;
  const proxyPathPrefix = `${appBaseNorm}proxy-site/${host}/`;
  const subpath = ctx.subpath || '/';
  const targetUrl = `https://${host}${subpath}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(ctx.headers)) {
    if (!value) continue;
    const lowerKey = key.toLowerCase();
    if (SKIP_REQUEST_HEADERS.has(lowerKey)) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else {
      headers.append(key, value);
    }
  }

  headers.set('host', host);
  headers.set('origin', `https://${host}`);

  const incomingReferer = ctx.headers.referer;
  if (typeof incomingReferer === 'string' && incomingReferer.includes('/proxy-site/')) {
    const match = incomingReferer.match(/\/proxy-site\/([^/]+)(.*)/);
    if (match) {
      const refHost = match[1];
      const refPath = match[2] || '/';
      headers.set('referer', `https://${refHost}${refPath}`);
    }
  } else {
    headers.set('referer', `https://${host}/`);
  }

  const response = await fetch(targetUrl, {
    method: ctx.method,
    headers,
    body: ctx.body,
    redirect: 'manual',
  });

  const outHeaders: Record<string, string | string[]> = {};

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (STRIPPED_RESPONSE_HEADERS.has(lowerKey)) return;

    if (lowerKey === 'set-cookie') {
      const values =
        typeof response.headers.getSetCookie === 'function'
          ? response.headers.getSetCookie()
          : value
            ? [value]
            : [];
      outHeaders['set-cookie'] = values.map((c) =>
        rewriteSetCookie(c, proxyPathPrefix)
      );
      return;
    }

    if (lowerKey === 'location') {
      outHeaders[key] = rewriteLocationHeader(value, host, proxyPathPrefix);
      return;
    }

    outHeaders[key] = value;
  });

  if (response.status >= 300 && response.status < 400) {
    const body = Buffer.alloc(0);
    return { status: response.status, headers: outHeaders, body };
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const htmlText = await response.text();
    const rewritten = rewriteHtmlUrls(htmlText, host, proxyPathPrefix);
    return { status: response.status, headers: outHeaders, body: rewritten };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: outHeaders, body: buffer };
}

export function parseProxyPath(
  requestPath: string,
  appBase = '/'
): { host: string; subpath: string } | null {
  const appBaseNorm = appBase.endsWith('/') ? appBase : `${appBase}/`;
  const prefix = `${appBaseNorm}proxy-site/`;
  if (!requestPath.startsWith(prefix)) return null;

  const remainder = requestPath.slice(prefix.length);
  const slashIdx = remainder.indexOf('/');
  if (slashIdx === -1) return null;

  const host = remainder.slice(0, slashIdx);
  const subpath = remainder.slice(slashIdx) || '/';
  return { host, subpath };
}
