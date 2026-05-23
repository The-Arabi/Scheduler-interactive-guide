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
  ExternalLink,
} from 'lucide-react';
import {
  DEFAULT_SCHEDULER_PROXY_URL,
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
type EmbedMode = 'proxy' | 'direct';

const MAX_HISTORY = 30;
const SCHEDULER_ORIGIN = 'https://course-scheduler.xlab-cwru.com';
const SCHEDULER_LOGIN_URL = `${SCHEDULER_ORIGIN}/login`;
const SCHEDULER_HOME_URL = `${SCHEDULER_ORIGIN}/`;

export default function WebviewBrowser({
  initialUrl = SCHEDULER_LOGIN_URL,
  onChaptersDetected,
}: WebviewBrowserProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [embedMode, setEmbedMode] = useState<EmbedMode>('proxy');
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

  const navigateIframe = useCallback(
    (url: string, mode: EmbedMode, displayUrl?: string) => {
      setEmbedMode(mode);
      setIframeUrl(url);
      setUrlInput(displayUrl ?? url);
      setIframeKey((k) => k + 1);
      setTunnelNotice(null);
    },
    []
  );

  const stopPopupPoll = useCallback(() => {
    if (popupPollRef.current != null) {
      window.clearInterval(popupPollRef.current);
      popupPollRef.current = null;
    }
    popupRef.current = null;
    setSignInBusy(false);
  }, []);

  const applyDirectSchedulerEmbed = useCallback(() => {
    stopPopupPoll();
    setTunnelNotice('Signed in — loading the scheduler…');
    navigateIframe(SCHEDULER_HOME_URL, 'direct', SCHEDULER_HOME_URL);
    window.setTimeout(() => setTunnelNotice(null), 2500);
  }, [navigateIframe, stopPopupPoll]);

  const startSignIn = useCallback(() => {
    stopPopupPoll();
    setSignInBusy(true);
    setTunnelNotice(
      'Complete sign-in in the popup, then close it (or leave it on the scheduler home page).'
    );

    const popup = window.open(
      SCHEDULER_LOGIN_URL,
      'cwru-scheduler-sso',
      'width=520,height=720,scrollbars=yes,resizable=yes'
    );
    if (!popup) {
      setSignInBusy(false);
      setTunnelNotice(null);
      setProxyError(
        'Popup blocked. Allow popups for this site, or use “Open scheduler in new tab” below.'
      );
      return;
    }
    popupRef.current = popup;

    popupPollRef.current = window.setInterval(() => {
      const win = popupRef.current;
      if (!win || win.closed) {
        applyDirectSchedulerEmbed();
        return;
      }
      try {
        const { hostname, pathname } = win.location;
        if (
          hostname === 'course-scheduler.xlab-cwru.com' &&
          pathname !== '/login' &&
          !pathname.startsWith('/api/auth')
        ) {
          applyDirectSchedulerEmbed();
        }
      } catch {
        /* CAS (login.case.edu) — cross-origin until redirect back */
      }
    }, 500);
  }, [applyDirectSchedulerEmbed, stopPopupPoll]);

  useEffect(() => () => stopPopupPoll(), [stopPopupPoll]);

  const sampleIframe = useCallback(() => {
    if (embedMode === 'direct') return;

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
  }, [embedMode, onChaptersDetected]);

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
    const trimmed = urlInput.trim();
    if (trimmed.includes('course-scheduler.xlab-cwru.com')) {
      const direct = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      navigateIframe(direct, 'direct', direct);
      return;
    }
    navigateIframe(toProxyUrl(trimmed), 'proxy', trimmed);
  };

  const handleHome = () => {
    if (embedMode === 'direct') {
      navigateIframe(SCHEDULER_HOME_URL, 'direct', SCHEDULER_HOME_URL);
    } else {
      navigateIframe(PROXIED_SCHEDULER_LOGIN_URL, 'proxy', SCHEDULER_LOGIN_URL);
    }
    setProxyError(null);
  };

  const handleReload = () => {
    setIframeKey((k) => k + 1);
  };

  const handleIframeLoad = () => {
    if (embedMode === 'direct') return;
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

  const showSignInBanner = embedMode === 'proxy' && !signInBusy;

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
            title="Scheduler home"
          >
            <Home className="h-3.5 w-3.5" />
          </button>
        </div>

        <form
          onSubmit={handleNavigate}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1"
        >
          <Shield
            className={`h-3.5 w-3.5 shrink-0 ${embedMode === 'direct' ? 'text-slate-400' : 'text-emerald-600'}`}
            title={embedMode === 'direct' ? 'Direct embed' : 'Proxied embed'}
          />
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

        <button
          type="button"
          onClick={startSignIn}
          disabled={signInBusy}
          className="flex items-center gap-1.5 rounded-lg bg-[#0a304e] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#08253d] disabled:opacity-60"
          title="Sign in with CWRU SSO (opens popup)"
        >
          <LogIn className="h-3.5 w-3.5" />
          Sign in
        </button>

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
              href={SCHEDULER_LOGIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#0a304e] underline"
            >
              Open scheduler in a new tab
            </a>
          </div>
        )}

        {showSignInBanner && !proxyError && (
          <div className="absolute inset-x-0 top-0 z-20 border-b border-[#0a304e]/20 bg-[#0a304e]/95 px-4 py-3 shadow-md">
            <p className="mb-2 text-center text-xs text-white/90">
              SSO must run on the real scheduler site (not through the proxy). Use the button
              below — do not use the scheduler&apos;s own SSO link in the preview.
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={startSignIn}
                disabled={signInBusy}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0a304e] shadow hover:bg-slate-100 disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {signInBusy ? 'Complete sign-in in popup…' : 'Sign in with CWRU SSO'}
              </button>
              <a
                href={SCHEDULER_LOGIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4" />
                New tab
              </a>
            </div>
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
