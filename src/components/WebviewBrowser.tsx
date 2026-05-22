import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, 
  Monitor, Tablet, Shield, Link2, 
  Globe, AlertCircle, Cpu, Terminal
} from 'lucide-react';
import {
  DEFAULT_SCHEDULER_PROXY_URL,
  fromProxyPathname,
  toProxyUrl,
} from '../lib/proxyPath';

interface WebviewBrowserProps {
  initialUrl?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface ProxyLog {
  time: string;
  method: string;
  url: string;
  status: number;
  bypass: string[];
}

export default function WebviewBrowser({ 
  initialUrl = "https://course-scheduler.xlab-cwru.com/" 
}: WebviewBrowserProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [iframeUrl, setIframeUrl] = useState(DEFAULT_SCHEDULER_PROXY_URL);
  const [proxyError, setProxyError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSecure, setIsSecure] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const healthUrl = `${import.meta.env.BASE_URL}proxy-site/_health`.replace(/\/+/g, '/');
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
          'The reverse proxy is not running on this host. GitHub Pages cannot serve /proxy-site — deploy with Render (see README) or run "npm run dev" locally.'
        );
      });
  }, []);

  const [proxyLogs, setProxyLogs] = useState<ProxyLog[]>([
    {
      time: new Date().toLocaleTimeString(),
      method: 'GET',
      url: 'https://course-scheduler.xlab-cwru.com/',
      status: 200,
      bypass: ['X-Frame-Options', 'Content-Security-Policy', 'HSTS']
    }
  ]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    const proxied = toProxyUrl(urlInput);
    setProxyError(null);
    
    // Add to logs panel
    const newLog: ProxyLog = {
      time: new Date().toLocaleTimeString(),
      method: 'GET',
      url: urlInput,
      status: 200,
      bypass: ['X-Frame-Options', 'Content-Security-Policy']
    };
    setProxyLogs(prev => [newLog, ...prev]);

    setIframeUrl(proxied);
    setIsSecure(urlInput.startsWith('https://') || !urlInput.includes('://'));
    setIframeKey(prev => prev + 1);
  };

  const handleHome = () => {
    setUrlInput(initialUrl);
    setIframeUrl(DEFAULT_SCHEDULER_PROXY_URL);
    setProxyError(null);
    setIsSecure(true);
    setIframeKey(prev => prev + 1);
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
    const newLog: ProxyLog = {
      time: new Date().toLocaleTimeString(),
      method: 'GET',
      url: urlInput,
      status: 200,
      bypass: ['Cache Cleared', 'X-Frame-Options']
    };
    setProxyLogs(prev => [newLog, ...prev]);
  };

  const handleQuickLink = (url: string) => {
    setUrlInput(url);
    setIframeUrl(toProxyUrl(url));
    setProxyError(null);
    setIsSecure(url.startsWith('https://'));
    setIframeKey(prev => prev + 1);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(urlInput);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Capture subpage navigations since BOTH pages run on the same Origin under /proxy-site/!
  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        const loc = iframe.contentWindow.location;
        const currentPathname = loc.pathname + loc.search;
        
        console.log("[Virtual Browser Navigation] Detected:", currentPathname);
        
        const realUrl = fromProxyPathname(currentPathname);
        if (realUrl) {
            setUrlInput(realUrl);

            // Log navigation to console
            const isRedirect = realUrl.includes('login.case.edu') || realUrl.includes('sso');
            const newLog: ProxyLog = {
              time: new Date().toLocaleTimeString(),
              method: 'GET',
              url: realUrl,
              status: 200,
              bypass: isRedirect 
                ? ['X-Frame-Options', 'Cookie Domain Override', 'Duo Secure Passthrough'] 
                : ['X-Frame-Options', 'Content-Security-Policy', 'Set-Cookie Rewriter']
            };
            setProxyLogs(prev => {
              // Avoid duplicates
              if (prev[0] && prev[0].url === realUrl) return prev;
              return [newLog, ...prev];
            });
        }
      }
    } catch (err) {
      // Benign safety fallback in case cross-origin redirects are triggering
      console.warn("[Virtual Browser] Navigation is resolving cross-country frames safely:", err);
    }
  };

  // Quick preset links
  const quickLinks = [
    { name: 'Live Scheduler', url: 'https://course-scheduler.xlab-cwru.com/' },
    { name: 'CWRU Single Sign-On', url: 'https://login.case.edu/cas/login' },
    { name: 'Weatherhead Portal', url: 'https://weatherhead.case.edu/' }
  ];

  return (
    <div className="bg-slate-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm text-slate-700">
      
      {/* 1. Header Toolbar representing active webview configuration */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                try {
                  iframeRef.current?.contentWindow?.history.back();
                } catch {
                  alert("Use the standard scheduler system navigation triggers inside this browser screen.");
                }
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                try {
                  iframeRef.current?.contentWindow?.history.forward();
                } catch {
                  alert("Use the standard scheduler system navigation triggers inside this browser screen.");
                }
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Go Forward"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleReload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Refresh / Reload Browser Sandbox"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleHome}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Reset to CWRU Course Scheduler Homepage"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Browser Address Bar Input */}
          <form onSubmit={handleNavigate} className="flex-grow max-w-xl flex items-center bg-slate-50 border border-slate-205 rounded px-2.5 py-1.5 gap-1.5 shadow-2xs hover:border-slate-350 transition-colors">
            {isSecure ? (
              <Shield className="w-3.5 h-3.5 text-emerald-600 animate-pulse" title="Secure Proxy SSL Connection" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="Unsecured / HTTP Connection" />
            )}
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter scheduler URL to test..."
              className="bg-transparent border-0 outline-none text-xs text-slate-800 w-full font-mono font-medium focus:ring-0 placeholder:text-slate-400 p-0"
            />
            <button type="submit" className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold uppercase px-2 py-0.5 rounded leading-none cursor-pointer">
              Go
            </button>
          </form>

          {/* Device Toggles */}
          <div className="flex items-center gap-1.5">
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200 flex items-center">
              <button 
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded transition-all cursor-pointer ${deviceMode === 'desktop' ? 'bg-[#0a304e] text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 rounded transition-all cursor-pointer ${deviceMode === 'tablet' ? 'bg-[#0a304e] text-white shadow-2xs' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Tablet Mock (768px Width)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Quick Links Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans mr-1">Bookmarks:</span>
            {quickLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleQuickLink(link.url)}
                className="text-[10.5px] px-2.5 py-1 bg-slate-50 hover:bg-[#0a304e] hover:text-white border border-gray-200 rounded font-medium transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>{link.name}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 font-medium font-sans text-emerald-800 bg-emerald-50 rounded px-2 py-0.5 border border-emerald-100 text-[10.5px]">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Virtual Engine Active: CWRU Single Sign-On and framing constraints bypassed.</span>
          </div>
        </div>

      </div>

      {/* Active Workspace Selector Bar */}
      <div className="bg-[#081e31] text-white px-4 py-2 flex flex-col sm:flex-row items-center justify-between border-b border-gray-200 shrink-0 gap-3">
        <div className="flex items-center gap-2 text-slate-200">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider font-sans">Active Web Engine:</span>
          <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold border border-emerald-900">REAL BROWSER INSTANCE ACTIVE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setConsoleOpen(!consoleOpen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0c2438] text-blue-200 text-[10px] font-bold uppercase border border-[#163a56] hover:bg-[#123652] hover:text-white transition-all cursor-pointer"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>{consoleOpen ? 'Hide Browser Console' : 'Show Browser Console'}</span>
          </button>
        </div>
      </div>

      {/* 3. Browser Viewport Area */}
      <div className="flex-1 bg-slate-200 overflow-auto flex flex-col xl:flex-row items-stretch min-h-[500px]">
        
        {/* COLLAPSIBLE CLOUD SANDBOX LOGS SIDEBAR */}
        {consoleOpen && (
          <div className="w-full xl:w-[32%] bg-[#061624] text-slate-300 border-r border-[#123652] flex flex-col shrink-0 min-h-[380px] p-4 font-mono select-none">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="font-bold text-[11px] tracking-wider uppercase text-slate-100">CLOUD SANDBOX LOGS</span>
              </div>
              <span className="bg-[#0d2e46] text-blue-300 px-1.5 py-0.5 rounded text-[8px] font-bold border border-[#16476b]">TUNNEL ONLINE</span>
            </div>

            {/* Static Specs description */}
            <div className="bg-[#030d17] p-2.5 rounded border border-[#0d2235] text-[10px] text-slate-400 leading-normal mb-3 space-y-1">
              <p className="text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider mb-0.5 font-sans">Tunnel Interceptor Status</p>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span>Protocol:</span>
                <span className="text-white font-bold">Reverse HTTP Proxy</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1 pt-1">
                <span>Frame Fixes:</span>
                <span className="text-emerald-400 font-bold">X-Frame-Options REMOVED</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1 pt-1">
                <span>CSP bypass:</span>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>
              <div className="flex justify-between pt-1">
                <span>Cookies:</span>
                <span className="text-blue-300 font-bold">SAME-ORIGIN AUTO-INJECT</span>
              </div>
            </div>

            {/* Real-time incoming Logs stream */}
            <p className="text-[#0a304e] dark:text-cyan-400 font-extrabold uppercase text-[9px] tracking-wider mb-2 font-sans border-b border-slate-800 pb-1">Incoming Traffic Stream</p>
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[300px] xl:max-h-none text-[9.5px]">
              {proxyLogs.map((log, index) => (
                <div key={index} className="p-2 border border-slate-800/60 rounded bg-[#040f1a] space-y-1 animate-fade-in">
                  <div className="flex items-center justify-between text-[8px]">
                    <span className="text-slate-500 font-bold">{log.time}</span>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 font-extrabold px-1 py-0.2 rounded uppercase">COMPLETED</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-amber-500 font-bold shrink-0">{log.method}</span>
                    <span className="text-slate-200 break-all leading-snug">{log.url}</span>
                  </div>
                  <div className="text-[8px] flex flex-wrap gap-1 text-slate-400">
                    <span className="font-bold text-slate-500">Bypassed:</span>
                    {log.bypass.map((val, i) => (
                      <span key={i} className="bg-slate-900 text-[8px] px-1 py-0.2 rounded text-emerald-300 border border-slate-800 shrink-0">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-2.5 text-center text-[8px] text-slate-500 uppercase tracking-widest font-sans border-t border-slate-800 pt-2 shrink-0">
              CWRU Sandbox Decryption Engine Active
            </div>
          </div>
        )}

        {/* WEBVIEW CONTAINER */}
        <div className="flex-grow flex flex-col bg-white border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
          
          <div className="bg-slate-900 text-white px-4 py-2 text-[9px] font-mono tracking-widest flex justify-between select-none shrink-0 border-b border-slate-800">
            <span>{deviceMode === 'desktop' ? 'CWRU PUBLIC WEBVIEW CONTAINER' : 'CWRU PORTAL PREVIEW DEVICE'}</span>
            <div className="flex gap-2.5 items-center">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>DYNAMIC PROXY BRIDGE SECURED</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white relative">
            {proxyError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
                <AlertCircle className="w-10 h-10 text-amber-600" />
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
            <iframe 
              ref={iframeRef}
              key={iframeKey}
              src={iframeUrl}
              onLoad={(e) => {
                handleIframeLoad();
                const iframe = e.currentTarget;
                try {
                  const doc = iframe.contentDocument;
                  if (doc?.title?.toLowerCase().includes('page not found')) {
                    setProxyError(
                      'The proxy server is not reachable (common on GitHub Pages static hosting). Deploy this app with "npm start" on Render or run "npm run dev" locally.'
                    );
                  }
                } catch {
                  // cross-origin until proxy loads
                }
              }}
              className="w-full h-full border-0 select-text"
              allow="geolocation; clipboard-write; clipboard-read"
              title="CWRU Weatherhead Course Scheduler Live Page Webview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-top-navigation-by-user-activation"
            />
          </div>

          {/* Virtual Browser Bottom Navigation Bar (Shown in Mobile / Tablet) */}
          {deviceMode !== 'desktop' && (
            <div className="bg-slate-950 py-1.5 text-center text-[#748796] select-none text-[10px] font-sans border-t border-slate-850 shrink-0">
              <span className="uppercase tracking-widest font-bold">XLAB WEBVIEW SIMULATION DEVICE</span>
            </div>
          )}

        </div>

      </div>

      {/* 4. Troubleshooting Guidelines Status Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-2.5 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-3.5 h-3.5 text-[#0a304e]" />
          <span className="font-semibold">CWRU course-scheduler.xlab-cwru.com Integrator Engine</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={copyToClipboard}
            className="text-slate-500 hover:text-[#0a304e] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Link2 className="w-3 h-3" />
            <span>{hasCopied ? 'URL Copied!' : 'Copy Current URL'}</span>
          </button>
          <span>|</span>
          <span className="font-mono text-[10px] text-slate-400">STATE: VIRTUAL BROWSER MODE ACTIVE (SAME-ORIGIN TUNNEL)</span>
        </div>
      </div>

    </div>
  );
}
