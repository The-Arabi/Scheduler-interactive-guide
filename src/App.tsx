/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Key, Lock, Sparkles, RefreshCw, BookOpen, ExternalLink, 
  HelpCircle, ChevronRight, ChevronLeft, Map, Table, Settings, FileSpreadsheet, 
  Sliders, Calendar, Bookmark, FileText, AlertCircle, ListTodo, Search
} from 'lucide-react';

import CWRUHeader from './components/CWRUHeader';
import TableKeysGlossary from './components/TableKeysGlossary';

// Types inside App
interface TutorialStep {
  id: number;
  title: string;
  badge: string;
  objectiveText: string;
  expectedResult: string;
  content: React.ReactNode;
}

export default function App() {
  // Mode Selection: 'guide' (Training List), 'features' (App Catalog), 'glossary' (Database Dictionary)
  const [viewMode, setViewMode] = useState<'guide' | 'features' | 'glossary'>('guide');
  
  // Track active tutorial step in the guide view
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // Completed steps tracker (persisted in localStorage for convenience)
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('cwru_guide_completed_steps');
      return saved ? JSON.parse(saved) : [1]; // Start with Step 1 read
    } catch {
      return [1];
    }
  });

  // Track active card detail in the Features Catalog
  const [selectedFeatureTab, setSelectedFeatureTab] = useState<string>('editor');

  // Success alert messaging logs
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist completed steps
  useEffect(() => {
    localStorage.setItem('cwru_guide_completed_steps', JSON.stringify(completedSteps));
  }, [completedSteps]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggleStepComplete = (id: number) => {
    setCompletedSteps((prev) => {
      if (prev.includes(id)) {
        showToast(`Step ${id} milestone unchecked.`);
        return prev.filter((s) => s !== id);
      } else {
        showToast(`Step ${id} completed! Training module synced.`);
        return [...prev, id];
      }
    });
  };

  const handleResetProgress = () => {
    setCompletedSteps([1]);
    setActiveStepIdx(0);
    showToast('All training progress markers have been reset.');
  };

  // Simplified help guides for coordinators and schedulers
  const stepsData: TutorialStep[] = [
    {
      id: 1,
      title: 'Logging In (Single Sign-On)',
      badge: 'Step 1: Access & Security',
      objectiveText: 'Log into the scheduling system with your credentials.',
      expectedResult: 'You will enter the main draft scheduler dashboard.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Welcome! You can log in using your standard Case Western Reserve University account (powered by Okta and Duo Mobile verification). This protects your schedule drafts and ensures they are safely accessible only to authorized coordinators.
          </p>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">Easy Steps to Get Started:</h6>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>Click the green <strong>"Launch Live Scheduler ↗"</strong> button on the top right.</li>
              <li>Type in your standard university <code>case ID</code> and password.</li>
              <li>Approve the login request sent to your phone via the <strong>Duo Mobile</strong> app.</li>
              <li>Once approved, the system will automatically open your main draft tables.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Table Layout & Filtering',
      badge: 'Step 2: Column Layouts & Filters',
      objectiveText: 'Choose which details to show, resize column widths, and filter courses by matching categories.',
      expectedResult: 'You will customize the workspace to your preference and only view courses matching your selected filters.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-705 text-sm leading-relaxed">
            To make viewing easier, you can hide columns you don't need, resize columns to fit long class titles, and filter courses by specific details.
          </p>
          <div className="space-y-3 bg-blue-50/50 border border-blue-900/10 p-3.5 rounded-lg text-xs text-slate-700 leading-relaxed text-left">
            <strong className="text-[#0a304e] block font-bold">New Table Settings:</strong>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-700 font-medium">
              <li><strong>Custom Columns:</strong> Choose which columns (such as instructor name or classroom capacity) you want to see on your screen by toggling settings.</li>
              <li><strong>Resize Headers:</strong> Point your cursor at the lines between column headers and drag them left or right to make columns wider or narrower.</li>
              <li><strong>Filters:</strong> Click the <strong>&quot;Filters (#)&quot;</strong> button near the search bar to show only certain classes, like online-only or a specific department.</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Customize:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Find the new <strong>&quot;Filters (0)&quot;</strong> button next to the search box on the page.</li>
              <li>Click it to check or uncheck options, instantly focus on the classes you want to work on.</li>
              <li>Drag any column divider edge if a lecture name looks slightly squeezed.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Uploading Spreadsheet Files',
      badge: 'Step 3: Spreadsheet Uploads',
      objectiveText: 'Load your semester draft schedule using an Excel or CSV file.',
      expectedResult: 'All your courses will quickly load and display in your schedule table in one go.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-705 text-sm leading-relaxed">
            There is no need to type in hundreds of classes manually. You can simply upload your existing department spreadsheet to fill the scheduling table instantly.
          </p>
          <div className="bg-blue-50 border border-blue-150 p-4 rounded-lg flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-800 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-950">
              <span className="font-bold block mb-1">Flexible Spreadsheet Columns</span>
              We have integrated a smart column mapping system. Your spreadsheet columns do not need exact names—the parser automatically translates the key headings (like course code, capacity, and professors) for you.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Import:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Above the class list table, find and click the <strong>"Import Spreadsheet"</strong> or <strong>"Upload Excel"</strong> button.</li>
              <li>Select your saved <code>.xlsx</code> or <code>.csv</code> spreadsheet from your computer's files.</li>
              <li>The system will review the spreadsheet and display all your lines in the table instantly.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Simple Course Edit Form',
      badge: 'Step 4: Editing Row-by-Row',
      objectiveText: 'Open a clean, single-page edit form for any class to modify details smoothly.',
      expectedResult: 'A simplified form pops up showing all information for that class without clutter or horizontal scrolling.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Rather than looking across a very wide table of columns to make changes, our row editor lets you make clean adjustments in one centered pop-up window:
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs/relaxed text-left flex gap-3 text-slate-700 font-medium">
            <Sliders className="w-5 h-5 text-[#0a304e] mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-[#0a304e] block mb-0.5">The Course Edit Window:</span>
              Shows all information for a single class vertically, so you can edit enrollment capacity, professor, day patterns, or notes in one convenient checklist format without losing your place.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Edit:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>Find the class you wish to edit in the list, then look at the <strong>"Actions"</strong> column.</li>
              <li>Click the <strong>middle button</strong> (the detail form icon) on that row.</li>
              <li>A clean form window pops open with all available fields.</li>
              <li>Type in your updates or pick options from dropdown lists, and update the row back on your table instantly.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Running the Automatic Scheduler',
      badge: 'Step 5: Smart Matching',
      objectiveText: 'Run the automatic matching system to arrange conflict-free rooms and timeslots.',
      expectedResult: 'The scheduler engine maps all active classes to open classrooms and suitable hours.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Arranging classes manually can be like solving a giant jigsaw puzzle. Our smart organizer system automatically checks available rooms, class sizes, teacher routines, and time blocks to place everything beautifully in one click.
          </p>
          <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-lg space-y-1">
            <span className="font-bold text-xs uppercase text-emerald-800 tracking-wide block">The Smart Scheduler Automatically:</span>
            <ul className="list-disc pl-4 text-xs space-y-1">
              <li>Confirms a classroom is large enough for your student capacity limits.</li>
              <li>Makes sure no instructor has two classes at the exact same hour.</li>
              <li>Leaves your manually locked classes right where you put them.</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Auto-Schedule:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Find the green button at the top-right reading <strong>"Run Solver"</strong> or <strong>"Run Scheduler"</strong>.</li>
              <li>Click it to start. The system automatically processes the entries and shows you the resulting layout in the **Weekly Classroom Calendar** view.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'The Weekly Classroom Grid',
      badge: 'Step 6: Visual Calendar',
      objectiveText: 'Review and audit classroom timeslots across a visual weekly room map.',
      expectedResult: 'You can check class schedules at a glance and manually fill remaining empty cells.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Once scheduled, your courses are laid out in a clean, visual format of classrooms in the Peter B. Lewis building. Hours are listed horizontally from left to right, while classrooms are listed down the page as rows.
          </p>
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-600">
            <strong>Key Visual Color Codes:</strong><br />
            - Classes are color-coded by department so you can see groupings clearly.<br />
            - Empty white cards represent available hours, where you can place unscheduled classes manually.
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Review:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Look at the grid after running the automatic scheduler.</li>
              <li>If you want to move a class manually, simply click any scheduled class box to open moves or drag boxes into available slots.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: 'Locking Your Manual Changes',
      badge: 'Step 7: Lock-In Placements',
      objectiveText: 'Freeze specific courses in place so they won\'t change when running the scheduler.',
      expectedResult: 'Your selected course is locked, and the automatic scheduler won\'t move it.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-710 text-sm leading-relaxed">
            If you have manually placed a high-priority course (for example, scheduling a seminar specifically in PBL-250), you'll want to lock it in so the scheduler works around your choice instead of moving it next time.
          </p>
          <div className="bg-[#0a304e]/5 p-3.5 border border-[#0a304e]/15 rounded-lg flex gap-3 text-xs text-[#0a304e]">
            <Lock className="w-5 h-5 text-[#0a304e] mt-0.5 shrink-0" />
            <div>
              <span className="font-extrabold block mb-1">"Lock Courses" Feature</span>
              Freezes chosen courses in place. The automatic scheduler respects your selections and finds open slots for the remaining classes without disturbing your locked choices.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Lock:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>On a class card in the weekly layout, or under the main actions toolbar, locate the padlock indicator.</li>
              <li>Click the lock icon on any class to freeze it.</li>
              <li>To lock all current placements at once, click the <strong>"Lock All Sections"</strong> button in the main toolbar.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: 'Saving Draft Snapshots',
      badge: 'Step 8: Save Drafts & Backups',
      objectiveText: 'Save current schedule configurations as snapshots to safely experiment with backups.',
      expectedResult: 'A backup copy of your schedule is stored and easily reachable under the Snapshots tab.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            When designing university courses, you often want to test out a few different ideas (for instance, a Tuesday/Thursday draft versus a Monday/Wednesday draft). Snapshots prevent you from losing your progress.
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-medium text-slate-700">
            <span className="text-[#0a304e] font-extrabold uppercase text-[10px] tracking-wide block">How Backups Work:</span>
            <p className="text-[#555]">Each draft backup saves the date, the exact list of classes, and your custom lock coordinates, so you can test changes and restore older versions whenever you like.</p>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Easy Steps to Save & Restore:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>In the toolbar at the top of your layout, click <strong>"Save Schedule"</strong>.</li>
              <li>Type in an easy-to-remember name (like <em>"Fall Draft - Options A"</em>) and click Save.</li>
              <li>To switch back to any previous version, select it from the <strong>"Snapshots"</strong> panel in the sidebar.</li>
            </ol>
          </div>
        </div>
      )
    }
  ];

  const currentStep = stepsData[activeStepIdx];
  const stepIsCompleted = completedSteps.includes(currentStep.id);
  const totalCompletionPercent = Math.round((completedSteps.length / stepsData.length) * 100);

  return (
    <div className="min-h-screen bg-[#f4f7f9] text-[#222] font-sans flex flex-col antialiased">
      
      {/* Toast Alert Indicator */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-[#0a304e] border border-blue-900 border-l-4 border-l-emerald-400 text-white shadow-xl rounded flex items-center gap-3 animate-bounce select-none">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs font-bold leading-none">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Primary Headers */}
      <CWRUHeader viewMode={viewMode} setViewMode={setViewMode} />

      {/* Main Container View */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-0">
        
        {/* VIEW 1: TRAINING STEP-BY-STEP CHECKLIST */}
        {viewMode === 'guide' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Guide Step Directory Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4 text-[#0a304e]" />
                    <span>Tutorial Curriculum ({totalCompletionPercent}%)</span>
                  </h2>
                  <p className="text-[10px] text-slate-500 font-medium">Click a chapter to load guides.</p>
                </div>
                <button
                  onClick={handleResetProgress}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-700 transition-colors uppercase font-mono tracking-wider flex items-center gap-1"
                  title="Reset completed checkmarks"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Progress visual tracker */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex select-none">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-500" 
                  style={{ width: `${totalCompletionPercent}%` }}
                />
              </div>

              {/* Sidebar chapters directory list */}
              <div className="space-y-1.5 select-none">
                {stepsData.map((step, idx) => {
                  const isChActive = idx === activeStepIdx;
                  const isChDone = completedSteps.includes(step.id);
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStepIdx(idx)}
                      className={`w-full text-left p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        isChActive
                          ? 'bg-[#0a304e] border-[#0a304e] text-white shadow-2xs font-extrabold'
                          : isChDone
                          ? 'bg-emerald-50/50 border-emerald-150 text-slate-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                          isChActive
                            ? 'bg-white text-[#0a304e]'
                            : isChDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {step.id}
                        </div>
                        <span className="truncate">{step.title}</span>
                      </div>
                      
                      {isChDone && (
                        <CheckCircle className={`w-4 h-4 shrink-0 ${isChActive ? 'text-white' : 'text-emerald-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Detail Panel */}
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                
                {/* Step Headline badge header */}
                <div className="bg-[#0a304e]/5 p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-left">
                    <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-[#0a304e] text-white uppercase tracking-wider">
                      {currentStep.badge}
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1 font-sans">
                      {currentStep.title}
                    </h2>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">CH. 0{currentStep.id}</span>
                  </div>
                </div>

                {/* Training block card instructions */}
                <div className="p-6 md:p-8 space-y-6">
                  
                  {/* Step objective highlight */}
                  <div className="p-4 bg-emerald-50/75 border border-emerald-150 rounded-lg text-left flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-widest">
                        Procedural Objective
                      </h4>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5 leading-relaxed">
                        {currentStep.objectiveText}
                      </p>
                    </div>
                  </div>

                  {/* Core rich educational details */}
                  <div className="text-left border-t border-slate-100 pt-5">
                    {currentStep.content}
                  </div>

                  {/* Expected result indicator */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-left font-mono text-[11px] leading-relaxed text-slate-600 block">
                    <span className="font-bold text-slate-850 uppercase tracking-wide block text-[10px] mb-0.5 text-slate-850">
                      Expected Operational Outcome:
                    </span>
                    ● {currentStep.expectedResult}
                  </div>

                </div>

                {/* Bottom Manual checkpoint controls */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => handleToggleStepComplete(currentStep.id)}
                    className={`px-5 py-2 rounded text-xs font-extrabold flex items-center gap-2 border transition-all cursor-pointer w-full sm:w-auto justify-center ${
                      stepIsCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${stepIsCompleted ? 'text-white' : 'text-slate-400'}`} />
                    <span>{stepIsCompleted ? 'Milestone Certified' : 'Mark as Certified'}</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                    <button
                      onClick={() => setActiveStepIdx((p) => Math.max(0, p - 1))}
                      disabled={activeStepIdx === 0}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-xs font-bold rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex items-center gap-1 text-slate-600"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={() => setActiveStepIdx((p) => Math.min(stepsData.length - 1, p + 1))}
                      disabled={activeStepIdx === stepsData.length - 1}
                      className="px-3.5 py-2 bg-white border border-slate-200 text-xs font-bold rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer flex items-center gap-1 text-slate-600"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>


            </div>

          </div>
        )}

        {/* VIEW 2: CORE FEATURE CATALOG VIEW */}
        {viewMode === 'features' && (
          <div className="space-y-6">
            
            {/* Catalog Introduction Banner */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-left shadow-xs space-y-2">
              <span className="px-2 py-0.5 rounded text-[8px] font-extrabold bg-[#0a304e]/10 text-[#0a304e] uppercase tracking-wider select-none">
                Applications Catalog
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Weatherhead Course Scheduler Modules</h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-3xl">
                The scheduler application is divided into straightforward, easy-to-use tools. Below is a simplified guide to our key features. Select any module to see how it makes scheduling stress-free.
              </p>
            </div>

            {/* Catalog Tab System */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Feature Grid Selector */}
              <div className="md:col-span-4 space-y-2 select-none">
                {[
                  { id: 'editor', title: 'Interactive Course Tables', icon: Table, badge: 'View & Edit' },
                  { id: 'import', title: 'Excel Spreadsheet Importer', icon: FileSpreadsheet, badge: 'Uploads' },
                  { id: 'solver', title: 'Automatic Smart Scheduler', icon: Sliders, badge: 'Auto Arrange' },
                  { id: 'calendar', title: 'Weekly Classroom Calendar', icon: Calendar, badge: 'Visual Schedule' },
                  { id: 'locks', title: 'Lock Manual Placements', icon: Lock, badge: 'Freeze Slots' },
                  { id: 'snapshots', title: 'Saved Schedule Drafts', icon: Bookmark, badge: 'Backups' },
                ].map((item) => {
                  const Icon = item.icon;
                  // Handle backup label or custom logic without missing import
                  const labelBadge = item.id === 'snapshots' ? 'Backups & History' : item.badge;
                  const isSelected = selectedFeatureTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFeatureTab(item.id)}
                      className={`w-full text-left p-3.5 rounded-lg border flex items-center gap-3.5 transition-all text-xs font-bold cursor-pointer ${
                        isSelected
                          ? 'bg-[#0a304e] border-[#0a304e] text-white shadow-2xs font-extrabold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md ${isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-[#0a304e]'}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{item.title}</span>
                        <span className={`text-[8px] uppercase tracking-wider block font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                          {labelBadge}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Feature Deep explanation */}
              <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-xs text-left">
                
                {selectedFeatureTab === 'editor' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Table className="w-5 h-5" />
                      <span>Interactive Course Tables</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Once signed in, you can manage class schedules using a clean tabbed table. Just like a regular spreadsheet, you can click directly on details to edit them, and use simple dropdowns to choose timeslots and professors.
                    </p>
                    <ul className="text-xs space-y-2.5 text-slate-700 font-medium list-none pl-0">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Standard Class List:</strong> Displays your classes separated by academic departments. You can set enrollment limits and see student registration numbers easily.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Show, Hide & Resize Columns:</strong> Toggle columns on or off depending on what you want to see, and drag column dividers horizontally to change widths perfectly.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Course Edit Form Window:</strong> Click the edit icon on any row to open a simple pop-up form. This lets you inspect details and make changes without scrolling left-and-right.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Quick Filtering:</strong> Narrow down a long list of courses instantly by clicking the <strong>"Filters (#)"</strong> button and choosing specific criteria.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">
                      * Refer to our <strong>Database Glossary</strong> tab to find descriptions indexed for all column headings.
                    </p>
                  </div>
                )}

                {selectedFeatureTab === 'import' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span>Excel Spreadsheet Importer</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Most department coordinators draft their class schedules in Excel. To save you the time of re-typing everything manually, simply upload your Excel or CSV file to import all your classes directly.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-1 text-xs text-emerald-950 font-medium font-sans">
                      <span className="font-extrabold uppercase text-[10px] text-emerald-800 tracking-wide block">Flexible Spreadsheet Columns:</span>
                      Your spreadsheet columns do not need exact names. Our smart parser automatically translates key headings (like course code, capacity, and professors) for you, making uploads completely hassle-free.
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'solver' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sliders className="w-5 h-5" />
                      <span>Automatic Smart Scheduler</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Our smart scheduler checks and resolves room sizing limits, instructor availability, and class times at the same time. Simply click "Run Scheduler" and let the system arrange a conflict-free plan for you instantly.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Room Capacity Checks</span>
                        <p className="text-slate-500">Prevents placing classes in classrooms that are too small for your registered enrollment targets.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Overlap Protection</span>
                        <p className="text-slate-500">Guarantees that no professor is scheduled to teach two different classes at the exact same hour.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Standard Timeslots</span>
                        <p className="text-slate-500">Saves classes into standard University teaching blocks.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'calendar' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Calendar className="w-5 h-5" />
                      <span>Weekly Classroom Calendar</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      This visual calendar displays scheduled classes laid out by room and hour. Classrooms are listed down the page as rows, and the daily teaching hours are shown left-to-right as columns. This makes empty slots obvious and lets you manually adjust plans with ease.
                    </p>
                    <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 font-semibold font-mono">
                      ● Horizontal Columns: Peak teaching hours (8:00 AM to 6:00 PM).<br />
                      ● Vertical Rows: Specific lecture classrooms in the Peter B. Lewis building (such as PBL-02, PBL-107, PBL-250, etc.).
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'locks' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Lock className="w-5 h-5" />
                      <span>Locking Your Manual Changes</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      If you have manually placed or agreed on a designated slot for an instructor, you can lock it. Lock protection tells the automatic scheduler to leave that classroom and time pattern exactly as you set them, arranging the rest of the schedule around your preferences.
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg space-y-1 text-xs font-semibold">
                      <span>Pro-Tip:</span> Clicking <strong>"Lock All"</strong> in the main toolbar freezes your whole current table draft. You can also click individual padlock icons to toggle lock-ins.
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'snapshots' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-[#0a304e] flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Bookmark className="w-5 h-5" />
                      <span>Saved Schedule Drafts (Snapshots)</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Saves your current schedule state under custom draft names. Instead of losing your work when testing different layouts, you can make backup copies anytime and revert back to an older draft whenever you like.
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold leading-relaxed text-slate-700">
                      - Draft Name: <code>"Fall Draft - Initial Import"</code><br />
                      - Draft Name: <code>"Fall Draft - Tested Monday/Wednesday Plan"</code>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* VIEW 3: FULL WIDTH INDEX GLOSSARY */}
        {viewMode === 'glossary' && (
          <div className="space-y-6">
            <TableKeysGlossary />
          </div>
        )}



      </main>

      {/* Static Footer Credits */}
      <footer className="bg-white border-t border-gray-200 text-gray-500 text-[10px] h-12 flex flex-col sm:flex-row items-center px-8 justify-between shrink-0 select-none font-medium">
        <div>
          <span>© 2026 Case Western Reserve University • University Technology Services • XLAB Weatherhead School of Management</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-gray-300">|</span>
          <span>Academic Year 2025-26</span>
          <span className="text-gray-300">|</span>
          <span>Version 2.4.1</span>
        </div>
      </footer>

    </div>
  );
}
