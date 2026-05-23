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
  PROXIED_SCHEDULER_LOGIN_URL,
  fromProxyPathname,
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

function isSchedulerPastLogin(pathname: string): boolean {
  return (
    pathname.includes(`/proxy-site/${SCHEDULER_HOST}/`) &&
    !pathname.includes('/login') &&
    !pathname.includes('cwru-sso-callback')
  );
}

export default function WebviewBrowser({
  initialUrl = 'https://course-scheduler.xlab-cwru.com/login',
  onChaptersDetected,
}: WebviewBrowserProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [iframeUrl, setIframeUrl] = useState(DEFAULT_SCHEDULER_PROXY_URL);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [tunnelNotice, setTunnelNotice] = useState<string | null>(null);
  const [showSignInHelp, setShowSignInHelp] = useState(false);
  const [signInBusy, setSignInBusy] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const snapshotHistoryRef = useRef<ReturnType<typeof readSchedulerSnapshot>[]>([]);
  const popupRef = useRef<Window | null>(null);
  const popupPollRef = useRef<number | null>(null);

  const navigateIframe = useCallback((proxiedUrl: string, realUrl?: string) => {
    setIframeUrl(proxiedUrl);
    if (realUrl) setUrlInput(realUrl);
    setIframeKey((k) => k + 1);
    setShowSignInHelp(false);
  }, []);

  const stopPopupPoll = useCallback(() => {
    if (popupPollRef.current != null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
    popupRef.current = null;
    setSignInBusy(false);
  }, []);

  const finishSignInFromPopup = useCallback(
    (popupLocation: Location) => {
      const proxied = `${popupLocation.pathname}${popupLocation.search}${popupLocation.hash}`;
      const real = fromProxyPathname(popupLocation.pathname) ?? urlInput;
      stopPopupPoll();
      try {
        popupRef.current?.close();
      } catch {
        /* ignore */
      }
      setTunnelNotice('Sign-in complete — loading the scheduler…');
      navigateIframe(proxied, real);
      window.setTimeout(() => setTunnelNotice(null), 2500);
    },
    [navigateIframe, stopPopupPoll, urlInput]
  );

  const startPopupSignIn = useCallback(() => {
    stopPopupPoll();
    setSignInBusy(true);
    setTunnelNotice('Sign in using the popup window, then return here.');

    const popup = window.open(
      PROXIED_CAS_LOGIN_URL,
      'cwru-sso',
      'width=520,height=720,scrollbars=yes,resizable=yes'
    );
    if (!popup) {
      setSignInBusy(false);
      setTunnelNotice(null);
      setProxyError(
        'Popup blocked. Allow popups for this site, or use “Open scheduler in a new tab” below.'
      );
      return;
    }
    popupRef.current = popup;

    popupPollRef.current = window.setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        stopPopupPoll();
        setTunnelNotice(null);
        setIframeKey((k) => k + 1);
        return;
      }
      try {
        const loc = popupRef.current.location;
        if (isSchedulerPastLogin(loc.pathname)) {
          finishSignInFromPopup(loc);
        }
      } catch {
        /* still on CAS or another origin */
      }
    }, 400);
  }, [finishSignInFromPopup, stopPopupPoll]);

  useEffect(() => () => stopPopupPoll(), [stopPopupPoll]);

  const continueToScheduler = useCallback(() => {
    const snap = readSchedulerSnapshot(iframeRef.current);
    if (snap && isSchedulerPastLogin(snap.proxyPathname)) {
      navigateIframe(snap.proxyPathname, snap.realUrl ?? urlInput);
      return;
    }
    if (snap?.host === 'login.case.edu') {
      startPopupSignIn();
      return;
    }
    setTunnelNotice('Opening scheduler login…');
    navigateIframe(PROXIED_SCHEDULER_LOGIN_URL, initialUrl);
    window.setTimeout(() => setTunnelNotice(null), 2000);
  }, [initialUrl, navigateIframe, startPopupSignIn, urlInput]);

  const sampleIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let snap: ReturnType<typeof readSchedulerSnapshot> = null;
    try {
      snap = readSchedulerSnapshot(iframe);
    } catch {
      snap = null;
    }

    if (!snap) return;

    const onCas =
      snap.host === 'login.case.edu' && snap.path.includes('/cas/login');
    const onSchedulerLogin =
      snap.host === SCHEDULER_HOST && snap.path.includes('/login');
    setShowSignInHelp(onCas || onSchedulerLogin);

    const history = snapshotHistoryRef.current.filter(Boolean) as NonNullable<
      ReturnType<typeof readSchedulerSnapshot>
    >[];
    const last = history[history.length - 1];
    if (!last || last.proxyPathname !== snap.proxyPathname) {
      snapshotHistoryRef.current = [...history, snap].slice(-MAX_HISTORY);
    }

    const realUrl = fromProxyPathname(snap.proxyPathname);
    if (realUrl) setUrlInput(realUrl);

    const detected = detectChapterCompletions(
      snap,
      snapshotHistoryRef.current.filter(Boolean) as NonNullable<
        ReturnType<typeof readSchedulerSnapshot>
      >[]
    );
    if (detected.length > 0) {
      onChaptersDetected?.(detected);
    }
  }, [onChaptersDetected]);

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
          'The reverse proxy is not running on this host. Deploy with Render or run "npm run dev" locally.'
        );
      });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(sampleIframe, 1500);
    return () => window.clearInterval(interval);
  }, [sampleIframe]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    setProxyError(null);
    navigateIframe(toProxyUrl(urlInput), urlInput);
  };

  const handleHome = () => {
    setUrlInput(initialUrl);
    navigateIframe(PROXIED_SCHEDULER_LOGIN_URL, initialUrl);
    setProxyError(null);
  };

  const handleReload = () => {
    setIframeKey((k) => k + 1);
  };

  const handleIframeLoad = () => {
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
    <div className="flex flex-col h-full min-h-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => iframeRef.current?.contentWindow?.history.back()}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => iframeRef.current?.contentWindow?.history.forward()}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            title="Forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            title="Reload"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleHome}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
            title="Scheduler login"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleNavigate}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1"
        >
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 font-mono text-xs text-slate-800 outline-none"
            aria-label="Scheduler URL"
          />
          <button
            type="submit"
            className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700 hover:bg-slate-300"
          >
            Go
          </button>
        </form>

        <div className="flex rounded border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`rounded p-1.5 ${deviceMode === 'desktop' ? 'bg-[#0a304e] text-white' : 'text-slate-500'}`}
            title="Desktop"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`rounded p-1.5 ${deviceMode === 'tablet' ? 'bg-[#0a304e] text-white' : 'text-slate-500'}`}
            title="Tablet width"
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {tunnelNotice && (
        <p className="shrink-0 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-900">
          {tunnelNotice}
        </p>
      )}

      <div className="relative min-h-0 flex-1 bg-slate-100">
        {proxyError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-600" />
            <p className="max-w-md text-sm text-slate-700">{proxyError}</p>
            <a
              href={initialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0a304e] underline"
            >
              Open scheduler in a new tab
            </a>
          </div>
        )}

        {showSignInHelp && !proxyError && (
          <div className="absolute inset-x-0 top-0 z-20 flex justify-center gap-2 p-3 pointer-events-none flex-wrap">
            <button
              type="button"
              onClick={startPopupSignIn}
              disabled={signInBusy}
              className="pointer-events-auto flex items-center gap-2 rounded-lg bg-[#0a304e] px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[#08253d] disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {signInBusy ? 'Sign-in window open…' : 'Sign in with CWRU SSO'}
            </button>
            <button
              type="button"
              onClick={continueToScheduler}
              className="pointer-events-auto rounded-lg border border-[#0a304e] bg-white px-4 py-2.5 text-sm font-semibold text-[#0a304e] shadow-lg hover:bg-slate-50"
            >
              Continue in panel
            </button>
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
