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
  'dudbm6bcnmy8e.cloudfront.net',
];

const CAS_HOST = 'login.case.edu';
const SCHEDULER_HOST = 'course-scheduler.xlab-cwru.com';

/** Keep navigation/fetch on /proxy-site/<host>/... — never break out to bare login.case.edu URLs. */
function buildNavigationShim(config: ProxyConfig): string {
  const hostMapping: Record<string, string> = {};
  for (const h of config.hosts) {
    hostMapping[h] = joinProxyPath(proxyPrefixForHost(h, config.appBase), '/').replace(/\/$/, '');
  }
  const defaultPx = hostMapping[SCHEDULER_HOST] || '';

  return `<script id="xlab-proxy-nav-shim">(function(){
var HOSTS=${JSON.stringify(hostMapping)};
var S=${JSON.stringify(defaultPx)};
function px(h){return HOSTS[h]||S;}
function getHostFromPath(p){
  var parts=(p||"").split("/proxy-site/");
  return parts[1]?parts[1].split("/")[0]:"";
}
function curPx(){
  var host=getHostFromPath(location.pathname);
  return host?px(host):S;
}
function casPath(path,host){
  if(host==="login.case.edu"&&(path==="/login"||path.indexOf("/login?")===0)){
    return "/cas/login" + path.slice(6);
  }
  return path;
}
function f(u){
  if(!u)return u;
  var str=u;
  if(typeof str!=="string"){
    if(typeof str.toString==="function") str=str.toString();
    else return u;
  }
  if(str.indexOf("/proxy-site/")!==-1)return str;
  try{
    if(str.indexOf("//")===0){str=(location.protocol||"https:")+str;}
    if(str.indexOf("http://")===0||str.indexOf("https://")===0){
      var abs=new URL(str);
      if(HOSTS[abs.hostname])return px(abs.hostname)+casPath(abs.pathname,abs.hostname)+abs.search+abs.hash;
      if(abs.hostname===location.hostname && abs.pathname.indexOf("/proxy-site/")===-1){
        var host=getHostFromPath(location.pathname);
        if(host)return px(host)+casPath(abs.pathname,host)+abs.search+abs.hash;
      }
      return str;
    }
    if(str.charAt(0)==="/"){
      var host=getHostFromPath(location.pathname);
      return curPx()+casPath(str,host);
    }
  }catch(e){}
  return str;
}
var h=history,ps=h.pushState.bind(h),rs=h.replaceState.bind(h);
h.pushState=function(st,ti,u){return ps(st,ti,f(u));};
h.replaceState=function(st,ti,u){return rs(st,ti,f(u));};
var l=location,a=l.assign.bind(l),r=l.replace.bind(l);
l.assign=function(u){return a(f(u));};
l.replace=function(u){return r(f(u));};
var of=window.fetch;
window.fetch=function(i,n){
  if(i){
    try {
      if(typeof i==="string") {
        i=f(i);
      } else if(i instanceof URL) {
        i=f(i.toString());
      } else if(typeof i.url==="string") {
        var targetUrl=f(i.url);
        if(targetUrl!==i.url) {
          i=new Request(targetUrl,i);
        }
      } else if(typeof i.toString==="function") {
        var str=i.toString();
        if(str.indexOf("http")===0 || str.indexOf("/")===0) {
          i=f(str);
        }
      }
    } catch(e) {
      console.warn("[Proxy Fetch Shim Warning]", e);
    }
  }
  return of(i,n);
};
var ox=window.XMLHttpRequest.prototype.open;
window.XMLHttpRequest.prototype.open=function(m,u,a,usr,pwd){
  if(u) {
    try {
      if(typeof u==="string") u=f(u);
      else if(u instanceof URL) u=f(u.toString());
    } catch(e) {
      console.warn("[Proxy XHR Shim Warning]", e);
    }
  }
  return ox.call(this,m,u,a,usr,pwd);
};
var oo=window.open;
window.open=function(u,t,g){
  if(typeof u==="string") {
    try {
      u=f(u);
    } catch(e) {}
  }
  return oo.call(window,u,t,g);
};
document.addEventListener("click",function(e){
  try {
    var el=e.target&&e.target.closest?e.target.closest("a[href]"):null;
    if(!el)return;
    var h=el.getAttribute("href");
    if(!h)return;
    var n=f(h);
    if(n!==h){e.preventDefault();e.stopPropagation();location.assign(n);}
  } catch(e) {}
},true);
function pullBack(){
  if(!HOSTS[location.hostname]||location.pathname.indexOf("/proxy-site/")!==-1)return;
  var p=px(location.hostname)+casPath(location.pathname,location.hostname)+location.search+location.hash;
  location.replace(p);
}
pullBack();setInterval(pullBack,400);
})();</script>`;
}

