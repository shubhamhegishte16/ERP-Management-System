const os = require('os');
const {
  createActivity,
  createOrUpdateProductivity,
  listActivities,
  populateUser,
  sameId,
  startOfDay,
} = require('../data/store');

const PRODUCTIVE_CATEGORIES = new Set(['coding', 'docs', 'design', 'meeting', 'communication']);

function buildDayRange(inputDate = new Date()) {
  const start = startOfDay(inputDate);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function between(date, start, end) {
  const value = new Date(date);
  return value >= start && value <= end;
}

function buildTodaySummary(activities) {
  const categoryTotals = {};
  const appTotals = {};
  let totalActiveSeconds = 0;
  let totalIdleSeconds = 0;

  activities.forEach((activity) => {
    categoryTotals[activity.category] = (categoryTotals[activity.category] || 0) + activity.durationSeconds;
    appTotals[activity.appName] = (appTotals[activity.appName] || 0) + activity.durationSeconds;
    if (activity.category === 'idle') totalIdleSeconds += activity.durationSeconds;
    else totalActiveSeconds += activity.durationSeconds;
  });

  const topApps = Object.entries(appTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([appName, durationSeconds]) => ({ appName, durationSeconds }));

  return {
    totalTrackedSeconds: totalActiveSeconds + totalIdleSeconds,
    totalActiveSeconds,
    totalIdleSeconds,
    trackedAppCount: Object.keys(appTotals).length,
    eventCount: activities.length,
    topApps,
    categoryTotals,
    lastCaptureAt: activities[0]?.sessionEnd || activities[0]?.date || null,
  };
}

const logActivity = async (req, res) => {
  try {
    const {
      appName,
      windowTitle,
      executablePath,
      category,
      durationSeconds,
      isPrivate,
      sessionStart,
      sessionEnd,
      source,
      trackerVersion,
      platform,
      deviceName,
    } = req.body;

    if (!appName || !durationSeconds) {
      return res.status(400).json({ success: false, message: 'appName and durationSeconds are required' });
    }

    const safeDuration = Math.max(1, Math.min(12 * 60 * 60, Number(durationSeconds) || 0));
    const resolvedStart = sessionStart ? new Date(sessionStart) : new Date();
    const resolvedEnd = sessionEnd ? new Date(sessionEnd) : new Date(resolvedStart.getTime() + safeDuration * 1000);
    const isMasked = Boolean(isPrivate);

    const activity = createActivity({
      user: req.user._id,
      date: resolvedStart,
      sessionStart: resolvedStart,
      sessionEnd: resolvedEnd,
      appName: isMasked ? 'Private Session' : appName,
      windowTitle: isMasked ? '[Private]' : (windowTitle || ''),
      executablePath: executablePath || '',
      category: category || 'other',
      durationSeconds: safeDuration,
      isPrivate: isMasked,
      source: source || 'desktop',
      trackerVersion: trackerVersion || '',
      platform: platform || req.headers['x-client-platform'] || process.platform,
      deviceName: deviceName || os.hostname(),
    });

    recalcProductivity(req.user._id);

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('activity-update', {
        userId: req.user._id,
        userName: req.user.name,
        activity,
      });
    }

    res.status(201).json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMyActivity = async (req, res) => {
  try {
    const days = Math.max(1, Math.min(30, parseInt(req.query.days, 10) || 1));
    const start = startOfDay();
    start.setDate(start.getDate() - (days - 1));
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const activities = listActivities({ user: req.user._id })
      .filter((entry) => between(entry.date, start, end))
      .sort((a, b) => new Date(b.sessionStart) - new Date(a.sessionStart));

    const today = buildDayRange();
    const summary = buildTodaySummary(activities.filter((entry) => between(entry.date, today.start, today.end)));

    res.json({ success: true, count: activities.length, activities, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getHourlyBreakdown = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const dateStr = req.query.date || new Date().toISOString().split('T')[0];
    const { start, end } = buildDayRange(new Date(dateStr));
    const totals = new Map();

    listActivities({ user: userId })
      .filter((entry) => between(entry.date, start, end))
      .forEach((entry) => {
        const key = `${entry.hour}:${entry.category}`;
        const current = totals.get(key) || { _id: { hour: entry.hour, category: entry.category }, totalSeconds: 0 };
        current.totalSeconds += entry.durationSeconds;
        totals.set(key, current);
      });

    res.json({ success: true, breakdown: Array.from(totals.values()).sort((a, b) => a._id.hour - b._id.hour) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTeamActivity = async (req, res) => {
  try {
    const { start } = buildDayRange();
    const grouped = new Map();

    listActivities()
      .filter((entry) => new Date(entry.date) >= start)
      .forEach((entry) => {
        const current = grouped.get(entry.user) || {
          _id: entry.user,
          totalSeconds: 0,
          activeSeconds: 0,
          idleSeconds: 0,
          apps: [],
          lastSeenAt: null,
        };
        current.totalSeconds += entry.durationSeconds;
        if (entry.category === 'idle') current.idleSeconds += entry.durationSeconds;
        else current.activeSeconds += entry.durationSeconds;
        current.apps.push({ appName: entry.appName, durationSeconds: entry.durationSeconds });
        if (!current.lastSeenAt || new Date(entry.sessionEnd) > new Date(current.lastSeenAt)) {
          current.lastSeenAt = entry.sessionEnd;
        }
        grouped.set(entry.user, current);
      });

    const team = Array.from(grouped.values()).map((entry) => ({
      ...entry,
      user: populateUser(entry._id),
      topApp: entry.apps.sort((a, b) => b.durationSeconds - a.durationSeconds)[0]?.appName || 'No activity',
    }));

    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

function recalcProductivity(userId) {
  const { start, end } = buildDayRange();
  const activities = listActivities({ user: userId })
    .filter((activity) => between(activity.date, start, end) && !activity.isPrivate);

  const totalActive = activities
    .filter((activity) => activity.category !== 'idle')
    .reduce((sum, activity) => sum + activity.durationSeconds, 0);
  const totalIdle = activities
    .filter((activity) => activity.category === 'idle')
    .reduce((sum, activity) => sum + activity.durationSeconds, 0);

  const appMap = {};
  activities.forEach((activity) => {
    appMap[activity.appName] = (appMap[activity.appName] || 0) + activity.durationSeconds;
  });

  const topApps = Object.entries(appMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([appName, durationSeconds]) => ({ appName, durationSeconds }));

  const focusedSeconds = activities
    .filter((activity) => PRODUCTIVE_CATEGORIES.has(activity.category))
    .reduce((sum, activity) => sum + activity.durationSeconds, 0);

  const DAILY_GOAL_SECONDS = 6000;
  const score = Math.min(100, Math.round((totalActive / DAILY_GOAL_SECONDS) * 100));
  const focusScore = totalActive > 0 ? Math.round((focusedSeconds / totalActive) * 100) : 0;
  const burnoutRisk = totalActive > 36000 ? 'high' : totalActive > 25200 ? 'medium' : 'low';
  const anomalyFlag = totalIdle > totalActive && totalActive + totalIdle > 3600;

  createOrUpdateProductivity(userId, start, {
    score,
    totalActiveSeconds: totalActive,
    totalIdleSeconds: totalIdle,
    focusScore,
    burnoutRisk,
    anomalyFlag,
    anomalyReason: anomalyFlag ? 'Idle time exceeded active time for more than one tracked hour.' : '',
    topApps,
  });
}

module.exports = { logActivity, getMyActivity, getHourlyBreakdown, getTeamActivity };
