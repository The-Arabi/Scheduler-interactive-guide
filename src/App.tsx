/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useCallback, useRef } from 'react';
import { 
  CheckCircle, Key, Lock, Sparkles, RefreshCw, BookOpen, ExternalLink, HelpCircle
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import CWRUHeader from './components/CWRUHeader';
import GuideContent, { Chapter } from './components/GuideContent';
import WebviewBrowser from './components/WebviewBrowser';
import TableKeysGlossary from './components/TableKeysGlossary';

export default function App() {
  // View structure control: 'split' (guide + live webview), 'sandbox' (webview full screen), 'ref' (field glossary)
  const [viewMode, setViewMode] = useState<'split' | 'sandbox' | 'ref'>('split');
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  // Chapters completion tracking list
  const [completedChapters, setCompletedChapters] = useState<number[]>([1]);

  // Alert/Success notifications
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'success' | 'info' }[]>([]);

  const addNotification = (text: string, type: 'success' | 'info' = 'success') => {
    const id = Math.random().toString();
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  const notifiedChaptersRef = useRef<Set<number>>(new Set([1]));

  const handleToggleComplete = (id: number) => {
    setCompletedChapters((prev) => {
      if (prev.includes(id)) {
        addNotification('Guide checkpoint reset.', 'info');
        return prev.filter((c) => c !== id);
      } else {
        addNotification('Milestone checked! Keep going.', 'success');
        const updated = [...prev, id];
        // Auto progress to next chapter if there is one available
        if (activeChapterIdx === id - 1 && id < guideChapters.length) {
          setTimeout(() => {
            setActiveChapterIdx(id);
          }, 800);
        }
        return updated;
      }
    });
  };

  const handleResetTraining = () => {
    setCompletedChapters([1]);
    setActiveChapterIdx(0);
    notifiedChaptersRef.current = new Set([1]);
    addNotification('Interactive instruction milestones have been reset.', 'info');
  };

  // High-fidelity educational handbook chapters
  const guideChapters: Chapter[] = [
    {
      id: 1,
      title: 'Portal Overview',
      badge: 'Welcome',
      pdfPage: 1,
      objectiveText: 'Use the scheduler panel on the right (loads automatically when the proxy is up).',
      isCompleted: (state) => state.completedChapters.includes(1),
      content: (
        <div className="space-y-4">
          <p className="font-semibold text-slate-800">
            Welcome to the Course Scheduler Interactive Guide.
          </p>
          <p>
            Operating as registrars or coordinators, Weatherhead administrators schedule academic lectures across the landmarks of Peter B. Lewis classrooms. This interactive workbook helps you master scheduler tasks by walking you through real production workflows.
          </p>
          <div className="bg-[#0a304e]/5 rounded p-4 border border-[#0a304e]/15 font-medium">
            <h5 className="text-xs font-bold text-[#0a304e] uppercase tracking-wider mb-1">Live Integration Workspace</h5>
            <p className="text-xs leading-relaxed text-slate-800">
              The left window contains the interactive chapters from the CWRU Weatherhead Training Manual. The right window hosts a fully operational Webview of the live scheduler page. You can follow instructions, apply changes, and test dev builds instantly!
            </p>
          </div>
          <p className="text-xs text-slate-400 font-medium font-serif italic">
            * Weatherhead School of Management, University Technology Services (UTS).
          </p>
        </div>
      )
    },
    {
      id: 2,
      title: 'Sign In and SSO Gateways',
      badge: 'Step 1: LOGIN',
      pdfPage: 1,
      objectiveText: 'Sign in with CWRU SSO in the panel (complete when you reach the scheduler past the login screen).',
      hint: 'If SSO fails in the embed, use the header link to open the live site in a new tab, then return here.',
      isCompleted: (state) => state.completedChapters.includes(2),
      content: (
        <div className="space-y-4">
          <div className="p-3 bg-slate-100 rounded border border-slate-200 flex items-center gap-2 mb-2 font-mono text-[11px] text-[#0a304e]">
            <Key className="w-4 h-4 text-[#0a304e] shrink-0" />
            <span>PORTAL BASE: https://course-scheduler.xlab-cwru.com/</span>
          </div>
          <p className="text-slate-600 italic leading-relaxed text-sm">
            "Go to the portal, and sign in using your credentials."
          </p>
          <p className="leading-relaxed">
            The app utilizes Case Western Reserve University Single Sign-On (SSO) protocols. This auto-verifies coordinator permissions and protects official curriculum schedules from external overrides.
          </p>
          <div className="p-3 bg-amber-50 rounded border border-amber-200 text-xs text-amber-900 font-semibold leading-normal">
            "Your authenticated coordinator session must persist. Be ready to clear Duo Mobile Multi-Factor Authentication protocols on your primary device."
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Introducing Editor View',
      badge: 'Step 2: EDITOR',
      pdfPage: 1,
      objectiveText: 'Open the Editor view and locate the Sections table (auto-detected when visible).',
      isCompleted: (state) => state.completedChapters.includes(3),
      content: (
        <div className="space-y-4">
          <p className="font-semibold text-slate-800 italic">
            "What you will see: You are in the editor view. A view that hosts all our database registry tables. The primary one is the Sections table."
          </p>
          <p>
            The main Editor table lists columns such as Course ID (e.g., ACCT 106), Department, Course Description, Instructors, Enrollment, Capacity Bounds, and Meeting patterns.
          </p>
          <p className="leading-relaxed">
            Coordinators use these rows to check catalog completeness and manually modify room or section allocations. Proceed to explore actions buttons.
          </p>
        </div>
      )
    },
    {
      id: 4,
      title: 'Action Toolbar & Saves',
      badge: 'Step 3: ACTIONS',
      pdfPage: 1,
      objectiveText: 'Find the action toolbar: Update Backend, Import/Export Spreadsheet, and Run Solver.',
      isCompleted: (state) => state.completedChapters.includes(4),
      content: (
        <div className="space-y-4">
          <p className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Critical database controllers:
          </p>
          <div className="space-y-3 text-xs font-semibold text-slate-700">
            <div className="flex gap-2.5 items-start">
              <span className="bg-[#0a304e]/10 text-[#0a304e] font-mono text-[9px] p-1 px-1.5 rounded uppercase font-extrabold tracking-tight">Update Backend</span>
              <p className="leading-normal flex-grow">Sends edits back to databases so server registers manual schedule tweaks.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="bg-[#0a304e]/10 text-[#0a304e] font-mono text-[9px] p-1 px-1.5 rounded uppercase font-extrabold tracking-tight">Import Spreadsheet</span>
              <p className="leading-normal flex-grow">Uploads local Excel schedules into fully populated layout rows.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="bg-[#0a304e]/10 text-[#0a304e] font-mono text-[9px] p-1 px-1.5 rounded uppercase font-extrabold tracking-tight">Export Spreadsheet</span>
              <p className="leading-normal flex-grow">Instantly downloads records list back into customized spreadsheet templates.</p>
            </div>
            <div className="flex gap-2.5 items-start">
              <span className="bg-emerald-100 text-emerald-800 font-mono text-[9px] p-1 px-1.5 rounded uppercase font-extrabold tracking-tight">Run Solver</span>
              <p className="leading-normal flex-grow">Executes automated resolution engine to map sections, and redirects to Calendar.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Related Database Tables',
      badge: 'Step 4: RELATED TABLES',
      pdfPage: 1,
      objectiveText: 'Open the table dropdown and explore Rooms, Timeslots, Constraints, or Meeting Patterns.',
      isCompleted: (state) => state.completedChapters.includes(5),
      content: (
        <div className="space-y-4">
          <p className="italic text-slate-600">
            "You can see that next to the word 'Sections' there is a drop down button, click on it to see other related data tables."
          </p>
          <p className="leading-relaxed text-sm">
            A comprehensive schedules solver requires several input vectors. Under this dropdown, you can access tables defining **Rooms** (capacity bounds), **Timeslots** (standard lecture hours), **Meeting Patterns**, and **Helper Constraints**.
          </p>
          <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-xs font-semibold leading-relaxed text-[#0a304e]">
            Ensuring precise capacity values here prevents overcrowding scenarios across Lewis halls before pushing resolve algorithms.
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Logging Section Notes',
      badge: 'Step 5: AUDIT NOTES',
      pdfPage: 2,
      objectiveText: "Open a section's notes and add a coordinator notice (e.g. needs override).",
      isCompleted: (state) => state.completedChapters.includes(6),
      content: (
        <div className="space-y-4">
          <p className="font-semibold text-slate-800">
            "Notes is the last column in the table, click on view notes."
          </p>
          <p className="leading-relaxed">
            When layout exceptions occur, sharing override requests helps managers align manual updates. For example, if a professor requests specific audiovisual items, coordinators log it directly in the sections notes.
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between font-mono text-[10px] text-slate-500 font-bold">
            <span>Audit trail log: 'this section needs to be moved' - ahmed</span>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: 'Running AI Solver',
      badge: 'Step 6: OPTIMIZATION',
      pdfPage: 1-2,
      objectiveText: "Run Solver and open the calendar view (auto-detected when you're on the calendar).",
      isCompleted: (state) => state.completedChapters.includes(7),
      content: (
        <div className="space-y-4">
          <p className="text-slate-600 italic leading-relaxed text-sm">
            "You will automatically be taken to the calendar page after you run the solver."
          </p>
          <p>
            The automated solver solves constraints, checks capacities against room sizes, and matches overlapping streams in milliseconds.
          </p>
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold rounded text-xs leading-normal">
            Upon successful execution, the interface transforms into an intuitive, side-by-side time matrix calendar grid mapped by day blocks.
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: 'Calendar Maps & Overlap Locks',
      badge: 'Step 7: OVERLAP LOCKS',
      pdfPage: 2,
      objectiveText: 'In calendar mode, try locking sections or locking all manual changes.',
      isCompleted: (state) => state.completedChapters.includes(8),
      content: (
        <div className="space-y-4">
          <p className="font-semibold text-slate-800 italic">
            "Columns are the time, rows are the rooms, you can select any days, currently it is viewing Monday."
          </p>
          <p>
            "Lock all changes locks any change you made to the schedule so that if you decide to run the solver again, your manual edits do not move..."
          </p>
          <div className="p-3 bg-[#0a304e]/5 rounded border border-[#0a304e]/20 flex gap-2 text-xs font-semibold text-slate-700">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Sections of staff requiring fixed placements can be hard-locked. Locked sections remain persistent and untouched through subsequent solve cycles.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 9,
      title: 'Saving Snapshots & Exports',
      badge: 'Step 8: SAVING & DEEP-LINKS',
      pdfPage: 1-2,
      objectiveText: 'Save a schedule to history or export a PDF report.',
      isCompleted: (state) => state.completedChapters.includes(9),
      content: (
        <div className="space-y-4">
          <p>
            "use save schedule to create an entry in the history with your schedule, you can choose whatever name you want."
          </p>
          <p className="leading-relaxed">
            "History shows you all previously saved schedules. Export to pdf creates a pdf copy of your schedule."
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold leading-relaxed space-y-1">
            <p className="text-[#0a304e] uppercase text-[9px] tracking-wider mb-1">Checklist Complete!</p>
            <p>1. Compare diverse layout drafts.</p>
            <p>2. Re-import stable backups safely.</p>
            <p>3. Generate clean reports for Peter B. Lewis department chairs.</p>
          </div>
        </div>
      )
    }
  ];

  const handleChaptersDetected = useCallback(
    (ids: number[]) => {
      setCompletedChapters((prev) => {
        const merged = new Set<number>(prev);
        let added = false;
        for (const id of ids) {
          if (!merged.has(id)) {
            merged.add(id);
            added = true;
            if (!notifiedChaptersRef.current.has(id)) {
              notifiedChaptersRef.current.add(id);
              const chapter = guideChapters.find((c) => c.id === id);
              addNotification(
                chapter
                  ? `Objective complete: ${chapter.title}`
                  : 'Training step detected on the live scheduler.',
                'success'
              );
            }
          }
        }
        if (!added) return prev;
        const sorted = [...merged].sort((a, b) => a - b);
        const highest = Math.max(...ids);
        if (activeChapterIdx < highest - 1 && highest <= guideChapters.length) {
          setTimeout(() => setActiveChapterIdx(highest - 1), 600);
        }
        return sorted;
      });
    },
    [activeChapterIdx]
  );

  const simulatorState = {
    completedChapters
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-[#222] font-sans flex flex-col antialiased">
      
      {/* Notifications Toast Bar */}
      <div className="fixed top-20 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              className={`p-4 rounded shadow-lg flex items-start gap-3 border pointer-events-auto w-[330px] font-sans ${
                n.type === 'success' 
                  ? 'bg-slate-900 border-emerald-900/50 text-white' 
                  : 'bg-slate-900 border-[#0a304e]/50 text-white'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-grow">
                <p className="text-xs font-bold leading-relaxed">{n.text}</p>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono">Live Guide Assistant</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Banner Header */}
      <CWRUHeader 
        viewMode={viewMode} 
        setViewMode={setViewMode} 
        activeChapter={activeChapterIdx + 1}
        goToChapter={setActiveChapterIdx}
      />

      {/* Primary Workstation Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* VIEW 1: MANUAL WORKBOOK (Shown when not in full-screen Ref mode) */}
        {viewMode === 'split' && (
          <div className="w-full lg:w-[32%] xl:w-[28%] shrink-0 border-r border-gray-200 bg-white flex flex-col shadow-sm">
            <GuideContent
              activeChapterIdx={activeChapterIdx}
              setActiveChapterIdx={setActiveChapterIdx}
              simulatorState={simulatorState}
              chapters={guideChapters}
              onToggleComplete={handleToggleComplete}
            />
          </div>
        )}

        {/* VIEW 2: SCHEDULER WEBVIEW PORTAL (Or glossary view if full ref selected) */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#f4f7f9] relative p-1.5 lg:p-4">
          
          {viewMode === 'ref' ? (
            <div className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
              <TableKeysGlossary />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <WebviewBrowser
                initialUrl="https://course-scheduler.xlab-cwru.com/"
                onChaptersDetected={handleChaptersDetected}
              />
            </div>
          )}

        </div>

      </div>

      {/* Footer Credentials Info */}
      <footer className="bg-white border-t border-gray-200 text-gray-500 text-[10px] h-12 flex flex-col sm:flex-row items-center px-8 justify-between shrink-0 select-none font-medium">
        <div>
          <span>© 2026 Case Western Reserve University • University Technology Services • XLAB Weatherhead</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetTraining}
            className="text-slate-500 hover:text-[#0a304e] transition-colors flex items-center gap-1 font-bold font-mono tracking-wide uppercase cursor-pointer"
            title="Reset active chapter and milestone indicators"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Chapter Milestones</span>
          </button>
          
          <span className="text-gray-300">|</span>
          <span>Academic Year 2025-26</span>
        </div>
      </footer>

    </div>
  );
}
