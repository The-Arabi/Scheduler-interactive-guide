/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Section, Room, Timeslot, MeetingPattern, BlockedTime, LockedAssignment, SoftLock, ScheduleHistoryEntry } from './types';

export const initialSections: Section[] = [
  {
    id: 'SEC-001',
    courseId: 'ACCT 106',
    department: 'ACCT',
    course: 'Spreadsheet Basics for Business and Non-Business Majors',
    code: '16752',
    instructor: 'Martin S. Lawson',
    enroll: 65,
    cap: 72,
    meetingPattern: 'Mon, Wed',
    roomReq: 'projector, board',
    crossListGroup: 'None',
    tags: ['Undergrad', 'Core'],
    notes: [
      {
        id: 'n-1',
        text: 'This section needs to be moved to afternoon slots if possible due to instructor requirements.',
        author: 'ahmed',
        timestamp: '2026-05-22 09:15 AM',
        resolved: false
      }
    ]
  },
  {
    id: 'SEC-002',
    courseId: 'ACCT 201',
    department: 'ACCT',
    course: 'Introduction to Financial Accounting',
    code: '11094',
    instructor: 'Sabyasachi Ghosh',
    enroll: 48,
    cap: 50,
    meetingPattern: 'Mon, Wed',
    roomReq: 'projector',
    crossListGroup: 'None',
    tags: ['Undergrad', 'Core'],
    notes: []
  },
  {
    id: 'SEC-003',
    courseId: 'ACCT 203',
    department: 'ACCT',
    course: 'Introduction to Management Accounting',
    code: '12498',
    instructor: 'Christine Ostrosky',
    enroll: 38,
    cap: 50,
    meetingPattern: 'Tue, Thu',
    roomReq: 'projector, board',
    crossListGroup: 'None',
    tags: ['Undergrad', 'Core'],
    notes: []
  },
  {
    id: 'SEC-004',
    courseId: 'ACCT 301',
    department: 'ACCT',
    course: 'Intermediate Financial Accounting I',
    code: '14311',
    instructor: 'Martin S. Lawson',
    enroll: 39,
    cap: 40,
    meetingPattern: 'Tue, Thu',
    roomReq: 'whiteboard',
    crossListGroup: 'ACCT 401',
    tags: ['Undergrad', 'Elective'],
    notes: []
  },
  {
    id: 'SEC-005',
    courseId: 'BACO 310',
    department: 'BACO',
    course: 'Business Communication',
    code: '15982',
    instructor: 'Helen Astrid',
    enroll: 42,
    cap: 45,
    meetingPattern: 'Mon, Wed, Fri',
    roomReq: 'projector',
    crossListGroup: 'None',
    tags: ['Core', 'Communication'],
    notes: []
  },
  {
    id: 'SEC-006',
    courseId: 'ACCT 401',
    department: 'ACCT',
    course: 'Advanced Accounting Theory',
    code: '14312',
    instructor: 'Martin S. Lawson',
    enroll: 12,
    cap: 20,
    meetingPattern: 'Tue, Thu',
    roomReq: 'whiteboard',
    crossListGroup: 'ACCT 301',
    tags: ['Graduate', 'Cross-listed'],
    notes: []
  }
];

export const initialRooms: Room[] = [
  {
    id: 'PBL 201',
    building: 'Peter B. Lewis',
    roomCode: '201',
    capacity: 72,
    features: ['projector', 'board', 'screencast'],
    notes: 'Primary lecture room on the 2nd floor.'
  },
  {
    id: 'PBL 258',
    building: 'Peter B. Lewis',
    roomCode: '258',
    capacity: 50,
    features: ['projector', 'whiteboard'],
    notes: 'Equipped with dual whiteboards.'
  },
  {
    id: 'PBL 203',
    building: 'Peter B. Lewis',
    roomCode: '203',
    capacity: 40,
    features: ['board', 'dual monitors'],
    notes: 'Flexible team seminar configuration.'
  },
  {
    id: 'PBL 2',
    building: 'Peter B. Lewis',
    roomCode: '2',
    capacity: 45,
    features: ['projector'],
    notes: 'Basement-level classroom, quiet zone.'
  }
];

export const initialTimeslots: Timeslot[] = [
  {
    id: 'TS-001',
    days: ['Mon', 'Wed'],
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    blockType: 'Short block',
    notes: 'Standard morning slot'
  },
  {
    id: 'TS-002',
    days: ['Mon', 'Wed'],
    startTime: '09:30 AM',
    endTime: '10:45 AM',
    blockType: 'Long block',
    notes: 'Peak morning slot'
  },
  {
    id: 'TS-003',
    days: ['Mon', 'Wed'],
    startTime: '11:40 AM',
    endTime: '12:55 PM',
    blockType: 'Long block',
    notes: 'Lunchtime transition'
  },
  {
    id: 'TS-004',
    days: ['Tue', 'Thu'],
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    blockType: 'Short block',
    notes: 'Tuesday/Thursday early'
  },
  {
    id: 'TS-005',
    days: ['Tue', 'Thu'],
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    blockType: 'Long block',
    notes: 'Peak T/Th slot'
  },
  {
    id: 'TS-006',
    days: ['Mon', 'Wed', 'Fri'],
    startTime: '01:15 PM',
    endTime: '02:05 PM',
    blockType: 'Three-day short',
    notes: 'Triple slot'
  }
];