/** Rewrite CAS forms/actions only — never navigate to the service URL without a CAS ticket. */
function buildCasSsoContinueScript(appBase: string): string {
  const schedulerPx = joinProxyPath(
    proxyPrefixForHost(SCHEDULER_HOST, appBase),
    '/'
  ).replace(/\/$/, '');
  const casPx = joinProxyPath(proxyPrefixForHost(CAS_HOST, appBase), '/').replace(
    /\/$/,
    ''
  );
  return `<script id="xlab-cas-sso-continue">(function(){
var SP=${JSON.stringify(schedulerPx)},CP=${JSON.stringify(casPx)};
function absToProxy(abs){
  try{
    var u=new URL(abs);
    if(u.hostname!=="course-scheduler.xlab-cwru.com"&&u.hostname!=="login.case.edu")return null;
    var px=u.hostname==="login.case.edu"?CP:SP;
    var path=u.pathname;
    if(u.hostname==="login.case.edu"&&(path==="/login"||path.indexOf("/login?")===0))path=path.replace(/^\\/login/,"/cas/login");
    return px+path+u.search+u.hash;
  }catch(e){return null;}
}
function rewriteForms(){
  document.querySelectorAll("form[action]").forEach(function(f){
    var a=f.getAttribute("action");
    if(!a)return;
    var p=absToProxy(a.indexOf("http")===0?a:(location.origin+a));
    if(p)f.setAttribute("action",p);
  });
  document.querySelectorAll("a[href]").forEach(function(a){
    var h=a.getAttribute("href");
    if(!h||h.indexOf("http")!==0)return;
    var p=absToProxy(h);
    if(p)a.setAttribute("href",p);
  });
}
document.addEventListener("DOMContentLoaded",rewriteForms);
setTimeout(rewriteForms,300);
})();</script>`;
}

/** Apereo CAS lives at /cas/login, not /login (which 404s). */
export function normalizeProxiedSubpath(host: string, subpath: string): string {
  if (host !== CAS_HOST) return subpath;
  if (subpath === '/login' || subpath.startsWith('/login?')) {
    return subpath.replace(/^\/login/, '/cas/login');
  }
  return subpath;
}

function fixCasLoginPath(path: string): string {
  if (path === '/login' || path.startsWith('/login?')) {
    return path.replace(/^\/login/, '/cas/login');
  }
  return path;
}

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
  const raw = `${appBaseNorm}proxy-site/${host}`;
  return ('/' + raw).replace(/\/+/g, '/');
}

/** Same-origin path prefix for a proxied host (used in HTML/JS rewrites). */
export function relativeProxyBase(config: ProxyConfig, targetHost: string): string {
  return joinProxyPath(proxyPrefixForHost(targetHost, config.appBase), '/').replace(
    /\/$/,
    ''
  );
}

function rewriteSetCookie(cookieVal: string, proxyPathPrefix: string): string {
  const cookieName = cookieVal.split('=')[0]?.trim() ?? '';
  
  // Strip any domain attribute from the cookie completely.
  // This allows the browser to store it locally on our guide application origin.
  let cleaned = cookieVal.replace(/;\s*domain=[^;]+/gi, '');

  if (cookieName.startsWith('__Host-')) {
    // __Host- cookies must have Path=/ and no Domain
    if (!/;\s*path=/i.test(cleaned)) {
      cleaned += '; Path=/';
    } else {
      cleaned = cleaned.replace(/;\s*path=[^;]*/i, '; Path=/');
    }
  } else {
    // Rewrite Path for all other cookies (including __Secure-) to match the root path '/' so they are sent with relative /api fetches
    if (!/;\s*path=/i.test(cleaned)) {
      cleaned += '; Path=/';
    } else {
      cleaned = cleaned.replace(/;\s*path=[^;]*/i, '; Path=/');
    }
  }

  // Force SameSite=None to support nested iframe contexts (like AI Studio)
  if (/;\s*samesite=[^;]*/i.test(cleaned)) {
    cleaned = cleaned.replace(/;\s*samesite=[^;]*/i, '; SameSite=None');
  } else {
    cleaned += '; SameSite=None';
  }

  // Force Secure
  if (!/;\s*secure/i.test(cleaned)) {
    cleaned += '; Secure';
  }
  return cleaned;
}

