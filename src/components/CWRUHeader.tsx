/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Monitor, Award, ExternalLink, HelpCircle } from 'lucide-react';

interface CWRUHeaderProps {
  viewMode: 'split' | 'sandbox' | 'ref';
  setViewMode: (mode: 'split' | 'sandbox' | 'ref') => void;
  activeChapter: number;
  goToChapter: (idx: number) => void;
}

export default function CWRUHeader({ viewMode, setViewMode, activeChapter, goToChapter }: CWRUHeaderProps) {
  return (
    <header className="bg-[#0a304e] text-white border-b border-[#0f3f64] shadow-md sticky top-0 z-50 transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Logo and branding */}
        <div className="flex items-center gap-4">
          <div className="bg-white text-[#0a304e] rounded-sm p-1.5 font-bold text-center leading-none tracking-widest text-[11px] w-11 h-11 flex flex-col justify-center items-center select-none shadow-sm">
            <span className="font-extrabold text-[16px]">C</span>
            <span className="text-[7.5px] -mt-1 font-bold uppercase tracking-wider">W R U</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] tracking-[0.25em] font-bold text-blue-200 uppercase">
                Case Western Reserve University
              </span>
              <span className="px-1.5 py-0.5 rounded-[3px] text-[8px] bg-[#0c3c62] text-blue-100 font-bold uppercase tracking-wider">
                XLAB
              </span>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 -mt-0.5">
              Weatherhead Course Scheduler <span className="text-blue-300 font-light text-sm hidden sm:inline">| Interactive Guide</span>
            </h1>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center bg-[#072238] p-1 rounded-md border border-[#0f3b5e]">
          <button
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'split'
                ? 'bg-white text-[#0a304e] shadow-xs'
                : 'text-blue-100 hover:text-white hover:bg-slate-800/20'
            }`}
            title="Show Guide and Interactive Simulator side-by-side"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Guide</span>
          </button>
          
          <button
            onClick={() => setViewMode('sandbox')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'sandbox'
                ? 'bg-white text-[#0a304e] shadow-xs'
                : 'text-blue-100 hover:text-white hover:bg-slate-800/20'
            }`}
            title="Fullscreen Webview to interact directly with the Live Scheduler dashboard"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Fullscreen Webview</span>
          </button>

          <button
            onClick={() => setViewMode('ref')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              viewMode === 'ref'
                ? 'bg-white text-[#0a304e] shadow-xs'
                : 'text-blue-100 hover:text-white hover:bg-slate-800/20'
            }`}
            title="Quick reference glossary for all Scheduler database fields"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Field Glossary</span>
          </button>
        </div>

        {/* Official reference links */}
        <div className="flex items-center gap-3">
          <a
            href="https://course-scheduler.xlab-cwru.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0e3c60]/80 border border-[#16517e] hover:bg-[#124d7a] transition-all rounded text-xs text-blue-100 font-bold"
          >
            <span>Live Scheduler App</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </header>
  );
}
