/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Section {
  id: string; // e.g., ACCT-100-SB
  courseId: string; // e.g., ACCT 100
  department: string; // e.g., ACCT
  course: string; // e.g., Spreadsheet Basics for Business and Non-Business Majors
  code: string; // internal variable
  instructor: string;
  enroll: number;
  cap: number;
  meetingPattern: string; // e.g., "Mon, Wed"
  roomReq: string; // e.g., "projector, board"
  crossListGroup: string;
  tags: string[];
  notes: SectionNote[];
}

export interface SectionNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  resolved: boolean;
}

export interface Room {
  id: string; // e.g., PBL 201
  building: string; // e.g., Peter B. Lewis
  roomCode: string; // e.g., 201
  capacity: number;
  features: string[];
  notes: string;
}

export interface Timeslot {
  id: string; // e.g., A1-M
  days: string[]; // e.g., ["Mon", "Wed"]
  startTime: string; // e.g., "8:25 AM"
  endTime: string; // e.g., "9:15 AM"
  blockType: string; // e.g., "Short block"
  notes: string;
}

export interface MeetingPattern {
  id: string; // e.g., MP-A-50
  slots: { name: string; times: string }[];
  days: string[];
  notes: string;
}

export interface BlockedTime {
  id: string;
  scope: string; // e.g., "Room (PBL 201)"
  days: string[];
  start: string;
  end: string;
  reason: string;
}

export interface LockedAssignment {
  id: string;
  sectionId: string;
  fixedTimeslot: string;
  fixedRoom: string;
  notes: string;
}

export interface SoftLock {
  id: string;
  sectionId: string;
  preferredTimeslot: string;
  preferredRoom: string;
  weight: number; // For solver priority
  notes: string;
}

export interface ScheduleHistoryEntry {
  id: string;
  name: string;
  timestamp: string;
  savedSectionsCount: number;
  assignments: CalendarAssignment[];
}

export interface CalendarAssignment {
  sectionId: string;
  roomId: string;
  day: string; // "Monday", "Tuesday", etc.
  startTime: string; // e.g. "09:00 AM" (for pixel alignment / categorization)
  endTime: string; // e.g. "10:30 AM"
  locked: boolean;
}

export type ActiveTableType =
  | 'Sections'
  | 'Instructors'
  | 'Rooms'
  | 'Timeslots'
  | 'Meeting Patterns'
  | 'Constraints';