export const initialMeetingPatterns: MeetingPattern[] = [
  {
    id: 'MP-A-50',
    slots: [
      { name: 'Set 1', times: 'Mon 08:25-09:15, Wed 08:25-09:15' },
      { name: 'Set 2', times: 'Mon 09:30-10:20, Wed 09:30-10:20' }
    ],
    days: ['Mon', 'Wed'],
    notes: 'Standard 50-minute blocks'
  },
  {
    id: 'MP-B-75',
    slots: [
      { name: 'Set 1', times: 'Tue 10:00-11:15, Thu 10:00-11:15' },
      { name: 'Set 2', times: 'Tue 01:15-02:30, Thu 01:15-02:30' }
    ],
    days: ['Tue', 'Thu'],
    notes: 'Standard 75-minute blocks'
  }
];

export const initialBlockedTimes: BlockedTime[] = [
  {
    id: 'BL-001',
    scope: 'Room (PBL 201)',
    days: ['Mon'],
    start: '01:00 PM',
    end: '05:00 PM',
    reason: 'Maintenance and clean-up'
  }
];

export const initialLockedAssignments: LockedAssignment[] = [
  {
    id: 'LA-001',
    sectionId: 'SEC-002', // ACCT 201
    fixedTimeslot: 'TS-002', // M/W 09:30 AM - 10:45 AM
    fixedRoom: 'PBL 258',
    notes: 'Permanently blocked for department head request'
  }
];

export const initialSoftLocks: SoftLock[] = [
  {
    id: 'SL-001',
    sectionId: 'SEC-003', // ACCT 203
    preferredTimeslot: 'TS-005', // T/Th 10:00 AM - 11:15 AM
    preferredRoom: 'PBL 203',
    weight: 8,
    notes: 'Instructor prefers PBL 203 for interactive board placement'
  }
];

// Pre-configured successful assignments to demonstrate full-app capabilities out-of-the-box
export const defaultAssignments = [
  {
    sectionId: 'SEC-001', // ACCT 106
    roomId: 'PBL 201',
    day: 'Monday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-001', // ACCT 106
    roomId: 'PBL 201',
    day: 'Wednesday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-002', // ACCT 201
    roomId: 'PBL 258',
    day: 'Monday',
    startTime: '09:30 AM',
    endTime: '10:45 AM',
    locked: true
  },
  {
    sectionId: 'SEC-002', // ACCT 201
    roomId: 'PBL 258',
    day: 'Wednesday',
    startTime: '09:30 AM',
    endTime: '10:45 AM',
    locked: true
  },
  {
    sectionId: 'SEC-003', // ACCT 203
    roomId: 'PBL 203',
    day: 'Tuesday',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-003', // ACCT 203
    roomId: 'PBL 203',
    day: 'Thursday',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-004', // ACCT 301 (Cross-listed with SEC-006)
    roomId: 'PBL 2',
    day: 'Tuesday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-004', // ACCT 301
    roomId: 'PBL 2',
    day: 'Thursday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-006', // ACCT 401
    roomId: 'PBL 2',
    day: 'Tuesday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-006', // ACCT 401
    roomId: 'PBL 2',
    day: 'Thursday',
    startTime: '08:25 AM',
    endTime: '09:15 AM',
    locked: false
  },
  {
    sectionId: 'SEC-005', // BACO 310
    roomId: 'PBL 258',
    day: 'Monday',
    startTime: '01:15 PM',
    endTime: '02:05 PM',
    locked: false
  },
  {
    sectionId: 'SEC-005', // BACO 310
    roomId: 'PBL 258',
    day: 'Wednesday',
    startTime: '01:15 PM',
    endTime: '02:05 PM',
    locked: false
  },
  {
    sectionId: 'SEC-005', // BACO 310
    roomId: 'PBL 258',
    day: 'Friday',
    startTime: '01:15 PM',
    endTime: '02:05 PM',
    locked: false
  }
];

export const initialHistory: ScheduleHistoryEntry[] = [
  {
    id: 'HIST-01',
    name: 'Fall 2026 Core Optimization',
    timestamp: '2026-05-20 04:30 PM',
    savedSectionsCount: 6,
    assignments: defaultAssignments
  }
];
