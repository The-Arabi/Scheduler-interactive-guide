export interface ProxyRequestContext {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body?: Buffer;
  /** Path after /proxy-site/<host>, including leading slash and query string. */
  subpath: string;
  /** Public origin of this guide app, e.g. https://myapp.onrender.com */
  publicOrigin: string;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string | string[]>;
  body: Buffer | string;
}

export interface ProxyConfig {
  appBase: string;
  publicOrigin: string;
  hosts: Set<string>;
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

/** Hosts that must be loaded through /proxy-site/ so SSO works inside the iframe. */
export const DEFAULT_PROXY_HOSTS = [
  'login.case.edu',
  'course-scheduler.xlab-cwru.com',
];

const REWRITABLE_CONTENT_TYPES = [
  'text/html',
  'text/css',
  'text/javascript',
  'application/javascript',
  'application/json',
  'application/xml',
  'text/xml',
];

export function createProxyConfig(
  appBase = '/',
  publicOrigin: string,
  extraHosts: string[] = []
): ProxyConfig {
  return {
    appBase: appBase.endsWith('/') ? appBase : `${appBase}/`,
    publicOrigin: publicOrigin.replace(/\/$/, ''),
    hosts: new Set([...DEFAULT_PROXY_HOSTS, ...extraHosts]),
  };
}

export function joinProxyPath(prefix: string, subpath: string): string {
  const base = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
  const path = subpath.startsWith('/') ? subpath : `/${subpath}`;
  return `${base}${path}`;
}

export function proxyPrefixForHost(host: string, appBase: string): string {
  const appBaseNorm = appBase.endsWith('/') ? appBase : `${appBase}/`;
  return `${appBaseNorm}proxy-site/${host}`;
}

/** Same-origin path prefix for a proxied host (used in HTML/JS rewrites). */
export function relativeProxyBase(config: ProxyConfig, targetHost: string): string {
  return joinProxyPath(proxyPrefixForHost(targetHost, config.appBase), '/').replace(
    /\/$/,
    ''
  );
}

function rewriteSetCookie(cookieVal: string, proxyPathPrefix: string): string {
  let cleaned = cookieVal.replace(/;\s*domain=[^;]+/gi, '');
  if (!/;\s*path=/i.test(cleaned)) {
    cleaned += `; Path=${proxyPathPrefix}`;
  } else {
    cleaned = cleaned.replace(/;\s*path=[^;]*/i, `; Path=${proxyPathPrefix}`);
  }
  if (!/;\s*samesite=/i.test(cleaned)) {
    cleaned += '; SameSite=Lax';
  }
  if (!/;\s*secure/i.test(cleaned)) {
    cleaned += '; Secure';
  }
  return cleaned;
}

function rewriteLocationHeader(
  location: string,
  config: ProxyConfig
): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    const urlObj = new URL(location);
    if (!config.hosts.has(urlObj.host)) return location;
    const prefix = relativeProxyBase(config, urlObj.host);
    return joinProxyPath(prefix, `${urlObj.pathname}${urlObj.search}${urlObj.hash}`);
  }
  return location;
}

/** Rewrite every reference to proxied hosts in HTML/JS/JSON bodies. */
export function rewriteContentUrls(content: string, config: ProxyConfig): string {
  let result = content;

  for (const host of config.hosts) {
    const proxiedRoot = relativeProxyBase(config, host);
    const escapedHost = host.replace(/\./g, '\\.');

    // https://host/path and http://host/path
    result = result.replace(
      new RegExp(`https?:\\/\\/${escapedHost}([^"'\\s<>]*)`, 'gi'),
      (_match, path = '') => joinProxyPath(proxiedRoot, path)
    );

    // JSON-escaped: https:\/\/host\/path (Next.js flight data)
    result = result.replace(
      new RegExp(`https?:\\\\/\\\\/${escapedHost}((?:\\\\/|[^"'\\\\])*)`, 'gi'),
      (_match, rawPath = '') => {
        const path = rawPath.replace(/\\/g, '');
        const proxied = joinProxyPath(proxiedRoot, path || '/');
        return proxied.replace(/\//g, '\\/');
      }
    );

    // Protocol-relative: //host/path
    result = result.replace(
      new RegExp(`\\/\\/${escapedHost}([^"'\\s<>]*)`, 'g'),
      (_match, path = '') => joinProxyPath(proxiedRoot, path)
    );

    // Note: we intentionally do NOT rewrite URL-encoded service= callback URLs —
    // CAS only accepts pre-registered https://course-scheduler.xlab-cwru.com/... callbacks.
  }

  return result;
}

function rewriteHtmlDocument(
  html: string,
  host: string,
  config: ProxyConfig
): string {
  const proxyPathPrefix = joinProxyPath(
    proxyPrefixForHost(host, config.appBase),
    '/'
  );
  const baseTag = `<base href="${proxyPathPrefix}" />`;

  let result = rewriteContentUrls(html, config);

  if (result.includes('<head>')) {
    result = result.replace('<head>', `<head>${baseTag}`);
  } else if (result.includes('<HEAD>')) {
    result = result.replace('<HEAD>', `<HEAD>${baseTag}`);
  } else {
    result = baseTag + result;
  }

  // Root-relative asset URLs (Next.js /_next/...) — must include proxy prefix
  const originHttps = `https://${host}`;
  const originHttp = `http://${host}`;
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])${originHttps}(/[^"']*)?\\2`, 'gi'),
    (_m, attr, quote, path = '/') =>
      `${attr}=${quote}${joinProxyPath(relativeProxyBase(config, host), path)}${quote}`
  );
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])${originHttp}(/[^"']*)?\\2`, 'gi'),
    (_m, attr, quote, path = '/') =>
      `${attr}=${quote}${joinProxyPath(relativeProxyBase(config, host), path)}${quote}`
  );
  result = result.replace(
    new RegExp(`(href|src|action)=(["'])(/[^"']*)\\2`, 'gi'),
    (_m, attr, quote, path) => {
      if (path.startsWith('/proxy-site/') || path.startsWith('//')) return _m;
      return `${attr}=${quote}${joinProxyPath(relativeProxyBase(config, host), path)}${quote}`;
    }
  );

  return result;
}

function shouldRewriteBody(contentType: string): boolean {
  const lower = contentType.toLowerCase();
  return REWRITABLE_CONTENT_TYPES.some((t) => lower.includes(t));
}

export async function handleProxyRequest(
  host: string,
  ctx: ProxyRequestContext,
  appBase = '/'
): Promise<ProxyResponse> {
  const config = createProxyConfig(appBase, ctx.publicOrigin);
  const proxyPathPrefix = joinProxyPath(proxyPrefixForHost(host, appBase), '/');
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
      outHeaders[key] = rewriteLocationHeader(value, config);
      return;
    }

    outHeaders[key] = value;
  });

  if (response.status >= 300 && response.status < 400) {
    return { status: response.status, headers: outHeaders, body: Buffer.alloc(0) };
  }

  const contentType = response.headers.get('content-type') || '';
  if (shouldRewriteBody(contentType)) {
    const text = await response.text();
    const rewritten = contentType.includes('text/html')
      ? rewriteHtmlDocument(text, host, config)
      : rewriteContentUrls(text, config);
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
