import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  Shield,
  AlertCircle,
  Monitor,
  Tablet,
  LogIn,
} from 'lucide-react';
import {
  DEFAULT_SCHEDULER_PROXY_URL,
  PROXIED_CAS_LOGIN_URL,
  PROXIED_SCHEDULER_HOME_URL,
  PROXIED_SCHEDULER_LOGIN_URL,
  fromProxyPathname,
  pullExternalIntoProxy,
  toAbsoluteProxyUrl,
  toProxyUrl,
} from '../lib/proxyPath';
import {
  detectChapterCompletions,
  readSchedulerSnapshot,
} from '../lib/schedulerObjectives';

interface WebviewBrowserProps {
  initialUrl?: string;
  onChaptersDetected?: (chapterIds: number[]) => void;
}

type DeviceMode = 'desktop' | 'tablet';

const MAX_HISTORY = 30;
const SCHEDULER_HOST = 'course-scheduler.xlab-cwru.com';
const SCHEDULER_LOGIN_URL = `https://${SCHEDULER_HOST}/login`;
const PROXIED_EDITOR_URL = toProxyUrl(`https://${SCHEDULER_HOST}/editor`);

function isProxiedSchedulerAuthed(pathname: string, search: string): boolean {
  if (!pathname.includes(`/proxy-site/${SCHEDULER_HOST}`)) return false;
  if (search.includes('error=')) return false;
  if (pathname.includes('cwru-sso-callback')) return false;
  if (/\/login\/?(\?|$)/.test(pathname)) return false;
  return true;
}

/** If popup/iframe broke out to bare scheduler/CAS, pull back onto /proxy-site/... */
function pullWindowIntoProxy(win: Window): boolean {
  try {
    const proxied = pullExternalIntoProxy(win.location.href);
    if (proxied) {
      win.location.replace(proxied);
      return true;
    }
  } catch {
    /* cross-origin */
  }
  return false;
}

