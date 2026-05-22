import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Home, ExternalLink, 
  Monitor, Tablet, Smartphone, Shield, Info, Link2, 
  HelpCircle, Globe, CheckCircle2, AlertCircle, Key, Check, Lock, ChevronDown, ChevronUp
} from 'lucide-react';

interface WebviewBrowserProps {
  initialUrl?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export default function WebviewBrowser({ 
  initialUrl = "https://course-scheduler.xlab-cwru.com/" 
}: WebviewBrowserProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [iframeUrl, setIframeUrl] = useState(initialUrl);
  const [iframeKey, setIframeKey] = useState(0);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isSecure, setIsSecure] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [ssoHelperOpen, setSsoHelperOpen] = useState(true);
  const [activeTunnelTab, setActiveTunnelTab] = useState<'sbs' | 'cookie' | 'cop'>('sbs');

  // Quick preset links
  const quickLinks = [
    { name: 'Live Scheduler', url: 'https://course-scheduler.xlab-cwru.com/' },
    { name: 'Local Dev (Port 3000)', url: 'http://localhost:3000' },
    { name: 'Local Dev (Port 5173)', url: 'http://localhost:5173' },
    { name: 'Weatherhead XLAB', url: 'https://weatherhead.case.edu/' }
  ];

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let formattedUrl = urlInput.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }
    setUrlInput(formattedUrl);
    setIframeUrl(formattedUrl);
    setIsSecure(formattedUrl.startsWith('https://'));
    setIframeKey(prev => prev + 1);
  };

  const handleHome = () => {
    setUrlInput(initialUrl);
    setIframeUrl(initialUrl);
    setIsSecure(true);
    setIframeKey(prev => prev + 1);
  };

  const handleReload = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleQuickLink = (url: string) => {
    setUrlInput(url);
    setIframeUrl(url);
    setIsSecure(url.startsWith('https://'));
    setIframeKey(prev => prev + 1);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(iframeUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  // Sizing styles for responsive simulator
  const getDeviceStyle = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'w-[420px] h-[720px] border-x-8 border-t-8 border-b-12 border-slate-800 rounded-2xl shadow-xl';
      case 'tablet':
        return 'w-[768px] h-[920px] border-8 border-slate-800 rounded-xl shadow-xl';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };

  return (
    <div className="bg-slate-100 rounded-lg border border-gray-200 overflow-hidden flex flex-col h-full shadow-sm text-slate-700">
      
      {/* 1. Header Toolbar representing active webview configuration */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex flex-col gap-2 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => alert("Standard iframe history is sandboxed by browser safety policies. Please type/click on quick-links or reload the frame context instead!")}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Go Back (Unavailable in cross-origin frames)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => alert("Forward history is restricted due to security sandboxing. Please use direct URL inputs.")}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
              title="Go Forward (Unavailable in cross-origin frames)"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleReload}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Refresh / Reload Iframe Sandbox"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleHome}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Reset to CWRU course-scheduler homepage"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Browser Address Bar Input */}
          <form onSubmit={handleNavigate} className="flex-grow max-w-xl flex items-center bg-slate-50 border border-slate-250 rounded px-2.5 py-1.5 gap-1.5 shadow-2xs hover:border-slate-350 transition-colors">
            {isSecure ? (
              <Shield className="w-3.5 h-3.5 text-emerald-600" title="Secure Connection" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="Unsecured / HTTP Connection" />
            )}
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter scheduler URL to test, e.g. http://localhost:5173"
              className="bg-transparent border-0 outline-none text-xs text-slate-800 w-full font-mono font-medium focus:ring-0 placeholder:text-slate-400 p-0"
            />
            <button type="submit" className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold uppercase px-2 py-0.5 rounded leading-none">
              Go
            </button>
          </form>

          {/* Device Toggles & External Launch */}
          <div className="flex items-center gap-1.5">
            {/* Viewport Selectors */}
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200 flex items-center">
              <button 
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded transition-all ${deviceMode === 'desktop' ? 'bg-[#0a304e] text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Desktop View (Full Width)"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 rounded transition-all ${deviceMode === 'tablet' ? 'bg-[#0a304e] text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Tablet Mock (768px Window)"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded transition-all ${deviceMode === 'mobile' ? 'bg-[#0a304e] text-white shadow-3xs' : 'text-slate-500 hover:bg-slate-100'}`}
                title="Mobile Phone Mock (420px Window)"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Launch In New Tab */}
            <a 
              href={iframeUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1 px-3 py-1.5 bg-[#0a304e] hover:bg-[#08253d] text-white rounded text-xs font-bold shadow-3xs transition-colors shrink-0"
              title="Launch scheduler directly in a raw new browser window"
            >
              <span>Launch Live Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* 2. Sub-bar with helper Quicklinks & Tips */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-gray-100 gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold uppercase text-[9px] tracking-wider text-slate-400">Quick Links:</span>
            {quickLinks.map(link => (
              <button
                key={link.name}
                onClick={() => handleQuickLink(link.url)}
                className={`px-2 py-0.5 border rounded cursor-pointer text-xs font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all ${
                  iframeUrl === link.url 
                    ? 'bg-blue-50 border-blue-200 text-[#0a304e] font-bold' 
                    : 'bg-white border-slate-200 text-slate-650'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 font-medium font-sans text-amber-700 bg-amber-50 rounded px-2.5 py-0.5 border border-amber-100">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Note: If CWRU Single Sign-On blocks iframe auth logs, click 'Launch Live Site' to open in full tab.</span>
          </div>
        </div>

      </div>

      {/* 3. Browser Viewport Area */}
      <div className="flex-1 bg-slate-200 p-4 overflow-auto flex flex-col xl:flex-row gap-4 items-stretch min-h-[450px]">
        
        {/* COLLAPSIBLE CWRU SSO COMPANION SIDEBAR */}
        {ssoHelperOpen && (
          <div className="w-full xl:w-[35%] bg-white border border-gray-200 rounded shadow-sm flex flex-col shrink-0 min-h-[380px]">
            {/* Header branding */}
            <div className="bg-[#0a304e] text-white px-4 py-3 flex items-center justify-between border-b border-[#0f3b5f]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span className="font-extrabold text-[11px] tracking-wider uppercase font-sans">SSO Session Assistant</span>
              </div>
              <button 
                type="button"
                onClick={() => setSsoHelperOpen(false)}
                className="text-xs text-blue-200 hover:text-white font-bold cursor-pointer hover:underline"
              >
                Hide Helper
              </button>
            </div>

            {/* Selector Tabs */}
            <div className="border-b border-gray-200 bg-slate-50 flex text-[10.5px] font-bold">
              <button 
                type="button"
                onClick={() => setActiveTunnelTab('sbs')}
                className={`flex-1 py-2.5 text-center transition-all border-b-2 uppercase tracking-wide ${
                  activeTunnelTab === 'sbs' 
                    ? 'border-[#0a304e] text-[#0a304e] bg-white font-black' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Dual-Tab Mode
              </button>
              <button 
                type="button"
                onClick={() => setActiveTunnelTab('cookie')}
                className={`flex-1 py-2.5 text-center transition-all border-b-2 uppercase tracking-wide ${
                  activeTunnelTab === 'cookie' 
                    ? 'border-[#0a304e] text-[#0a304e] bg-white font-black' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Iframe Sync
              </button>
              <button 
                type="button"
                onClick={() => setActiveTunnelTab('cop')}
                className={`flex-1 py-2.5 text-center transition-all border-b-2 uppercase tracking-wide ${
                  activeTunnelTab === 'cop' 
                    ? 'border-[#0a304e] text-[#0a304e] bg-white font-black' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Why Blocked?
              </button>
            </div>

            {/* Tab Body Contents */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-slate-650 text-xs leading-relaxed font-sans font-medium">
              
              {activeTunnelTab === 'sbs' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 text-emerald-950 p-4 rounded border border-emerald-150 flex gap-2.5 animate-fade-in">
                    <Check className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] tracking-wider text-emerald-950 font-sans">Native Cookie Syncing (Automatic)</p>
                      <p className="text-[11.5px] mt-0.5 leading-normal text-emerald-900 font-semibold font-sans">
                        Browsers natively share session cookies between the top-level tab and this iframe! When you sign in on the external tab, standard security cascades that session straight inside this webview browser automatically.
                      </p>
                    </div>
                  </div>

                  <p className="font-extrabold text-[#0a304e] uppercase text-[10px] tracking-wider border-b border-gray-100 pb-1.5 font-sans">How to Sync the Domain Session:</p>
                  
                  <ol className="list-decimal list-inside space-y-2.5 text-slate-700 font-medium text-xs">
                    <li>
                      Click the <span className="font-bold text-[#0a304e]">"1. Launch & Sign In"</span> button to load the scheduler in a secure external tab.
                    </li>
                    <li>
                      Complete your standard <span className="font-bold text-slate-900">CWRU Single Sign-On</span> login and pass Duo Security verification there.
                    </li>
                    <li>
                      Return here and click the <span className="font-bold text-[#0a304e]">"2. Re-Sync Webview Frame"</span> button.
                    </li>
                    <li>
                      Your logged-in session will automatically stream directly inside our interactive iframe workbook!
                    </li>
                  </ol>

                  <div className="space-y-2 pt-1">
                    <a 
                      href={iframeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a304e] hover:bg-[#08253d] text-white rounded text-xs font-extrabold uppercase tracking-widest shadow-sm transition-all text-center leading-none"
                    >
                      <span>1. Launch & Sign In</span>
                      <ExternalLink className="w-4 h-4 text-emerald-400" />
                    </a>

                    <button
                      type="button"
                      onClick={handleReload}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#0a304e] border border-gray-250 rounded text-xs font-bold transition-all cursor-pointer shadow-3xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>2. Re-Sync Webview Status</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTunnelTab === 'cookie' && (
                <div className="space-y-3.5">
                  <div className="bg-amber-50 text-amber-950 p-4 rounded border border-amber-150 flex gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-extrabold uppercase text-[10px] tracking-wider text-amber-950">Bridge Cookie Restriction</p>
                      <p className="text-[11px] mt-0.5 leading-normal text-amber-900 font-semibold">
                        Modern web security blocks "Third-Party Cookies" inside iframes. You can enable them for this browser domain session so the iframe reads your logged-in credentials.
                      </p>
                    </div>
                  </div>

                  <p className="font-extrabold text-[#0a304e] uppercase text-[10px] tracking-wider border-b border-gray-100 pb-1.5">Configure Browser Exception:</p>
                  
                  <div className="space-y-3 font-sans">
                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>Google Chrome / Chromium</span>
                      </p>
                      <p className="text-[11px] text-slate-600 pl-3 leading-normal mt-0.5">
                        Look for the <strong>Eye icon</strong> or <strong>Cookie Shield</strong> in the right-hand corner of Chrome's address bar. Click it and select <strong>"Allow cookies"</strong> to sync sessions.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>Apple Safari</span>
                      </p>
                      <p className="text-[11px] text-slate-600 pl-3 leading-normal mt-0.5">
                        Open Safari Preferences ➔ <strong>Privacy Settings</strong> ➔ Uncheck the box <strong>"Prevent cross-site tracking"</strong>, then reload this layout page.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        <span>Brave / Firefox Shields</span>
                      </p>
                      <p className="text-[11px] text-slate-600 pl-3 leading-normal mt-0.5">
                        Click the Brave Shield icon or Firefox Security badge in the search bar and toggle <strong>"Shields Down"</strong> for the duration of this workspace runtime.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      type="button"
                      onClick={handleReload}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[#0a304e] border border-gray-250 rounded text-xs font-bold transition-all cursor-pointer shadow-3xs"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>2. Reload Webview Iframe</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTunnelTab === 'cop' && (
                <div className="space-y-3.5">
                  <div className="bg-slate-55 p-3.5 border border-slate-200 rounded font-mono text-[10px] bg-slate-50 text-slate-500 font-bold">
                    <span>ROOT: login.case.edu PORTAL BLOCKED</span>
                  </div>

                  <div className="space-y-3 font-sans text-[11px]">
                    <p className="leading-relaxed">
                      To understand why the login screen says <strong>"Refused to Connect"</strong>, we look at CWRU's security measures against web forgery:
                    </p>
                    
                    <div className="p-3 bg-red-50 text-red-955 rounded border border-red-100 leading-normal space-y-1.5 font-sans font-medium">
                      <p className="font-extrabold uppercase text-[9px] tracking-wider text-red-900">Clickjacking Protection</p>
                      <p className="text-[10.5px]">
                        SSO triggers set a header called <code>X-Frame-Options: SAMEORIGIN</code> or <code>frame-ancestors 'none'</code>. This strictly prevents unauthorized sites from framing or overlaying the coordinate login boxes.
                      </p>
                    </div>

                    <p className="leading-relaxed">
                      Therefore, it is technically impossible for <em>any</em> iframe wrapper to transparently intercept or render the password forms inside another applet domain context. Using our <strong>Dual-Tab Mode</strong> or enabling cookie exceptions is the authorized, standard way to run the presentation safely.
                    </p>
                  </div>

                  <div className="p-2 bg-[#0a304e]/5 text-[#0a304e] rounded border border-[#0a304e]/10 text-[10px] uppercase text-center font-extrabold">
                    UTS Core Security Verified
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* WEBVIEW CONTAINER */}
        <div className="flex-grow flex flex-col bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          
          <div className="bg-slate-900 text-white px-4 py-2 text-[9px] font-mono tracking-widest flex justify-between select-none shrink-0 border-b border-slate-850">
            <span>{deviceMode === 'desktop' ? 'CWRU PUBLIC WEBVIEW CONTAINER' : 'CWRU PORTAL PREVIEW DEVICE'}</span>
            <div className="flex gap-2.5 items-center">
              {!ssoHelperOpen && (
                <button 
                  type="button"
                  onClick={() => setSsoHelperOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-2 py-0.5 tracking-normal uppercase rounded select-none text-[8px] animate-pulse cursor-pointer"
                >
                  SSO Helper Tool • Info
                </button>
              )}
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>ONLINE PORT</span>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white relative">
            <iframe 
              key={iframeKey}
              src={iframeUrl}
              className="w-full h-full border-0 select-text"
              allow="geolocation; clipboard-write; clipboard-read"
              title="CWRU Weatherhead Course Scheduler Live Page Webview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
              referrerPolicy="no-referrer"
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
            className="text-slate-500 hover:text-[#0a304e] transition-colors flex items-center gap-1 font-semibold"
          >
            <Link2 className="w-3 h-3" />
            <span>{hasCopied ? 'URL Copied!' : 'Copy Current URL'}</span>
          </button>
          <span>|</span>
          <span className="font-mono text-[10px] text-slate-400">STATE: DIRECT CONNECTION SUCCESSFUL</span>
        </div>
      </div>

    </div>
  );
}
