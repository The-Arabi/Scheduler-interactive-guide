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

const CAS_HOST = 'login.case.edu';
const SCHEDULER_HOST = 'course-scheduler.xlab-cwru.com';

/** Keep navigation/fetch on /proxy-site/<host>/... — never break out to bare login.case.edu URLs. */
function buildNavigationShim(appBase: string): string {
  const schedulerPx = joinProxyPath(
    proxyPrefixForHost(SCHEDULER_HOST, appBase),
    '/'
  ).replace(/\/$/, '');
  const casPx = joinProxyPath(proxyPrefixForHost(CAS_HOST, appBase), '/').replace(
    /\/$/,
    ''
  );
  return `<script id="xlab-proxy-nav-shim">(function(){
var S=${JSON.stringify(schedulerPx)},C=${JSON.stringify(casPx)};
var HOSTS={${JSON.stringify(CAS_HOST)}:C,${JSON.stringify(SCHEDULER_HOST)}:S};
function px(h){return HOSTS[h]||S;}
function curPx(){var m=(location.pathname||"").match(/\\/proxy-site\\/([^/]+)/);return m?px(m[1]):S;}
function casPath(path,host){if(host==="login.case.edu"&&(path==="/login"||path.indexOf("/login?")===0))return path.replace(/^\\/login/,"/cas/login");return path;}
function f(u){
  if(typeof u!=="string")return u;
  if(u.indexOf("/proxy-site/")!==-1)return u;
  try{
    if(u.indexOf("//")===0){u=(location.protocol||"https:")+u;}
    if(u.indexOf("http://")===0||u.indexOf("https://")===0){
      var abs=new URL(u);
      if(HOSTS[abs.hostname])return px(abs.hostname)+casPath(abs.pathname,abs.hostname)+abs.search+abs.hash;
      return u;
    }
    if(u.charAt(0)==="/"){
      var m=(location.pathname||"").match(/\\/proxy-site\\/([^/]+)/);
      var host=m?m[1]:"";
      return curPx()+casPath(u,host);
    }
  }catch(e){}
  return u;
}
var h=history,ps=h.pushState.bind(h),rs=h.replaceState.bind(h);
h.pushState=function(st,ti,u){return ps(st,ti,f(u));};
h.replaceState=function(st,ti,u){return rs(st,ti,f(u));};
var l=location,a=l.assign.bind(l),r=l.replace.bind(l);
l.assign=function(u){return a(f(u));};
l.replace=function(u){return r(f(u));};
var of=window.fetch;
window.fetch=function(i,n){if(typeof i==="string")i=f(i);else if(i&&i.url)i=new Request(f(i.url),i);return of(i,n);};
if((l.pathname||"").indexOf("cwru-sso-callback")!==-1){
  setTimeout(function(){if((l.pathname||"").indexOf("cwru-sso-callback")!==-1)r(f("/"));},1500);
}
})();</script>`;
}

/** After CAS auth, send the browser to the proxied scheduler callback (service= param). */
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
function serviceUrl(){
  var q=new URLSearchParams(location.search);
  var s=q.get("service");
  if(s)return s;
  var el=document.querySelector('input[name="service"]');
  return el?el.value:null;
}
function go(){
  var s=serviceUrl();
  if(!s)return;
  var t=absToProxy(s);
  if(t)location.replace(t);
}
function rewriteForms(){
  document.querySelectorAll("form[action]").forEach(function(f){
    var a=f.getAttribute("action");
    if(!a)return;
    var p=absToProxy(a.indexOf("http")===0?a:(location.origin+a));
    if(p)f.setAttribute("action",p);
    if(p&&f.id==="fm1"&&f.method&&f.method.toLowerCase()==="post"){
      var t=f.querySelector('input[name="service"]');
      if(t&&t.value){var u=absToProxy(t.value);if(u)setTimeout(function(){location.replace(u);},50);}
    }
  });
}
function maybeContinue(){
  if(document.querySelector(".alert-danger,.errors,#loginErrors"))return;
  rewriteForms();
  var pwd=document.querySelector('input[name="password"],input[type="password"]');
  var txt=(document.body&&document.body.innerText)||"";
  if(txt.indexOf("You have successfully logged in")!==-1){go();return;}
  if(!pwd||pwd.offsetParent===null||pwd.disabled)go();
}
document.addEventListener("DOMContentLoaded",function(){rewriteForms();maybeContinue();});
setTimeout(maybeContinue,400);
setTimeout(maybeContinue,1200);
setTimeout(maybeContinue,2500);
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

  // CAS uses form action="login" (relative) → must not become .../login on login.case.edu
  result = result.replace(
    /https?:\/\/login\.case\.edu\/login/gi,
    'https://login.case.edu/cas/login'
  );
  result = result.replace(
    /\/proxy-site\/login\.case\.edu\/login/gi,
    '/proxy-site/login.case.edu/cas/login'
  );

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
      ? buildNavigationShim(config.appBase)
      : '';
  const casContinue =
    host === CAS_HOST ? buildCasSsoContinueScript(config.appBase) : '';
  const headInjection = `${navShim}${casContinue}${baseTag}`;

  let result = rewriteContentUrls(html, config);

  if (result.includes('<head>')) {
    result = result.replace('<head>', `<head>${headInjection}`);
  } else if (result.includes('<HEAD>')) {
    result = result.replace('<HEAD>', `<HEAD>${headInjection}`);
  } else {
    result = headInjection + result;
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
      /(action|href)=(["'])login\2/gi,
      `$1=$2${casAction}$2`
    );
    const proxyBase = relativeProxyBase(config, host);
    result = result.replace(
      /(href|src|action)=(["'])(?!https?:|\/|#|mailto:|javascript:|data:)([^"']+)\2/gi,
      (_m, attr, quote, rel) => {
        const path = rel === 'login' ? '/cas/login' : `/${rel}`;
        return `${attr}=${quote}${joinProxyPath(proxyBase, path)}${quote}`;
      }
    );
  }

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
      outHeaders[key] = rewriteLocationHeader(value, host, config);
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