export default function WebviewBrowser({
  onChaptersDetected,
}: WebviewBrowserProps) {
  const [urlInput, setUrlInput] = useState(() => toAbsoluteProxyUrl(SCHEDULER_LOGIN_URL));
  const [iframeUrl, setIframeUrl] = useState(DEFAULT_SCHEDULER_PROXY_URL);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [tunnelNotice, setTunnelNotice] = useState<string | null>(null);
  const [signInBusy, setSignInBusy] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const snapshotHistoryRef = useRef<ReturnType<typeof readSchedulerSnapshot>[]>([]);
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<number | null>(null);
  const popupAuthedPathRef = useRef<string | null>(null);

  const navigateIframe = useCallback((proxiedPath: string) => {
    const path = proxiedPath.startsWith('/proxy-site/')
      ? proxiedPath
      : toProxyUrl(proxiedPath);
    setIframeUrl(path);
    setUrlInput(toAbsoluteProxyUrl(path));
    setIframeKey((k) => k + 1);
    setTunnelNotice(null);
    setSignInBusy(false);
  }, []);

  const stopPopupPoll = useCallback(() => {
    if (popupPollRef.current != null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
    popupRef.current = null;
    setSignInBusy(false);
  }, []);

  const syncPanelFromPopup = useCallback(
    (popupLoc: Location) => {
      const proxied = `${popupLoc.pathname}${popupLoc.search}${popupLoc.hash}`;
      popupAuthedPathRef.current = proxied;
      stopPopupPoll();
      try {
        popupRef.current?.close();
      } catch {
        /* ignore */
      }
      setTunnelNotice('Signed in — loading the scheduler in the panel…');
      navigateIframe(proxied);
      window.setTimeout(() => setTunnelNotice(null), 2500);
    },
    [navigateIframe, stopPopupPoll]
  );

  const pollPopup = useCallback(() => {
    const win = popupRef.current;
    if (!win) return;

    if (win.closed) {
      stopPopupPoll();
      if (popupAuthedPathRef.current) {
        navigateIframe(popupAuthedPathRef.current);
      } else {
        setTunnelNotice(
          'Popup closed. If you finished signing in, click “Load session”.'
        );
      }
      return;
    }

    if (pullWindowIntoProxy(win)) return;

    try {
      if (win.location.origin !== window.location.origin) return;
      const { pathname, search } = win.location;
      if (isProxiedSchedulerAuthed(pathname, search)) {
        syncPanelFromPopup(win.location);
      }
    } catch {
      /* ignore */
    }
  }, [navigateIframe, stopPopupPoll, syncPanelFromPopup]);

  const startSignIn = useCallback(() => {
    stopPopupPoll();
    popupAuthedPathRef.current = null;
    setSignInBusy(true);
    setTunnelNotice(
      'Sign in through the popup. Stay on this site — do not use a separate scheduler tab.'
    );

    const popup = window.open(
      toAbsoluteProxyUrl(PROXIED_CAS_LOGIN_URL),
      'cwru-scheduler-sso',
      'width=520,height=720,scrollbars=yes,resizable=yes'
    );
    if (!popup) {
      setSignInBusy(false);
      setTunnelNotice(null);
      setProxyError('Popup blocked. Allow popups, or open sign-in in a new tab from the banner.');
      return;
    }
    popupRef.current = popup;
    popupPollRef.current = window.setInterval(pollPopup, 300);
  }, [pollPopup, stopPopupPoll]);

  const loadProxiedSession = useCallback(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      try {
        if (pullWindowIntoProxy(iframe.contentWindow!)) return;
      } catch {
        const pulled = pullExternalIntoProxy(iframe.src);
        if (pulled) {
          navigateIframe(new URL(pulled).pathname + new URL(pulled).search);
          return;
        }
      }
    }

    const snap = readSchedulerSnapshot(iframeRef.current);
    if (snap && isProxiedSchedulerAuthed(snap.proxyPathname, '')) {
      navigateIframe(snap.proxyPathname);
      return;
    }
    if (popupAuthedPathRef.current) {
      navigateIframe(popupAuthedPathRef.current);
      return;
    }

    setTunnelNotice('Loading scheduler (proxied)…');
    navigateIframe(PROXIED_EDITOR_URL);
    window.setTimeout(() => setTunnelNotice(null), 2000);
  }, [navigateIframe]);

  useEffect(() => () => stopPopupPoll(), [stopPopupPoll]);

  const enforceIframeProxy = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      if (pullWindowIntoProxy(iframe.contentWindow!)) return;
      const { pathname, search } = iframe.contentWindow!.location;
      if (
        pathname.includes(`/proxy-site/${SCHEDULER_HOST}`) &&
        (pathname.includes(`/proxy-site/${SCHEDULER_HOST}/login`) || search.includes('error='))
      ) {
        /* still on login — expected before sign-in */
      }
    } catch {
      const pulled = pullExternalIntoProxy(iframe.src);
      if (pulled) {
        const u = new URL(pulled);
        navigateIframe(u.pathname + u.search);
      }
    }
  }, [navigateIframe]);

  const sampleIframe = useCallback(() => {
    enforceIframeProxy();

    const iframe = iframeRef.current;
    if (!iframe) return;

    let snap: ReturnType<typeof readSchedulerSnapshot> = null;
    try {
      snap = readSchedulerSnapshot(iframe);
    } catch {
      snap = null;
    }

    if (!snap) return;

    const history = snapshotHistoryRef.current.filter(Boolean) as NonNullable<
      ReturnType<typeof readSchedulerSnapshot>
    >[];
    const last = history[history.length - 1];
    if (!last || last.proxyPathname !== snap.proxyPathname) {
      snapshotHistoryRef.current = [...history, snap].slice(-MAX_HISTORY);
    }

    setUrlInput(toAbsoluteProxyUrl(snap.proxyPathname));

    const detected = detectChapterCompletions(
      snap,
      snapshotHistoryRef.current.filter(Boolean) as NonNullable<
        ReturnType<typeof readSchedulerSnapshot>
      >[]
    );
    if (detected.length > 0) {
      onChaptersDetected?.(detected);
    }
  }, [enforceIframeProxy, onChaptersDetected]);

  useEffect(() => {
    const healthUrl = `${import.meta.env.BASE_URL}proxy-site/_health`.replace(
      /\/+/g,
      '/'
    );
    fetch(healthUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Proxy unavailable');
        return res.json();
      })
      .then((data) => {
        if (!data?.proxy) throw new Error('Proxy unavailable');
        setProxyError(null);
      })
      .catch(() => {
        setProxyError(
          'The reverse proxy is not running. Deploy with Render or run "npm run dev" locally.'
        );
      });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(sampleIframe, 1200);
    return () => window.clearInterval(interval);
  }, [sampleIframe]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    setProxyError(null);
    const trimmed = urlInput.trim();
    if (trimmed.includes('/proxy-site/')) {
      try {
        const u = new URL(trimmed);
        navigateIframe(u.pathname + u.search + u.hash);
      } catch {
        navigateIframe(trimmed);
      }
      return;
    }
    navigateIframe(toProxyUrl(trimmed));
  };

  const handleHome = () => {
    navigateIframe(PROXIED_SCHEDULER_LOGIN_URL);
    setProxyError(null);
  };

  const handleReload = () => {
    setIframeKey((k) => k + 1);
  };

  const handleIframeLoad = () => {
    enforceIframeProxy();
    window.setTimeout(sampleIframe, 200);
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc?.title?.toLowerCase().includes('page not found')) {
        setProxyError(
          'The proxy server is not reachable. Deploy with Render or run "npm run dev" locally.'
        );
      }
    } catch {
      sampleIframe();
    }
  };

  const iframeFrameClass =
    deviceMode === 'tablet'
      ? 'mx-auto w-full max-w-[768px] h-full'
      : 'w-full h-full';

  return (
    <div className="flex flex-col h-full min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden text-slate-800">
      <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1 select-none">
          <button
            type="button"
            onClick={() => iframeRef.current?.contentWindow?.history.back()}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => iframeRef.current?.contentWindow?.history.forward()}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Reload"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleHome}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Scheduler login (proxied)"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleNavigate}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1"
        >
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-600" title="Proxied URL" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-xs text-slate-800 outline-none"
            aria-label="Proxied scheduler URL"
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 hover:bg-slate-300 cursor-pointer font-sans"
          >
            Go
          </button>
        </form>

        <button
          type="button"
          onClick={startSignIn}
          disabled={signInBusy}
          className="flex items-center gap-1.5 rounded-lg bg-[#0a304e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#08253d] disabled:opacity-60 cursor-pointer font-sans"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </button>

        <button
          type="button"
          onClick={loadProxiedSession}
          className="rounded-lg border border-[#0a304e] px-3 py-1.5 text-xs font-semibold text-[#0a304e] hover:bg-slate-50 cursor-pointer font-sans"
        >
          Load session
        </button>

        <div className="flex rounded border border-slate-200 bg-slate-50 p-0.5 select-none">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`rounded p-1.5 cursor-pointer ${deviceMode === 'desktop' ? 'bg-[#0a304e] text-white' : 'text-slate-500'}`}
            title="Desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`rounded p-1.5 cursor-pointer ${deviceMode === 'tablet' ? 'bg-[#0a304e] text-white' : 'text-slate-500'}`}
            title="Tablet width"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {tunnelNotice && (
        <p className="shrink-0 bg-amber-50 border-b border-amber-205 px-3 py-1.5 text-xs text-amber-900 text-left font-semibold">
          {tunnelNotice}
        </p>
      )}

      <div className="relative min-h-0 flex-1 bg-slate-100">
        {proxyError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center select-none">
            <AlertCircle className="h-10 w-10 text-amber-600" />
            <p className="max-w-md text-sm text-slate-700 font-bold leading-normal">{proxyError}</p>
            <a
              href={toAbsoluteProxyUrl(PROXIED_CAS_LOGIN_URL)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-[#0a304e] underline"
            >
              Open proxied sign-in in a new tab
            </a>
          </div>
        )}

        {!proxyError && (
          <div className="absolute inset-x-0 top-0 z-20 border-b border-[#0a304e]/20 bg-[#0a304e]/95 px-4 py-2.5 shadow-md select-none">
            <p className="text-center text-xs text-white/95 font-semibold">
              Address bar must show <strong>/proxy-site/</strong> — not bare{' '}
              <strong>course-scheduler.xlab-cwru.com</strong>. Use <strong>Sign in</strong>, then{' '}
              <strong>Load session</strong> if needed.
            </p>
          </div>
        )}

        <div className={`absolute inset-0 ${iframeFrameClass}`}>
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={iframeUrl}
            onLoad={handleIframeLoad}
            className="h-full w-full border-0 bg-white"
            title="CWRU Course Scheduler"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
