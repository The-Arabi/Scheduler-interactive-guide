import React, { useState } from 'react';
import { 
  Table, HelpCircle, Lock, Unlock, Check, AlertCircle, FileSpreadsheet, 
  Download, Play, Save, History, FileText, Plus, Trash2, Edit2, 
  Laptop, Server, RefreshCw
} from 'lucide-react';

interface Section {
  id: string;
  courseId: string;
  subject: string;
  description: string;
  instructor: string;
  enrollment: number;
  capacity: number;
  meetingPattern: string;
  notes: string;
  assignedRoom?: string;
  assignedTime?: string;
  locked?: boolean;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  features: string;
}

interface Timeslot {
  id: string;
  name: string;
  time: string;
}

export default function SchedulerSimulator() {
  const [activeTab, setActiveTab] = useState<'sections' | 'rooms' | 'timeslots' | 'constraints' | 'patterns'>('sections');
  const [viewMode, setViewMode] = useState<'editor' | 'calendar' | 'history'>('editor');
  
  // Loaded state
  const [sections, setSections] = useState<Section[]>([
    { id: '1', courseId: 'ACCT 106', subject: 'ACCT', description: 'Intro to Financial Accounting', instructor: 'Dr. Blackwell', enrollment: 45, capacity: 50, meetingPattern: 'MW 10:00 - 11:15', notes: 'Needs PBL 119', assignedRoom: 'PBL 119', assignedTime: '10:00 - 11:15' },
    { id: '2', courseId: 'BAFI 355', subject: 'BAFI', description: 'Corporate Finance', instructor: 'Dr. Rodriguez', enrollment: 38, capacity: 40, meetingPattern: 'TR 11:30 - 12:45', notes: 'Needs override', assignedRoom: 'PBL 220', assignedTime: '11:30 - 12:45' },
    { id: '3', courseId: 'ENTP 301', subject: 'ENTP', description: 'Entrepreneurial Finance', instructor: 'Prof. Vance', enrollment: 24, capacity: 30, meetingPattern: 'MW 13:00 - 14:15', notes: 'needs PBL 224', assignedRoom: 'PBL 224', assignedTime: '13:00 - 14:15' },
    { id: '4', courseId: 'DESN 210', subject: 'DESN', description: 'Design & Innovation Management', instructor: 'Dr. Kalleberg', enrollment: 15, capacity: 20, meetingPattern: 'F 09:00 - 11:30', notes: '', assignedRoom: 'PBL 220', assignedTime: '08:30 - 09:45' },
    { id: '5', courseId: 'OPRE 301', subject: 'OPRE', description: 'Operations Research', instructor: 'Dr. Peterson', enrollment: 40, capacity: 50, meetingPattern: 'TR 08:30 - 09:45', notes: 'ahmed', assignedRoom: 'PBL 119', assignedTime: '08:30 - 09:45' },
    { id: '6', courseId: 'MGMT 490', subject: 'MGMT', description: 'Weatherhead MBA CAPSTONE', instructor: 'Dean Latham', enrollment: 65, capacity: 70, meetingPattern: 'W 18:00 - 21:00', notes: 'Needs high-capacity hall', assignedRoom: 'PBL 308', assignedTime: '18:00 - 21:00' }
  ]);

  const [rooms] = useState<Room[]>([
    { id: 'r1', name: 'PBL 119', capacity: 60, features: 'Smart Podium, Dual-Projectors' },
    { id: 'r2', name: 'PBL 220', capacity: 45, features: 'Whiteboard, Teleconference Rig' },
    { id: 'r3', name: 'PBL 224', capacity: 35, features: 'Lab Stations, Team Layout' },
    { id: 'r4', name: 'PBL 308', capacity: 80, features: 'Lecture Amphitheater, Tiered' }
  ]);

  const [timeslots] = useState<Timeslot[]>([
    { id: 't1', name: 'Morning A', time: '08:30 - 09:45' },
    { id: 't2', name: 'Morning B', time: '10:00 - 11:15' },
    { id: 't3', name: 'Midday A', time: '11:30 - 12:45' },
    { id: 't4', name: 'Afternoon A', time: '13:00 - 14:15' },
    { id: 't5', name: 'Evening A', time: '18:00 - 21:00' }
  ]);

  const [constraints] = useState([
    { id: 'c1', name: 'Instructor Double-Booking', type: 'Hard', status: 'Active', description: 'Faculty members cannot teach multiple sections simultaneously.' },
    { id: 'c2', name: 'Room Capacity Violations', type: 'Hard', status: 'Active', description: 'Expected enrollment must fall strictly below assigned classroom limits.' },
    { id: 'c3', name: 'Consecutive Booking Cap', type: 'Soft', status: 'Active', description: 'Rooms should not schedule more than three back-to-back blocks without gaps.' }
  ]);

  const [patterns] = useState([
    { code: 'MW', label: 'Monday & Wednesday Sequences' },
    { code: 'TR', label: 'Tuesday & Thursday Sequences' },
    { code: 'F', label: 'Friday Block Modules' }
  ]);

  // History state
  const [historyDrafts, setHistoryDrafts] = useState<{ id: string; name: string; timestamp: string; sectionCount: number }[]>([
    { id: 'h1', name: 'Fall 2025 Approved Baseline', timestamp: 'May 10, 2026, 09:30 AM', sectionCount: 6 },
    { id: 'h2', name: 'Spring 2026 Sandbox Beta', timestamp: 'May 15, 2026, 02:44 PM', sectionCount: 6 }
  ]);

  // UI state variables
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newDraftName, setNewDraftName] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [selectedDay, setSelectedDay] = useState<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'>('Monday');

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Notes edit trigger
  const handleOpenNotes = (section: Section) => {
    setEditingSection(section);
    setNotesText(section.notes);
    setIsNotesModalOpen(true);
  };

  const handleSaveNotes = () => {
    if (!editingSection) return;
    setSections(prev => prev.map(s => s.id === editingSection.id ? { ...s, notes: notesText } : s));
    showToast(`Saved note for ${editingSection.courseId}: "${notesText}"`, 'success');
    setIsNotesModalOpen(false);
    setEditingSection(null);
  };

  // Section Lock
  const toggleLockSection = (id: string) => {
    setSections(prev => prev.map(s => {
      if (s.id === id) {
        const nextLock = !s.locked;
        showToast(`${s.courseId} is now ${nextLock ? 'Locked (safe-kept)' : 'Unlocked'}`, 'info');
        return { ...s, locked: nextLock };
      }
      return s;
    }));
  };

  // Lock All Layout
  const lockAllSchedules = () => {
    setSections(prev => prev.map(s => ({ ...s, locked: true })));
    showToast('All interactive section layouts have been locked!', 'success');
  };

  // Database update simulation
  const handleUpdateBackend = () => {
    showToast('Syncing workspace with Registrar DB...', 'info');
    setTimeout(() => {
      showToast('CWRU registrar state database is fully synchronized.', 'success');
    }, 1200);
  };

  // Import mock Excel file
  const handleImportSpreadsheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      showToast(`Parsing CWRU Template "${file.name}"...`, 'info');
      
      setTimeout(() => {
        const importedRow: Section = {
          id: String(sections.length + 1),
          courseId: 'BAFI 410',
          subject: 'BAFI',
          description: 'Investment & Valuation Management',
          instructor: 'Dr. Riad',
          enrollment: 32,
          capacity: 40,
          meetingPattern: 'MW 11:30 - 12:45',
          notes: 'wants PBL 119',
          assignedRoom: 'PBL 119',
          assignedTime: '11:30 - 12:45'
        };
        setSections(prev => [...prev, importedRow]);
        showToast(`Spreadsheet imported. Loaded: BAFI 410 (Dr. Riad)`, 'success');
      }, 1500);
    }
  };

  // Trigger manual load (fallback if upload button is missed)
  const loadPreSetSpreadsheet = () => {
    showToast('Loading pre-formatted CWRU curriculum spreadsheet...', 'info');
    setTimeout(() => {
      const exists = sections.some(s => s.courseId === 'BAFI 410');
      if (exists) {
        showToast('Spreadsheet courses are already fully imported.', 'info');
        return;
      }
      const importedRow: Section = {
        id: String(sections.length + 1),
        courseId: 'BAFI 410',
        subject: 'BAFI',
        description: 'Investment & Valuation Management',
        instructor: 'Dr. Riad',
        enrollment: 32,
        capacity: 40,
        meetingPattern: 'MW 11:30 - 12:45',
        notes: 'wants PBL 119',
        assignedRoom: 'PBL 119',
        assignedTime: '11:30 - 12:45'
      };
      setSections(prev => [...prev, importedRow]);
      showToast('Spreadsheet loaded successfully! Added: BAFI 410', 'success');
    }, 1000);
  };

  // Export current schedule rows to CSV
  const handleExportSpreadsheet = () => {
    showToast('Generating Case CSV workbook layout...', 'info');
    setTimeout(() => {
      const headers = 'CourseID,Subject,Description,Instructor,Enrollment,Capacity,MeetingPattern,Notes,Room,Time\n';
      const rows = sections.map(s => 
        `"${s.courseId}","${s.subject}","${s.description}","${s.instructor}",${s.enrollment},${s.capacity},"${s.meetingPattern}","${s.notes}","${s.assignedRoom || ''}","${s.assignedTime || ''}"`
      ).join('\n');
      
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'weatherhead_scheduler_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Curriculum spreadsheet downloaded successfuly.', 'success');
    }, 800);
  };

  // Run Constraint Solver Algorithm
  const handleRunSolver = () => {
    setIsSolving(true);
    showToast('Executing UTS Constraint Optimization Engines...', 'info');
    
    setTimeout(() => {
      // Simulate mapping and resolving optimal assignments, keeping locked ones
      setSections(prev => prev.map(s => {
        if (s.locked) return s; // Unmoved
        
        // Ensure they have intelligent rooms assigned
        if (s.courseId === 'ACCT 106') {
          return { ...s, assignedRoom: 'PBL 119', assignedTime: '10:00 - 11:15' };
        } else if (s.courseId === 'BAFI 355') {
          return { ...s, assignedRoom: 'PBL 220', assignedTime: '11:30 - 12:45' };
        } else if (s.courseId === 'ENTP 301') {
          return { ...s, assignedRoom: 'PBL 224', assignedTime: '13:00 - 14:15' };
        } else if (s.courseId === 'BAFI 410') {
          return { ...s, assignedRoom: 'PBL 119', assignedTime: '11:30 - 12:45' };
        }
        return s;
      }));
      
      setIsSolving(false);
      setViewMode('calendar');
      showToast('Conflicts resolved! Rerouting to Monday Room Matrix view...', 'success');
    }, 2200);
  };

  // Add a brand new section row manually
  const handleAddSection = () => {
    const id = String(sections.length + 1);
    const newSec: Section = {
      id,
      courseId: 'MGMT 301',
      subject: 'MGMT',
      description: 'Intro to Management',
      instructor: 'Staff',
      enrollment: 25,
      capacity: 35,
      meetingPattern: 'MW 08:30 - 09:45',
      notes: '',
      assignedRoom: 'PBL 224',
      assignedTime: '08:30 - 09:45'
    };
    setSections(prev => [...prev, newSec]);
    showToast('Added manual draft section entry (MGMT 301)', 'success');
  };

  // Save Current Snapshot
  const triggerSaveModal = () => {
    setNewDraftName(`Weatherhead Schedule Setup Draft ${historyDrafts.length + 1}`);
    setIsSaveModalOpen(true);
  };

  const confirmSaveDraft = () => {
    if (!newDraftName.trim()) return;
    const newDraft = {
      id: `h${historyDrafts.length + 1}`,
      name: newDraftName,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      sectionCount: sections.length
    };
    setHistoryDrafts(prev => [newDraft, ...prev]);
    setIsSaveModalOpen(false);
    showToast(`Snapshot "${newDraftName}" preserved in history ledger.`, 'success');
  };

  // Load Saved Version
  const restoreSavedDraft = (draftName: string) => {
    showToast(`Restoring "${draftName}"...`, 'info');
    setTimeout(() => {
      showToast(`Active workplace state reset to "${draftName}" values.`, 'success');
    }, 1000);
  };

  // Download PDF Report
  const handleExportPDF = () => {
    showToast('Formatting PDF registrar summary report...', 'info');
    setTimeout(() => {
      window.print();
    }, 800);
  };

  return (
    <div className="flex-1 bg-white flex flex-col h-full font-sans antialiased text-slate-800">
      
      {/* Toast Alert Indicator */}
      {toast && (
        <div id="sim-toast" className={`fixed bottom-16 right-10 z-50 px-4 py-3 rounded shadow-md border flex items-center gap-2 transform transition-all duration-300 animate-slide-in text-xs font-semibold ${
          toast.type === 'success' 
            ? 'bg-emerald-950 text-white border-emerald-800' 
            : toast.type === 'error'
              ? 'bg-rose-950 text-white border-rose-800'
              : 'bg-slate-955 text-white border-slate-700'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Solver Running Loader Overlay */}
      {isSolving && (
        <div className="absolute inset-0 bg-[#0a304e]/90 z-50 flex flex-col items-center justify-center p-8 text-center text-white select-none">
          <div className="relative mb-6">
            <RefreshCw className="w-12 h-12 text-emerald-400 animate-spin" />
            <Server className="w-5 h-5 text-white absolute inset-0 m-auto" />
          </div>
          <h4 className="font-extrabold tracking-widest text-sm uppercase text-slate-100">CWRU UTS Solver Executing</h4>
          <p className="text-xs text-blue-200 max-w-sm mt-2 leading-relaxed">
            Running depth-first recursive constraint matching. Validating course sections, faculty time slots, room seat capacities, and scheduling patterns...
          </p>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6">
            <div className="bg-emerald-400 h-full animate-progress" style={{ width: '40%' }}></div>
          </div>
        </div>
      )}

      {/* Primary Simulator Toolbar */}
      <div className="bg-[#f0f4f8] px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        
        {/* Toggle Mode selectors */}
        <div className="flex bg-slate-200/80 p-0.5 rounded border border-slate-300">
          <button 
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'editor' 
                ? 'bg-white text-[#0a304e] shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Database Tables</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'calendar' 
                ? 'bg-white text-[#0a304e] shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Monday Room Grid</span>
          </button>

          <button 
            type="button"
            onClick={() => setViewMode('history')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'history' 
                ? 'bg-white text-[#0a304e] shadow-3xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Snapshots ({historyDrafts.length})</span>
          </button>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'editor' && (
            <>
              <button
                type="button"
                onClick={handleUpdateBackend}
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1"
                title="Save current work changes to the registrar records database"
              >
                <span>Update Backend</span>
              </button>

              <button
                type="button"
                onClick={loadPreSetSpreadsheet}
                className="px-3 py-1.5 bg-[#0a304e] text-white rounded text-xs font-bold hover:bg-[#07243b] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Import Spreadsheet</span>
              </button>

              <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer rounded text-slate-700 text-xs font-bold transition-colors flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Excel</span>
                <input 
                  type="file" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleImportSpreadsheet} 
                  className="hidden" 
                />
              </label>
            </>
          )}

          {viewMode === 'calendar' && (
            <>
              <button
                type="button"
                onClick={lockAllSchedules}
                className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-bold hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                title="Lock all courses to preserve manual calendar updates sync"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock All Sections</span>
              </button>

              <button
                type="button"
                onClick={triggerSaveModal}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Schedule</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleExportSpreadsheet}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Export CSV</span>
          </button>

          {viewMode !== 'history' && (
            <button
              type="button"
              onClick={handleRunSolver}
              className="px-3.5 py-1.5 bg-[#4c8435] text-white hover:bg-[#3d6b2b] rounded text-xs font-extrabold uppercase tracking-wide transition-colors flex items-center gap-1.5 animate-pulse"
            >
              <Play className="w-3 h-3 fill-current text-white" />
              <span>Run Solver</span>
            </button>
          )}
        </div>

      </div>

      {/* Simulator Core Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">

        {/* 1. EDITOR DATABASE TABLES MODE */}
        {viewMode === 'editor' && (
          <div className="space-y-4 max-w-full">
            
            {/* Table Selection Headers */}
            <div className="flex items-center gap-1.5 border-b border-slate-200">
              {(['sections', 'rooms', 'timeslots', 'constraints', 'patterns'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-xs font-extrabold tracking-wider uppercase border-b-2 -mb-[2px] transition-all ${
                    activeTab === tab 
                      ? 'border-[#0a304e] text-[#0a304e]' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* SECTIONS GRID */}
            {activeTab === 'sections' && (
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h5 className="text-[11px] font-black uppercase tracking-widest text-[#0a304e]">Active Curriculum Sections ({sections.length})</h5>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddSection}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0a304e] text-[10px] font-bold border rounded uppercase transition-colors"
                  >
                    + Add New Entry
                  </button>
                </div>

                <div className="overflow-x-auto select-text">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-700">
                    <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase text-[#0a304e] tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Course ID</th>
                        <th className="px-4 py-3">Subject</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Instructors</th>
                        <th className="px-4 py-3 text-center">Enrollment</th>
                        <th className="px-4 py-3 text-center">Capacity</th>
                        <th className="px-4 py-3">Meeting Pattern</th>
                        <th className="px-4 py-3">Notes</th>
                        <th className="px-4 py-2 text-center">Lock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sections.map(section => (
                        <tr key={section.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">{section.courseId}</td>
                          <td className="px-4 py-3 font-semibold text-slate-500">{section.subject}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{section.description}</td>
                          <td className="px-4 py-3 font-semibold text-slate-600">{section.instructor}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-blue-900">{section.enrollment}</td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">{section.capacity}</td>
                          <td className="px-4 py-3 font-medium text-slate-600">{section.meetingPattern}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(section)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all transition-colors cursor-pointer border ${
                                section.notes 
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100' 
                                  : 'bg-white border-slate-250 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {section.notes ? `View: "${section.notes.slice(0, 15)}..."` : 'Add Notes'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleLockSection(section.id)}
                              className={`p-1.5 rounded transition-all cursor-pointer ${
                                section.locked 
                                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {section.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ROOMS TABLE */}
            {activeTab === 'rooms' && (
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-[#0a304e]">
                  Peter B. Lewis Hall Allocations ({rooms.length} Active Classroom Halls)
                </div>
                <div className="overflow-x-auto text-xs text-slate-700">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Hall Name</th>
                        <th className="px-4 py-3 text-center">Seat Capacity Bounds</th>
                        <th className="px-4 py-3 text-left">Features / Hardware Set</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {rooms.map(room => (
                        <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900 font-mono">{room.name}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-[#0a304e]">{room.capacity} seats max</td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">{room.features}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TIMESLOTS TABLE */}
            {activeTab === 'timeslots' && (
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-[#0a304e]">
                  Standard CWRU Registrar Block Timeslots ({timeslots.length})
                </div>
                <div className="overflow-x-auto text-xs text-slate-700">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Period Name</th>
                        <th className="px-4 py-3 text-left">Official Sequence Range</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold font-mono">
                      {timeslots.map(slot => (
                        <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-500">{slot.name}</td>
                          <td className="px-4 py-3 text-slate-900">{slot.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONSTRAINTS TABLE */}
            {activeTab === 'constraints' && (
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-[#0a304e]">
                  Optimization Engine Constraint Weights
                </div>
                <div className="overflow-x-auto text-xs text-slate-700">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Weight Name</th>
                        <th className="px-4 py-3 text-center">Class Limit</th>
                        <th className="px-4 py-3 text-center">Audit Status</th>
                        <th className="px-4 py-3 text-left">Rule Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {constraints.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-[3px] text-[10px] font-black uppercase text-white ${
                              item.type === 'Hard' ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                              {item.type} Rule
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PATTERNS TABLE */}
            {activeTab === 'patterns' && (
              <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-[#0a304e]">
                  Meeting Patterns Rules
                </div>
                <div className="overflow-x-auto text-xs text-slate-700">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-[#f0f4f8] text-[10px] font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-left">Pattern Code</th>
                        <th className="px-4 py-3 text-left">Registrar Pattern Designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {patterns.map(p => (
                        <tr key={p.code} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-[#0a304e] font-mono">{p.code}</td>
                          <td className="px-4 py-3 text-slate-500 font-semibold">{p.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 2. CALENDAR matrix view MODE */}
        {viewMode === 'calendar' && (
          <div className="space-y-4">
            
            {/* Calendar header day selector */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-250 pb-2 gap-3">
              <div className="flex items-center gap-1.5 font-sans">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDay(day);
                      showToast(`Switched calendar matrix to ${day}`, 'info');
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                      selectedDay === day 
                        ? 'bg-[#0a304e] text-white shadow-3xs' 
                        : 'text-slate-500 bg-slate-200/50 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              <div className="text-xs text-slate-500 font-bold uppercase tracking-wide bg-amber-50 p-2 rounded border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Rows: Classroom Halls | Columns: Designated lecture hours</span>
              </div>
            </div>

            {/* Grid layout matrix */}
            <div className="bg-white border border-slate-250 rounded shadow-xs overflow-x-auto">
              <div className="min-w-[800px]">
                
                {/* Headers */}
                <div className="grid grid-cols-5 bg-[#f0f4f8] text-[9.5px] font-black uppercase text-[#0a304e] tracking-wider border-b border-slate-250 text-center">
                  <div className="px-4 py-3 text-left border-r border-slate-200 bg-slate-100 font-bold shrink-0">Classroom</div>
                  {timeslots.map(slot => (
                    <div key={slot.id} className="px-4 py-3 border-r last:border-0 border-slate-200 flex flex-col items-center justify-center">
                      <span className="font-sans font-black">{slot.name}</span>
                      <span className="font-mono text-[8.5px] text-slate-500 mt-0.5 font-bold">{slot.time}</span>
                    </div>
                  ))}
                </div>

                {/* Rows data matrix */}
                <div className="divide-y divide-slate-250">
                  {rooms.map(room => (
                    <div key={room.id} className="grid grid-cols-5 min-h-[95px] hover:bg-slate-50/50 transition-colors">
                      
                      {/* Room Label Side header */}
                      <div className="px-4 py-3 flex flex-col justify-center border-r border-slate-200 bg-slate-50 select-none shrink-0 text-left">
                        <span className="font-bold text-[#0a304e] text-xs font-mono">{room.name}</span>
                        <span className="text-[9.5px] font-bold text-slate-400 mt-0.5">{room.capacity} seats max</span>
                      </div>

                      {/* Matching mapped Course components slots */}
                      {timeslots.map(slot => {
                        // Find section assigned to this room and time
                        const section = sections.find(s => {
                          const sameRoom = s.assignedRoom === room.name;
                          // Standard slots simplistic mapping matching timeslot prefix/pattern
                          const sameTime = s.assignedTime && (
                            slot.time.includes(s.assignedTime) || 
                            s.assignedTime.includes(slot.time.substring(0,5))
                          );
                          // For Wednesday CAPSTONE evening block
                          const matchesTime = s.meetingPattern && (
                            (dayMatchesPattern(selectedDay, s.meetingPattern) && sameRoom && (s.assignedRoom === room.name))
                          );
                          return matchesTime && sameRoom;
                        });

                        return (
                          <div key={slot.id} className="p-2 border-r last:border-0 border-slate-200 flex items-stretch justify-stretch min-h-[90px]">
                            {section ? (
                              <div className={`flex-1 rounded p-2 flex flex-col justify-between border transition-all text-left relative ${
                                section.locked 
                                  ? 'bg-[#0a304e]/5 border-[#0a304e]/20 text-[#0a304e]' 
                                  : 'bg-emerald-50 border-emerald-250 text-emerald-950 shadow-2xs hover:shadow-xs hover:border-emerald-350'
                              }`}>
                                
                                {/* Lock trigger top label */}
                                <div className="flex items-start justify-between gap-1.5">
                                  <div>
                                    <span className="font-mono font-black text-[11px] uppercase tracking-tight block">{section.courseId}</span>
                                    <span className="text-[9px] font-bold text-slate-500 leading-none mt-0.5 block">{section.instructor}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => toggleLockSection(section.id)}
                                    className={`p-1 rounded cursor-pointer transition-colors ${
                                      section.locked 
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                                        : 'bg-emerald-100/80 text-emerald-600 hover:bg-emerald-200'
                                    }`}
                                    title={section.locked ? 'Unlock from Solver engine actions' : 'Lock to safe-keep placement manual overrides'}
                                  >
                                    {section.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                  </button>
                                </div>

                                {/* capacity tracker bounds safety badge */}
                                <div className="mt-2 flex items-center justify-between text-[8px] font-bold uppercase tracking-wider border-t border-slate-200/50 pt-1">
                                  <span className="text-slate-500 font-mono">Assigned</span>
                                  <span className={`font-mono px-1 rounded ${
                                    section.enrollment > room.capacity ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {section.enrollment} / {room.capacity}
                                  </span>
                                </div>
                                
                                {section.notes && (
                                  <div className="text-[8px] bg-amber-500/10 text-amber-900 border border-amber-200/50 font-bold tracking-tight py-0.2 px-1 rounded uppercase mt-1 truncate">
                                    Note: {section.notes}
                                  </div>
                                )}

                              </div>
                            ) : (
                              <div className="flex-1 rounded border border-dashed border-slate-200 flex items-center justify-center select-none text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50/20">
                                Empty Slot
                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}

        {/* 3. HISTORIC SAVED SNAPSHOTS */}
        {viewMode === 'history' && (
          <div className="space-y-4 max-w-2xl mx-auto py-4">
            <div className="bg-white border border-slate-200 rounded shadow-sm p-4 text-center">
              <History className="w-10 h-10 text-[#0a304e] mx-auto mb-3" />
              <h4 className="font-extrabold text-sm uppercase text-[#0a304e] tracking-widest mb-1">State Snapshots Ledger</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-normal">
                Review and restore from complete weatherhead curriculum configurations. Backups safe-keep changes during audits and training exercises.
              </p>
            </div>

            <div className="space-y-2.5">
              {historyDrafts.map(draft => (
                <div key={draft.id} className="bg-white p-4 border border-slate-200 rounded shadow-2xs hover:border-[#0a304e]/20 transition-all flex items-center justify-between text-left">
                  <div className="space-y-1 text-left">
                    <p className="font-extrabold text-slate-800 text-sm">{draft.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold font-mono">
                      <span>SAVED: {draft.timestamp}</span>
                      <span>•</span>
                      <span>SECTIONS COUNT: {draft.sectionCount}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => restoreSavedDraft(draft.name)}
                    className="px-3 py-1.5 bg-[#0a304e] text-white hover:bg-[#07243b] text-xs font-bold rounded shadow-3xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Restore Baseline</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* NOTES CONTEXT POPUP MODAL */}
      {isNotesModalOpen && (
        <div id="notes-modal" className="fixed inset-0 bg-[#000000]/65 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-md w-full overflow-hidden text-slate-800">
            <div className="bg-[#0a304e] text-white px-5 py-4 flex items-center justify-between">
              <h5 className="font-black uppercase tracking-wider text-xs flex items-center gap-1.5 font-sans">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Verify Section Notes: {editingSection?.courseId}</span>
              </h5>
              <button 
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="text-white hover:text-red-300 text-xs font-bold cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-normal font-sans font-medium">
                Log curriculum exceptions, instructor room requests, or administrative overrides. Notes are parsed by the optimization solver rule checkers during execution runs.
              </p>
              
              <div className="space-y-1 font-sans text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Exception Note Text:</label>
                <textarea 
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="e.g. needs PBL 119, or needs override"
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs outline-none focus:border-[#0a304e] font-serif font-medium leading-relaxed"
                />
              </div>

              {/* Quick suggestion tags */}
              <div className="space-y-1.5 text-left">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Manual Quick Tags Suggestions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(['needs override', 'ahmed', 'needs PBL 119', 'needs PBL 224', 'high capacity room', ''].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNotesText(tag)}
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded border transition-colors ${
                        notesText === tag 
                          ? 'bg-amber-100 border-amber-300 text-amber-900 font-extrabold' 
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag === '' ? 'Clear Notes' : `"${tag}"`}
                    </button>
                  )))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button 
                type="button"
                onClick={() => setIsNotesModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-300 rounded text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveNotes}
                className="px-4 py-1.5 bg-[#4c8435] hover:bg-[#3d6b2b] text-white text-xs font-bold rounded shadow-3xs transition-colors"
              >
                Save Exceptions Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE DRAFT POPUP MODAL */}
      {isSaveModalOpen && (
        <div id="save-modal" className="fixed inset-0 bg-[#000000]/65 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-sm w-full overflow-hidden text-slate-800">
            <div className="bg-[#0a304e] text-white px-5 py-4">
              <h5 className="font-black uppercase tracking-wider text-xs flex items-center gap-1.5 font-sans">
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Save Registry Snapshot</span>
              </h5>
            </div>
            <div className="p-5 space-y-4 font-sans text-left">
              <p className="text-xs text-slate-500 leading-normal font-medium">
                Saves current section lock configurations, override notes, and database records in a persistent draft history ledger slot.
              </p>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Draft Baseline Title:</label>
                <input 
                  type="text"
                  value={newDraftName}
                  onChange={(e) => setNewDraftName(e.target.value)}
                  placeholder="e.g. Weatherhead Draft A"
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-bold outline-none focus:border-[#0a304e]"
                />
              </div>
            </div>
            
            <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-1.5 border border-slate-300 rounded text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmSaveDraft}
                className="px-4 py-1.5 bg-[#0a304e] text-white text-xs font-bold rounded shadow-3xs hover:bg-[#07243b] transition-colors"
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple helper to match Selected Day to standard MW / TR / F meeting patterns
function dayMatchesPattern(selectedDay: string, pattern: string): boolean {
  if (selectedDay === 'Monday' && pattern.includes('M')) return true;
  if (selectedDay === 'Wednesday' && pattern.includes('W')) return true;
  if (selectedDay === 'Tuesday' && pattern.includes('T')) return true;
  if (selectedDay === 'Thursday' && pattern.includes('R')) return true;
  if (selectedDay === 'Friday' && pattern.includes('F')) return true;
  return false;
}
