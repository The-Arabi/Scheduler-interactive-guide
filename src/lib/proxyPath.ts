/** Base path for the reverse proxy (same origin as the guide app). */
export const PROXY_PREFIX = 'proxy-site';

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');

/** App base URL from Vite (e.g. "/" or "/Scheduler-interactive-guide/"). */
export function getAppBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  // Vite default "./" breaks iframe proxy URLs (resolves relative to the page, not site root)
  if (base === './' || (base.startsWith('.') && !base.startsWith('..'))) {
    return '/';
  }
  return base.endsWith('/') ? base : `${base}/`;
}

/** Build a same-origin proxy URL for an external https URL. */
export function toProxyUrl(externalUrl: string): string {
  let formatted = externalUrl.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = `https://${formatted}`;
  }
  try {
    const urlObj = new URL(formatted);
    const appBase = getAppBase();
    const path = urlObj.pathname + urlObj.search + urlObj.hash;
    return `${appBase}${PROXY_PREFIX}/${urlObj.host}${path.startsWith('/') ? path : `/${path}`}`;
  } catch {
    return `${getAppBase()}${PROXY_PREFIX}/course-scheduler.xlab-cwru.com/`;
  }
}

/** Scheduler login page — starts SSO through the proxy. */
export const PROXIED_SCHEDULER_LOGIN_URL = toProxyUrl(
  'https://course-scheduler.xlab-cwru.com/login'
);

/** Default scheduler entry point through the proxy. */
export const DEFAULT_SCHEDULER_PROXY_URL = PROXIED_SCHEDULER_LOGIN_URL;

export const SCHEDULER_SSO_CALLBACK =
  'https://course-scheduler.xlab-cwru.com/api/auth/cwru-sso-callback';

/** CWRU CAS login with scheduler SSO callback (must stay on /proxy-site/ path). */
export const PROXIED_CAS_LOGIN_URL = toProxyUrl(
  'https://login.case.edu/cas/login?service=https%3A%2F%2Fcourse-scheduler.xlab-cwru.com%2Fapi%2Fauth%2Fcwru-sso-callback'
);

const PROXY_HOST_PATTERN =
  /^(https?:\/\/)?(login\.case\.edu|course-scheduler\.xlab-cwru\.com)(\/|$)/i;

/** True when a URL targets a host that must load through the proxy, not directly in the iframe. */
export function isDirectExternalSchedulerUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return (
      (u.hostname === 'login.case.edu' || u.hostname === 'course-scheduler.xlab-cwru.com') &&
      !url.includes('/proxy-site/')
    );
  } catch {
    return PROXY_HOST_PATTERN.test(url.trim());
  }
}

/** Parse a proxy pathname back into the real external URL. */
export function fromProxyPathname(pathname: string): string | null {
  const appBase = getAppBase();
  const prefix = `${appBase}${PROXY_PREFIX}/`;
  if (!pathname.startsWith(prefix)) return null;

  const afterPrefix = pathname.slice(prefix.length);
  const slashIdx = afterPrefix.indexOf('/');
  if (slashIdx === -1) return null;

  const host = afterPrefix.slice(0, slashIdx);
  const path = afterPrefix.slice(slashIdx);
  return `https://${host}${path}`;
}