function rewriteLocationHeader(
  location: string,
  currentHost: string,
  config: ProxyConfig
): string {
  if (location.startsWith('http://') || location.startsWith('https://')) {
    const urlObj = new URL(location);
    if (!config.hosts.has(urlObj.host)) return location;
    const prefix = relativeProxyBase(config, urlObj.host);
    const pathname =
      urlObj.host === CAS_HOST ? fixCasLoginPath(urlObj.pathname) : urlObj.pathname;
    return joinProxyPath(prefix, `${pathname}${urlObj.search}${urlObj.hash}`);
  }
  // Relative redirects (e.g. Location: /login) must stay under /proxy-site/<host>/
  // or the iframe navigates to this app's /login and loads the guide inside itself.
  if (location.startsWith('/')) {
    if (location.includes('/proxy-site/')) return location;
    const path =
      currentHost === CAS_HOST ? fixCasLoginPath(location) : location;
    return joinProxyPath(relativeProxyBase(config, currentHost), path);
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
      (match, path = '') => {
        if (/cwru-sso-callback/i.test(path) || /cwru-sso-callback/i.test(match)) {
          return match;
        }
        return joinProxyPath(proxiedRoot, path);
      }
    );

    // JSON-escaped: https:\/\/host\/path (Next.js flight data)
    result = result.replace(
      new RegExp(`https?:\\\\/\\\\/${escapedHost}((?:\\\\/|[^"'\\\\])*)`, 'gi'),
      (match, rawPath = '') => {
        if (/cwru-sso-callback/i.test(rawPath) || /cwru-sso-callback/i.test(match)) {
          return match;
        }
        const path = rawPath.replace(/\\/g, '');
        const proxied = joinProxyPath(proxiedRoot, path || '/');
        return proxied.replace(/\//g, '\\/');
      }
    );

    // Protocol-relative: //host/path
    result = result.replace(
      new RegExp(`\\/\\/${escapedHost}([^"'\\s<>]*)`, 'g'),
      (match, path = '') => {
        if (/cwru-sso-callback/i.test(path) || /cwru-sso-callback/i.test(match)) {
          return match;
        }
        return joinProxyPath(proxiedRoot, path);
      }
    );

    // Note: we intentionally do NOT rewrite URL-encoded service= callback URLs —
    // CAS only accepts pre-registered https://course-scheduler.xlab-cwru.com/... callbacks.
  }

  // CAS uses form action="login" (relative) → must not become .../login on login.case.edu
  result = result.replace(
    /https?:\/\/login\.case\.edu\/login/gi,
    'https://login.case.edu/cas/login'
  );
  result = result.replace(
    /\/proxy-site\/login\.case\.edu\/login/gi,
    '/proxy-site/login.case.edu/cas/login'
  );

  for (const host of config.hosts) {
    const proxiedRoot = relativeProxyBase(config, host);
    const escapedHost = host.replace(/\./g, '\\.');
    result = result.replace(
      new RegExp(
        `(http-equiv=["']refresh["'][^>]*content=["'][^"']*?URL=https?:\\/\\/${escapedHost}([^"']*))`,
        'gi'
      ),
      (_m, _prefix, path = '') => `http-equiv="refresh" content="0;url=${joinProxyPath(proxiedRoot, path || '/')}"`
    );
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
  const navShim =
    host === SCHEDULER_HOST || host === CAS_HOST
      ? buildNavigationShim(config)
      : '';
  const casContinue =
    host === CAS_HOST ? buildCasSsoContinueScript(config.appBase) : '';
  const headInjection = `${navShim}${casContinue}${baseTag}`;

  let result = rewriteContentUrls(html, config);

  if (!result.includes('id="xlab-proxy-nav-shim"') && !result.includes('id="xlab-cas-sso-continue"')) {
    if (/<\/head>/i.test(result)) {
      result = result.replace(/<\/head>/i, `${headInjection}</head>`);
    } else if (/<head[\s>]/i.test(result)) {
      result = result.replace(/<head([^>]*)>/i, `<head$1>${headInjection}`);
    } else {
      result = headInjection + result;
    }
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
      const fixed =
        host === CAS_HOST ? fixCasLoginPath(path) : path;
      return `${attr}=${quote}${joinProxyPath(relativeProxyBase(config, host), fixed)}${quote}`;
    }
  );

  // CAS login form uses action="login" (no slash) — base tag resolves to /proxy-site/.../login → 404
  if (host === CAS_HOST) {
    const casAction = joinProxyPath(relativeProxyBase(config, host), '/cas/login');
    result = result.replace(
      /(action|href)=(["'])login(\?[^"']*)?\2/gi,
      (_m, attr, quote, query = '') => {
        return `${attr}=${quote}${casAction}${query}${quote}`;
      }
    );
    const proxyBase = relativeProxyBase(config, host);
    result = result.replace(
      /(href|src|action)=(["'])(?!https?:|\/|#|mailto:|javascript:|data:)([^"']+)\2/gi,
      (_m, attr, quote, rel) => {
        const path = (rel === 'login' || rel.startsWith('login?'))
          ? rel.replace(/^login/, '/cas/login')
          : `/${rel}`;
        return `${attr}=${quote}${joinProxyPath(proxyBase, path)}${quote}`;
      }
    );
  }

  return result;
}

function shouldRewriteBody(subpath: string, contentType: string): boolean {
  const normPath = subpath.split('?')[0].split('#')[0].toLowerCase();
  if (
    normPath.endsWith('.css') ||
    normPath.endsWith('.js') ||
    normPath.endsWith('.mjs') ||
    normPath.endsWith('.json')
  ) {
    return true;
  }
  const lower = contentType.toLowerCase();
  return REWRITABLE_CONTENT_TYPES.some((t) => lower.includes(t));
}

export async function handleProxyRequest(
  host: string,
  ctx: ProxyRequestContext,
  appBase = '/'
): Promise<ProxyResponse> {
  const config = createProxyConfig(appBase, ctx.publicOrigin);
  const proxyPathPrefix = proxyPrefixForHost(host, appBase);
  const subpath = normalizeProxiedSubpath(host, ctx.subpath || '/');
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

  const requestBody: BodyInit | undefined = ctx.body
    ? new Uint8Array(ctx.body).buffer
    : undefined;

  const isSsoCallback =
    host === SCHEDULER_HOST && subpath.includes('cwru-sso-callback');

  let response = await fetch(targetUrl, {
    method: ctx.method,
    headers,
    body: requestBody,
    redirect: 'manual',
  });

  // Let the browser handle SSO callback redirects natively: this updates browser address history,
  // prevents "ticket already consumed" errors on refresh, and ensures standard auth flows operate.
  const outHeaders: Record<string, string | string[]> = {};

  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (STRIPPED_RESPONSE_HEADERS.has(lowerKey)) return;
    if (lowerKey === 'set-cookie') return;

    if (lowerKey === 'location') {
      outHeaders[key] = rewriteLocationHeader(value, host, config);
      return;
    }

    outHeaders[key] = value;
  });

  // Extract cookies robustly, avoiding duplicate key iteration overwrites.
  let rawCookies: string[] = [];
  if (typeof response.headers.getSetCookie === 'function') {
    rawCookies = response.headers.getSetCookie();
  } else {
    const cookieVal = response.headers.get('set-cookie');
    if (cookieVal) {
      rawCookies = [cookieVal];
    }
  }

  if (rawCookies.length > 0) {
    outHeaders['set-cookie'] = rawCookies.map((c) => rewriteSetCookie(c, proxyPathPrefix));
  }

  // Force CORS wildcard headers to completely eliminate local asset or nested fetch CORS blocks
  outHeaders['access-control-allow-origin'] = '*';
  outHeaders['access-control-allow-methods'] = 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH';
  outHeaders['access-control-allow-headers'] = '*';

  if (response.status >= 300 && response.status < 400) {
    return { status: response.status, headers: outHeaders, body: Buffer.alloc(0) };
  }

  const normPath = subpath.split('?')[0].split('#')[0].toLowerCase();
  let contentType = response.headers.get('content-type') || '';
  if (normPath.endsWith('.css') && !contentType.toLowerCase().includes('css')) {
    contentType = 'text/css';
    outHeaders['content-type'] = 'text/css';
  } else if ((normPath.endsWith('.js') || normPath.endsWith('.mjs')) && !contentType.toLowerCase().includes('javascript')) {
    contentType = 'application/javascript';
    outHeaders['content-type'] = 'application/javascript';
  }

  if (shouldRewriteBody(subpath, contentType)) {
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
