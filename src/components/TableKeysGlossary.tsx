/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BookOpen, Search, CornerDownRight } from 'lucide-react';

interface TableKeysGlossaryProps {}

export default function TableKeysGlossary({}: TableKeysGlossaryProps) {
  const [activeTab, setActiveTab] = useState<'Sections' | 'Rooms' | 'Timeslots' | 'Patterns' | 'Constraints'>('Sections');
  const [query, setQuery] = useState('');

  const keysData = {
    Sections: {
      desc: 'Hosts all course streams, loads of students, associated instructors, and scheduling requirements.',
      fields: [
        { id: 'ID', def: 'Unique course identifier (e.g., ACCT 106).' },
        { id: 'Department', def: 'Assigned academic department responsible for course delivery.' },
        { id: 'Course', def: 'Plaintext course description and official title.' },
        { id: 'Code', def: 'Internal variable code used for backend database indexing. Safe to ignore during scheduling edits.' },
        { id: 'Instructor', def: 'Course section instructor or list of co-instructors.' },
        { id: 'Enroll', def: 'Number of students currently enrolled in this specific section.' },
        { id: 'Cap', def: 'Set enrollment capacity bounds limit for physical seats allocation.' },
        { id: 'Meeting pattern', def: 'Determined days and times allotment patterns sequence.' },
        { id: 'Room req', def: 'Specific physical requirements requested for the section (e.g., projector, board, dual monitors).' },
        { id: 'Cross-list group', def: 'Group identifier when dual courses represent identical lectures.' },
        { id: 'Tags', def: 'Keywords helpful for grouping, query filtering, and prioritization sorting.' },
        { id: 'View notes', def: 'Action item allowing coordinators to attach customizable human notes and notes feeds.' }
      ]
    },
    Rooms: {
      desc: 'Represents CWRU/Weatherhead physical classrooms catalog, seat structures, and hardware specifications.',
      fields: [
        { id: 'ID / Room Code', def: 'A combination identifying Peter B. Lewis building numbers.' },
        { id: 'Building', def: 'Academic facility name block.' },
        { id: 'Capacity', def: 'Max physical seating capacity. Sections with enrollments exceeding capacity limits can never be assigned here.' },
        { id: 'Features', def: 'Available hardware accessories (e.g., screencast, whiteboard, projectors).' },
        { id: 'Notes', def: 'Scheduler instructions regarding specific ventilation, seating configs, or quiet rooms.' }
      ]
    },
    Timeslots: {
      desc: 'Time blocks where sections are allowed to be scheduled across the calendar layout.',
      fields: [
        { id: 'ID', def: 'Canonical timeslot index code.' },
        { id: 'Days', def: 'Aggregated days of the week (e.g., Mon/Wed, Tue/Thu).' },
        { id: 'Start Time', def: 'Class session start (e.g., 08:25 AM).' },
        { id: 'End Time', def: 'Class session conclusion (e.g., 11:15 AM).' },
        { id: 'Block Type', def: 'Time block categorizations determining hours durations.' },
        { id: 'View notes', def: 'Custom reminders for scheduling coordinates.' }
      ]
    },
    Patterns: {
      desc: 'Canonical combinations of times and days configured together for complex course streams.',
      fields: [
        { id: 'ID', def: 'Pre-configured meeting pattern identifier.' },
        { id: 'Slots', def: 'Set of multi-day component blocks mapped for solving.' },
        { id: 'Days', def: 'Set days combination.' },
        { id: 'View notes', def: 'Field instructions' }
      ]
    },
    Constraints: {
      desc: 'The mathematical rulesets utilized by the Run Solver engine to prevent scheduling conflicts.',
      fields: [
        { id: 'Crosslist group', def: 'Ensures cross-listed sections overlap perfectly in time and shares the same room.' },
        { id: 'No overlap groups', def: 'A negative limit ensuring classes are never timed simultaneously.' },
        { id: 'Blocked times', def: 'Designated unavailability periods where classrooms can never be booked.' },
        { id: 'Locked assignments', def: 'Absolute hard pins forcing specific sections to stay in their times/rooms.' },
        { id: 'Soft locks', def: 'Non-blocking weighted optimization recommendations aligned with faculty preferences.' }
      ]
    }
  };

  const filteredFields = keysData[activeTab].fields.filter(
    f => f.id.toLowerCase().includes(query.toLowerCase()) || f.def.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
        <div className="text-left">
          <h4 className="font-extrabold text-slate-900 uppercase tracking-widest text-xs flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#0A3056]" />
            <span>CWRU Scheduler Table Keys Glossary Reference</span>
          </h4>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Lookup explanations and rules definition for each database fields.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search glossary fields..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:border-[#0A3056]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 select-none">
        {(Object.keys(keysData) as Array<keyof typeof keysData>).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setQuery('');
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-[#0A3056] border-[#0A3056] text-white'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab} Table
          </button>
        ))}
      </div>

      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/50 text-left">
        <h5 className="text-[10px] font-extrabold text-[#0A3056] uppercase tracking-wider mb-1">Table Context Description</h5>
        <p className="text-xs text-slate-700 leading-relaxed font-semibold">{keysData[activeTab].desc}</p>
      </div>

      <div className="space-y-3.5 text-left">
        {filteredFields.length === 0 ? (
          <p className="text-center py-6 text-slate-400 italic text-xs">No matching glossary terms found.</p>
        ) : (
          filteredFields.map((field, i) => (
            <div key={i} className="flex gap-2 text-xs border-b border-slate-100 pb-3 last:border-b-0 last:pb-0 font-medium md:flex-row flex-col justify-start">
              <div className="w-full md:w-1/4 select-none flex items-center gap-2 font-mono font-bold text-slate-800 shrink-0">
                <CornerDownRight className="w-4 h-4 text-slate-300 hidden md:block" />
                <span>{field.id}</span>
              </div>
              <div className="flex-1 text-slate-600 leading-relaxed pt-0.5 text-left">
                {field.def}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
