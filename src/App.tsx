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

  // High-fidelity pedagogical training checklist chapters
  const stepsData: TutorialStep[] = [
    {
      id: 1,
      title: 'Establishing SSO Connections',
      badge: 'Step 1: Security Gateway',
      objectiveText: 'Establish a secure authenticated session with the live academic scheduling server.',
      expectedResult: 'You will bypass the local frame blockage to see the main scheduling draft screen.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Case Western Reserve University secures its systems via standard <strong className="text-blue-900">Single Sign-On (SSO)</strong> powered by Okta and Duo Mobile MFA. This ensures only authorized schedulers of the Weatherhead School of Management can edit draft course listings.
          </p>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1.5">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>Click the green <strong>"Launch Live Scheduler ↗"</strong> button on the top right.</li>
              <li>Input your formal <code>case ID</code> institutional user account and password credentials.</li>
              <li>Confirm the verification push notification on your registered physical corporate smart device using the <strong>Duo Mobile</strong> application.</li>
              <li>Once authenticated, the main Sections Table layout will load automatically.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Table Layout & Filtering',
      badge: 'Step 2: Custom Layouts & Filters',
      objectiveText: 'Customize columns visibility, resize column width headers, and utilize selective filters.',
      expectedResult: 'You will adapt your column layout to fit your preferences and successfully filter rows by criteria.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-705 text-sm leading-relaxed">
            The database workspace operates around 5 related tables. To optimize your editing environment, you can now personalize your table views and filter records dynamically.
          </p>
          <div className="space-y-3 bg-blue-50/50 border border-blue-900/10 p-3.5 rounded-lg text-xs text-slate-700 leading-relaxed text-left">
            <strong className="text-[#0a304e] block font-bold">New Table Customizations:</strong>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-700 font-medium">
              <li><strong>Customizable Columns:</strong> Toggle which columns you want to view inline by selecting or deselecting from the column settings menu.</li>
              <li><strong>Interactive Header Resizing:</strong> Hover over the divider edges of column headers and click-and-drag to adjust their widths perfectly.</li>
              <li><strong>Column-Specific Filtering:</strong> Click the <strong>&quot;Filters (#)&quot;</strong> button next to the search bar to filter editor rows by custom columns.</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Locate the <strong>&quot;Filters (0)&quot;</strong> button near the main search input bar.</li>
              <li>Click to select column filters and narrow down key listings on the editor workspace.</li>
              <li>Toggle table heading settings to show or hide optional columns as needed, or drag column borders to fit long course titles.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Excel & CSV Catalog Imports',
      badge: 'Step 3: Spreadsheets Handling',
      objectiveText: 'Import the updated semester draft using the spreadsheet tool.',
      expectedResult: 'You will populate course rows in the table instantly from an uploaded Excel or CSV template.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-705 text-sm leading-relaxed">
            Coordinators don’t have to insert hundred-row lists manually of draft sections. The live site includes an direct spreadsheet parsing interface supporting instant spreadsheet upload.
          </p>
          <div className="bg-blue-50 border border-blue-150 p-4 rounded-lg flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-800 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-950">
              <span className="font-bold block mb-1">Flexible Column Translation</span>
              You don&apos;t need to have these column labels exactly. We have an integrated translator layer that automatically maps your worksheet headers to our system&apos;s columns. Since this translator is continuously updated, there is no strict guideline for sheet headers.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>In the toolbar directly over the main database grid, locate and click the <strong>"Import Spreadsheet"</strong> or <strong>"Upload Excel"</strong> button.</li>
              <li>Toggle selection on your desktop file explorer to pick your <code>.xlsx</code> or <code>.csv</code> configuration outline.</li>
              <li>Verify the automatically parsed courses before continuing to solve overlaps.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Row Editor Modal Override',
      badge: 'Step 4: Row-by-Row Editing',
      objectiveText: 'Explore the Row Editor Modal to perform isolated, complete record modifications.',
      expectedResult: 'A customized, focused modal matches the selected course row to perform clean, clean updates.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Individual course sections often have operational guidelines or special considerations from academic department chairs (e.g. <em>"Requires a hybrid video conference setup"</em>). To allow for cleaner record editing options without visual horizontal tracking eye-strain:
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs/relaxed text-left flex gap-3 text-slate-700 font-medium">
            <Sliders className="w-5 h-5 text-[#0a304e] mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-[#0a304e] block mb-0.5">The Row Editor Modal Interface:</span>
              Provides a complete, row-by-row view of the selected course section. This lets you inspect and modify all constraints, course settings, instructor properties, and custom notes in a highly structured dialog form.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-2 leading-relaxed">
              <li>Find the <strong>"Actions"</strong> column on any Course Section record row of the main editor.</li>
              <li>Click the <strong>middle action button</strong> (representing the detail/row editing action) on that row.</li>
              <li>A beautiful modal pops up containing all of the record's values presented cleanly in vertical fields.</li>
              <li>Conduct draft improvements, update coordinator notes, and apply to submit changes instantly back to the grid.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Executing the UTS Constraint Solver',
      badge: 'Step 5: Core Automations',
      objectiveText: 'Run the UTS solver algorithm to arrange conflict-free rooms & timeslots mapping.',
      expectedResult: 'The scheduler system will map all sections onto the primary calendar layout simultaneously.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            The automated constraint resolution core represents Weatherhead’s central engine. Placing instructors and hundreds of registrants in limited academic halls without overlapping blocks manually is mathematically tedious.
          </p>
          <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-lg space-y-1">
            <span className="font-bold text-xs uppercase text-emerald-800 tracking-wide block">The Intelligent Constraint Solver will:</span>
            <ul className="list-disc pl-4 text-xs space-y-1">
              <li>Confirm physical room caps are strictly greater than section enrollment quotas.</li>
              <li>Eliminate instructor-time overlap blocks.</li>
              <li>Prioritize locked course assignments.</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Locate the vibrant green action button at the top-right reading <strong>"Run Solver"</strong>.</li>
              <li>Click to trigger calculations. The system runs constraint algorithms and moves the application view automatically to the <strong>Monday Room Grid (Calendar Views)</strong>.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'The Monday Room Grid View',
      badge: 'Step 6: Matrix Audit',
      objectiveText: 'Analyze classroom schedules horizontally across the primary weekly room grid.',
      expectedResult: 'You will audit timeslot allocations and identify empty rooms across the day.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            After the Solver has completed its run, sections are displayed inside the visual calendar layout of Peter B. Lewis building rooms. The primary column grid represents academic hours, while the rows list individual classroom units.
          </p>
          <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-600">
            <strong>Visual Clues on the Grid:</strong><br />
            - Scheduled classes appear as color-coded cards representing departments.<br />
            - Empty white cells display timeslot coordinates, allowing you to place unscheduled classes manually.
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>Examine the Monday Room Grid after running the solver.</li>
              <li>To adjust any assignment manually, tap any scheduled class card to highlight open swap panels, or drag cards into free slots.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: 'Pinning Override Locks',
      badge: 'Step 7: Manual Overrides',
      objectiveText: 'Configure locked pins on specialized time block sections.',
      expectedResult: 'Manual assignments are preserved intact when running subsequent solver updates.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-701 text-sm leading-relaxed">
            When you manually place or override a course’s coordinates (for instance, forcing critical executive seminars specifically into PBL-250), you must guarantee that executing the solver a second time does not overwrite your custom decision.
          </p>
          <div className="bg-[#0a304e]/5 p-3.5 border border-[#0a304e]/15 rounded-lg flex gap-3 text-xs text-[#0a304e]">
            <Lock className="w-5 h-5 text-[#0a304e] mt-0.5 shrink-0" />
            <div>
              <span className="font-extrabold block mb-1">"Lock Manual Changes" Feature</span>
              Provides a security forcefield around manual pins. The solver protects and ignores these sections, prioritizing them as static mathematical constraints.
            </div>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>On the week layout, look at the individual course card or locate the action toggle labeled <strong>"Lock All Sections"</strong>.</li>
              <li>Click the lock icon on individual priority classes to anchor them firmly.</li>
              <li>Observe the padlock indicator appear alongside the section code.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: 'Saving Snapshot Backups',
      badge: 'Step 8: Version Archives',
      objectiveText: 'Save current schedule drafts as snapshots to easily restore or test alternative scenarios.',
      expectedResult: 'A historical draft registration is compiled in the Snapshots sidebar tab.',
      content: (
        <div className="space-y-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            Creating high-quality university schedules requires testing multiple configurations (e.g., trying a Tue/Thu-focused draft versus a Mon/Wed-focused layout). Rather than overwriting progress, schedulers utilize snapshots.
          </p>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1 font-medium text-slate-700">
            <span className="text-[#0a304e] font-extrabold uppercase text-[10px] tracking-wide block">How Backups Work:</span>
            <p className="text-[#555]">Each snapshot keeps record timestamps, the exact count of mapped courses, and manual override pin locations, preserving historical milestones flawlessly.</p>
          </div>
          <div>
            <h6 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">Instructions for Live Execution:</h6>
            <ol className="list-decimal pl-4.5 text-xs text-slate-600 space-y-1.5 leading-relaxed">
              <li>On the top menu of the Weekly Grid view, press the button marked <strong>"Save Schedule"</strong>.</li>
              <li>Type in your designation (like <em>"Fall Draft - Track A"</em>) and click Save.</li>
              <li>Restore prior configurations anytime by opening the <strong>"Snapshots"</strong> list in the sidebar panel.</li>
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
                The scheduler application is built around streamlined workflows designed for efficient curricula modeling. Below is a simplified, structured explanation of the central systems. Select a module to review its operational parameters.
              </p>
            </div>

            {/* Catalog Tab System */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Feature Grid Selector */}
              <div className="md:col-span-4 space-y-2 select-none">
                {[
                  { id: 'editor', title: 'Registry Tables Editor', icon: Table, badge: 'Database' },
                  { id: 'import', title: 'Excel Spreadsheets Importer', icon: FileSpreadsheet, badge: 'Data' },
                  { id: 'solver', title: 'UTS Intelligent Constraint Solver', icon: Sliders, badge: 'Automation' },
                  { id: 'calendar', title: 'Monday Time-Room Grid Matrix', icon: Calendar, badge: 'Visualization' },
                  { id: 'locks', title: 'Manual Pins & Override Locks', icon: Lock, badge: 'Control' },
                  { id: 'snapshots', title: 'Schedule Snapshot Logs Archive', icon: Bookmark, badge: 'Backups' },
                ].map((item) => {
                  const Icon = item.icon;
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
                          {item.badge}
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
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Table className="w-5 h-5 text-[#0a304e]" />
                      <span>Course Registry Tables Grid Editor</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Once signed in, coordinators manage schedules through structured tabular indexes. Cells are completely editable like regular spreadsheets, with drop-down cell prompts to handle timeslot values or assigned professors.
                    </p>
                    <ul className="text-xs space-y-2.5 text-slate-700 font-medium list-none pl-0">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Standard Sections Grid:</strong> Displays class listings parsed by department blocks. Set caps and review student registration counts.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Customizable Columns & Resize:</strong> Users can toggle column visibility configurations from the setting switches, as well as interactively drag column header dividers right/left to adjust active view widths.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Row Editor Modal:</strong> Clicking the middle action button under the <em>"Actions"</em> column triggers a focused row-by-row modal layout, ensuring pristine data entry and update efficiency.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0a304e] mt-1.5 shrink-0" />
                        <span><strong>Dynamic Table Filters:</strong> Narrow down large datasets by clicking the new <strong>"Filters (#)"</strong> button next to the search bar to filter editor tables by specific column properties.</span>
                      </li>
                    </ul>
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded border border-slate-200">
                      * Refer to our <strong>Database Glossary</strong> tab to find descriptions indexed for all column headings.
                    </p>
                  </div>
                )}

                {selectedFeatureTab === 'import' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <FileSpreadsheet className="w-5 h-5 text-[#0a304e]" />
                      <span>Syllabus Spreadsheet Upload Engine</span>
                    </h3>
                    <p className="text-slate-612 text-xs sm:text-sm leading-relaxed">
                      Coordinators generally design draft schedules inside Excel formats. The scheduler bypasses the manual typing stage by letting users import <code>.xlsx</code> or <code>.csv</code> grids.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg space-y-1 text-xs text-emerald-950 font-medium font-sans">
                      <span className="font-extrabold uppercase text-[10px] text-emerald-800 tracking-wide block">Flexible Column Mapping Support:</span>
                      Sheets do not need to follow strict column naming guidelines. An intelligent translator layer automatically translates custom worksheet headers to standard columns. Since the translator is continuously updated to handle new variations, you can upload your rosters directly.
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'solver' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sliders className="w-5 h-5 text-[#0a304e]" />
                      <span>UTS Automatic Constraint Solver Engine</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      The automatic algorithm resolves time overlaps, instructor limits, and classroom limits simultaneously. Simply click the green "Run Solver" indicator to trigger automatic calculations.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Limits Validation</span>
                        <p className="text-slate-500">Excludes assigning courses to rooms smaller than their set quotas.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Professor Dups Protection</span>
                        <p className="text-slate-500">Guarantees an instructor is never pinned to distinct classes at the same time.</p>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <span className="font-bold text-slate-900 block mb-0.5">Optimized Alignments</span>
                        <p className="text-slate-500">Maps courses to fit standardized meeting patterns.</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'calendar' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Calendar className="w-5 h-5 text-[#0a304e]" />
                      <span>Wednesday/Monday Room Grid Matrix</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      This calendar organizes scheduled courses visually across room-by-room blocks. Classroom assignments list vertically as rows, and the daily hours list horizontally as columns. This lets coordinators audit empty rooms instantly and edit schedule slots directly.
                    </p>
                    <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 font-semibold font-mono">
                      ● Column Span: Peak lecture times (8:00 AM to 6:00 PM).<br />
                      ● Row Span: Available Peter B. Lewis lecture chambers (e.g. PBL-02, PBL-107, PBL-250, etc.).
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'locks' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Lock className="w-5 h-5 text-[#0a304e]" />
                      <span>Lock Manual Changes (Hard Pins)</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      When a course’s slot has been locked verbally with a board chair, you must make sure further solver calculations won't move that section. Locking manual changes protects specific section coordinates, removing them from solver adjustment pools completely while prioritizing them as hard constraints.
                    </p>
                    <div className="p-4 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg space-y-1 text-xs font-semibold">
                      <span>Pro-Tip:</span> Clicking <strong>"Lock All"</strong> in the main toolbar applies a hard pin across every draft listing currently mapped. Tap individual class padlocks to toggle specific overrides.
                    </div>
                  </div>
                )}

                {selectedFeatureTab === 'snapshots' && (
                  <div className="space-y-4">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Bookmark className="w-5 h-5 text-[#0a304e]" />
                      <span>Draft Versioning Snapshots Log</span>
                    </h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                      Saves intermediate states under custom draft names. Rather than overwriting progress, schedulers create backups to audit alternatives. Tap and save intermediate snapshots before running test solvers.
                    </p>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold leading-relaxed text-slate-700">
                      - Snapshot Archive Name: <code>"Fall 2026 - Initial Import"</code><br />
                      - Snapshot Archive Name: <code>"Fall 2026 - After Mon/Wed Solver"</code>
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
