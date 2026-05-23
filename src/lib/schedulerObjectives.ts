/** Snapshot of the proxied scheduler iframe (same-origin, so we can read DOM). */
export interface SchedulerSnapshot {
  proxyPathname: string;
  realUrl: string | null;
  host: string | null;
  path: string;
  title: string;
  bodyText: string;
}

const SCHEDULER = 'course-scheduler.xlab-cwru.com';
const CAS = 'login.case.edu';

function isSchedulerHost(host: string | null): boolean {
  return host === SCHEDULER;
}

/** Returns chapter IDs that appear complete given current + recent navigation. */
export function detectChapterCompletions(
  current: SchedulerSnapshot,
  history: SchedulerSnapshot[]
): number[] {
  const done = new Set<number>();
  const all = [...history, current];
  const text = current.bodyText.toLowerCase();
  const path = current.path.toLowerCase();
  const title = current.title.toLowerCase();

  const touchedScheduler = all.some((s) => isSchedulerHost(s.host));
  const visitedCas = all.some((s) => s.host === CAS);
  const onScheduler = isSchedulerHost(current.host);
  const onCas = current.host === CAS;
  const onLoginPage =
    path.includes('/login') || title === 'login' || (onScheduler && path.endsWith('/login'));

  // 1 — Opened / interacted with the live scheduler webview
  if (touchedScheduler || onCas) {
    done.add(1);
  }

  // 2 — Completed SSO (saw CAS, then scheduler past /login)
  const pastLogin =
    onScheduler &&
    !onLoginPage &&
    (path === '/' ||
      path.includes('/editor') ||
      path.includes('/calendar') ||
      path.includes('/api/auth') ||
      path.includes('/dashboard'));
  if ((visitedCas && pastLogin) || (onScheduler && pastLogin && all.length > 2)) {
    done.add(2);
  }

  if (!onScheduler || onLoginPage) {
    return [...done];
  }

  // 3 — Editor view with sections grid
  if (
    path.includes('/editor') ||
    (text.includes('sections') &&
      (text.includes('course id') || text.includes('department') || text.includes('instructor')))
  ) {
    done.add(3);
  }

  // 4 — Action toolbar visible
  if (
    text.includes('update backend') ||
    text.includes('import spreadsheet') ||
    text.includes('run solver') ||
    text.includes('export spreadsheet')
  ) {
    done.add(4);
  }

  // 5 — Related tables (rooms, timeslots, constraints, patterns)
  const tableHints = ['rooms', 'timeslots', 'meeting patterns', 'constraints', 'instructors'];
  const tableHits = tableHints.filter((t) => text.includes(t)).length;
  if (tableHits >= 2 || (text.includes('sections') && tableHits >= 1)) {
    done.add(5);
  }

  // 6 — Notes column / notes UI
  if (
    text.includes('view notes') ||
    (text.includes('notes') && text.includes('section'))
  ) {
    done.add(6);
  }

  // 7 — Calendar after solver
  if (path.includes('/calendar') || (text.includes('calendar') && text.includes('monday'))) {
    done.add(7);
  }

  // 8 — Calendar with lock language
  if (
    (path.includes('/calendar') || text.includes('calendar')) &&
    (text.includes('lock') || text.includes('locked'))
  ) {
    done.add(8);
  }

  // 9 — History / save / PDF export
  if (
    text.includes('save schedule') ||
    text.includes('history') ||
    text.includes('export to pdf') ||
    text.includes('export pdf')
  ) {
    done.add(9);
  }

  return [...done];
}

export function readSchedulerSnapshot(
  iframe: HTMLIFrameElement | null
): SchedulerSnapshot | null {
  if (!iframe?.contentWindow) return null;

  try {
    const loc = iframe.contentWindow.location;
    const proxyPathname = loc.pathname + loc.search;
    const doc = iframe.contentDocument;
    const title = doc?.title ?? '';
    const bodyText = doc?.body?.innerText ?? '';

    let host: string | null = null;
    let path = '/';
    let realUrl: string | null = null;

    const match = proxyPathname.match(/\/proxy-site\/([^/]+)(\/.*)?$/);
    if (match) {
      host = match[1];
      path = match[2] || '/';
      realUrl = `https://${host}${path}`;
    }

    return { proxyPathname, realUrl, host, path, title, bodyText };
  } catch {
    return null;
  }
}
