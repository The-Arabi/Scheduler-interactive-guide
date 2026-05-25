/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { BookOpen, Table, HelpCircle, AlertCircle, ExternalLink, MessageSquare } from 'lucide-react';
import cwruLogo from '../images.jpg';

interface CWRUHeaderProps {
  viewMode: 'guide' | 'features' | 'glossary';
  setViewMode: (mode: 'guide' | 'features' | 'glossary') => void;
}

export default function CWRUHeader({ viewMode, setViewMode }: CWRUHeaderProps) {
  return (
    <header className="bg-[#0a304e] text-white border-b border-blue-900/50 shadow-md sticky top-0 z-50 select-none backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row justify-between items-center gap-4">
        
        {/* Brand block - CWRU Emblem & Typography */}
        <div className="flex items-center gap-3.5 shrink-0">
          {/* CWRU Emblem */}
          <div className="flex items-center justify-center p-0.5 bg-white/5 rounded-lg border border-white/10 shadow-inner shrink-0">
            <img 
              src={cwruLogo} 
              alt="Case Western Reserve University Logo" 
              className="h-10 w-10 object-contain rounded"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="text-left">
            <span className="text-[9px] tracking-[0.2em] font-black text-blue-200/90 uppercase block leading-none">
              Case Western Reserve University
            </span>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white mt-1 leading-tight">
              Weatherhead Course Scheduler Companion
            </h1>
          </div>
        </div>

        {/* Core Mode Navigation Tabs */}
        <div className="flex items-center bg-[#072238] p-1 rounded-xl border border-blue-900/50 shadow-inner flex-nowrap whitespace-nowrap shrink-0">
          <button
            onClick={() => setViewMode('guide')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 ${
              viewMode === 'guide'
                ? 'bg-[#0a304e] text-white border border-blue-900/35 shadow-sm'
                : 'text-blue-200/85 hover:text-white hover:bg-white/5'
            }`}
            title="Step-by-step training checklist"
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0 text-blue-300" />
            <span>Training Checklist</span>
          </button>
          
          <button
            onClick={() => setViewMode('features')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 ${
              viewMode === 'features'
                ? 'bg-[#0a304e] text-white border border-blue-900/35 shadow-sm'
                : 'text-blue-200/85 hover:text-white hover:bg-white/5'
            }`}
            title="Overview of scheduler features and modules"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-blue-300" />
            <span>Features Catalog</span>
          </button>

          <button
            onClick={() => setViewMode('glossary')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer select-none whitespace-nowrap shrink-0 ${
              viewMode === 'glossary'
                ? 'bg-[#0a304e] text-white border border-blue-900/35 shadow-sm'
                : 'text-blue-200/85 hover:text-white hover:bg-white/5'
            }`}
            title="Variable definitions index for all scheduler tables"
          >
            <Table className="w-3.5 h-3.5 shrink-0" />
            <span>Database Glossary</span>
          </button>
        </div>

        {/* Action button block */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://docs.google.com/document/d/1JoBVbkRRLjRTOENwH5LXCNFaFYvBw6oJAKOooPtz8xY/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#072238] hover:bg-blue-950 border border-blue-900/35 text-xs text-blue-200 hover:text-white font-bold rounded-lg transition-colors select-none"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span>Submit Feedback ↗</span>
          </a>
          <a
            href="https://course-scheduler.xlab-cwru.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 hover:scale-[1.02] active:scale-95 transition-all text-xs text-white font-black rounded-lg shadow-sm select-none"
          >
            <span>Launch Scheduler ↗</span>
          </a>
        </div>

      </div>
    </header>
  );
}
