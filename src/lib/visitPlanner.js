/**
 * Visit Planner and Priority Scheduler
 * Computes scheduled visits from household register and ranks them:
 * Priority 1: High risk / Danger warning (Urgent)
 * Priority 2: Overdue immunisation / ANC
 * Priority 3: Due soon / Routine follow-up
 */

/**
 * Determines if a patient visit has been completed.
 */
export function isVisitCompleted(patient) {
  if (!patient) return false;
  return (
    patient.isCompleted === true ||
    patient.status === 'Completed Today' ||
    Boolean(patient.completedAt)
  );
}

/**
 * Computes live daily statistics from the household register.
 * Dynamic counts:
 * - scheduledVisits: pending visits remaining to be completed today (e.g. 30 -> 29)
 * - totalScheduled: total visits scheduled for today (pending + completed)
 * - pendingVisits: pending count
 * - completedVisits: completed count (increases 0 -> 1)
 * - urgentAlerts: pending high-risk priority 1 visits
 * - immunisationsDue: pending child immunisation visits
 * - followupsDue: pending NCD / routine follow-up visits
 */
export function computeDailyStats(households) {
  if (!households || households.length === 0) {
    return {
      scheduledVisits: 0,
      totalScheduled: 0,
      pendingVisits: 0,
      completedVisits: 0,
      followupsDue: 0,
      immunisationsDue: 0,
      urgentAlerts: 0
    };
  }

  let totalScheduled = 0;
  let completedVisits = 0;
  let followupsDue = 0;
  let immunisationsDue = 0;
  let urgentAlerts = 0;

  households.forEach(h => {
    const p = h.patient;
    if (!p) return;

    totalScheduled++;
    const isDone = isVisitCompleted(p);

    if (isDone) {
      completedVisits++;
    } else {
      if (p.priority === 1) {
        urgentAlerts++;
      }
      if (p.category === 'Child') {
        immunisationsDue++;
      }
      if (p.category === 'NCD' || (p.status && p.status.includes('Follow-up'))) {
        followupsDue++;
      }
    }
  });

  const pendingVisits = totalScheduled - completedVisits;

  return {
    scheduledVisits: pendingVisits,
    totalScheduled,
    pendingVisits,
    completedVisits,
    followupsDue,
    immunisationsDue,
    urgentAlerts
  };
}

/**
 * Computes dynamic category-level counts:
 * For each category ('all', 'anc', 'imm', 'ncd'), computes { pending, completed, total }.
 * Guarantees pending + completed === total.
 */
export function computeCategoryCounts(households) {
  const counts = {
    all: { pending: 0, completed: 0, total: 0 },
    anc: { pending: 0, completed: 0, total: 0 },
    imm: { pending: 0, completed: 0, total: 0 },
    ncd: { pending: 0, completed: 0, total: 0 }
  };

  (households || []).forEach(h => {
    const p = h.patient;
    if (!p) return;
    const isDone = isVisitCompleted(p);

    counts.all.total++;
    if (isDone) counts.all.completed++;
    else counts.all.pending++;

    if (p.category === 'Pregnant') {
      counts.anc.total++;
      if (isDone) counts.anc.completed++;
      else counts.anc.pending++;
    } else if (p.category === 'Child') {
      counts.imm.total++;
      if (isDone) counts.imm.completed++;
      else counts.imm.pending++;
    } else if (p.category === 'NCD') {
      counts.ncd.total++;
      if (isDone) counts.ncd.completed++;
      else counts.ncd.pending++;
    }
  });

  return counts;
}

/**
 * Returns filtered and sorted visits.
 * @param {Array} households
 * @param {string} filter - 'all' | 'anc' | 'imm' | 'ncd'
 * @param {string} view - 'all' | 'pending' | 'completed'
 */
export function getRankedVisits(households, filter = 'all', view = 'all') {
  if (!households) return [];

  let list = households.filter(h => h.patient);

  // Filter by completion view
  if (view === 'pending') {
    list = list.filter(h => !isVisitCompleted(h.patient));
  } else if (view === 'completed') {
    list = list.filter(h => isVisitCompleted(h.patient));
  }

  // Filter by category
  if (filter === 'anc') {
    list = list.filter(h => h.patient.category === 'Pregnant');
  } else if (filter === 'imm') {
    list = list.filter(h => h.patient.category === 'Child');
  } else if (filter === 'ncd') {
    list = list.filter(h => h.patient.category === 'NCD');
  }

  // If completed view, sort by completedAt descending (most recent first)
  if (view === 'completed') {
    return [...list].sort((a, b) => {
      const tA = new Date(a.patient.completedAt || 0).getTime();
      const tB = new Date(b.patient.completedAt || 0).getTime();
      return tB - tA;
    });
  }

  // Priority sort: Priority 1 first, then 2, then 3, then by distance
  return [...list].sort((a, b) => {
    const pA = a.patient.priority || 3;
    const pB = b.patient.priority || 3;

    if (pA !== pB) {
      return pA - pB;
    }

    return (a.distance_km || 0) - (b.distance_km || 0);
  });
}

export function getPendingVisits(households, filter = 'all') {
  return getRankedVisits(households, filter, 'pending');
}

export function getCompletedVisits(households, filter = 'all') {
  return getRankedVisits(households, filter, 'completed');
}
