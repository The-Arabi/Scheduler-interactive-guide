/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, CheckCircle, ChevronRight, ChevronLeft, ArrowRight, Table, AlertCircle, HelpCircle, Save, Calendar, Play } from 'lucide-react';
import { motion } from 'motion/react';

export interface Chapter {
  id: number;
  title: string;
  badge: string;
  objectiveText: string;
  isCompleted: (state: any) => boolean;
  content: React.ReactNode;
  hint?: string;
}

interface GuideContentProps {
  activeChapterIdx: number;
  setActiveChapterIdx: (idx: number) => void;
  simulatorState: any;
  chapters: Chapter[];
  onToggleComplete?: (id: number) => void;
}

export default function GuideContent({
  activeChapterIdx,
  setActiveChapterIdx,
  simulatorState,
  chapters,
  onToggleComplete,
}: GuideContentProps) {
  const currentChapter = chapters[activeChapterIdx];
  const isCompleted = currentChapter.isCompleted(simulatorState);

  const handleNext = () => {
    if (activeChapterIdx < chapters.length - 1) {
      setActiveChapterIdx(activeChapterIdx + 1);
    }
  };

  const handlePrev = () => {
    if (activeChapterIdx > 0) {
      setActiveChapterIdx(activeChapterIdx - 1);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
      {/* Chapter Progress Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#0a304e] tracking-widest uppercase">
            Chapter {activeChapterIdx + 1} of {chapters.length}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded border border-gray-200 uppercase">
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
          {chapters.map((ch, idx) => {
            const isChCompleted = ch.isCompleted(simulatorState);
            const isChActive = idx === activeChapterIdx;
            return (
              <div
                key={ch.id}
                onClick={() => setActiveChapterIdx(idx)}
                className={`flex-1 h-full border-r border-white last:border-0 cursor-pointer transition-all ${
                  isChActive 
                    ? 'bg-[#0a304e] h-2' 
                    : isChCompleted 
                    ? 'bg-emerald-500' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
                title={`${ch.title} (${isChCompleted ? 'Completed' : 'Pending'})`}
              />
            );
          })}
        </div>
        
        <h2 className="text-lg font-bold text-slate-900 mt-3 flex items-center gap-2 font-serif">
          {currentChapter.title}
        </h2>
      </div>

      {/* Guide Main Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Objective Toast */}
        <div className={`p-4 rounded border transition-all duration-300 ${
          isCompleted 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-3xs'
            : 'bg-amber-50/80 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-full p-1 ${
              isCompleted ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
            }`}>
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isCompleted ? 'Objective complete' : 'Step objective'}
              </h4>
              <p className="text-sm mt-0.5 font-medium leading-relaxed font-sans">
                {currentChapter.objectiveText}
              </p>
              {isCompleted && (
                <p className="text-xs mt-1.5 text-emerald-700">
                  Detected from your actions in the live scheduler panel.
                </p>
              )}
              {currentChapter.hint && !isCompleted && (
                <p className="text-xs mt-1.5 text-amber-700 italic bg-amber-100/50 p-1.5 px-2 rounded border border-amber-200/50">
                  <strong>Hint:</strong> {currentChapter.hint}
                </p>
              )}
              {!isCompleted && onToggleComplete && (
                <button
                  type="button"
                  onClick={() => onToggleComplete(currentChapter.id)}
                  className="mt-3 px-3 py-1.5 text-[11px] font-semibold text-[#0a304e] hover:bg-[#0a304e]/10 rounded border border-[#0a304e]/20 transition-colors"
                >
                  Mark done manually
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Written PDF Content */}
        <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed space-y-4">
          {currentChapter.content}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={activeChapterIdx === 0}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {isCompleted && activeChapterIdx < chapters.length - 1 ? (
          <motion.button
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: [1, 1.03, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
            onClick={handleNext}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0a304e] hover:bg-[#08253d] text-white rounded text-xs font-bold shadow-md cursor-pointer font-sans"
          >
            <span>Proceed to Next</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <button
            onClick={handleNext}
            disabled={activeChapterIdx === chapters.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs font-medium hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100"
          >
            <span>Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
