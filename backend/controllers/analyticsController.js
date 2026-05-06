const {
  listActivities,
  listProductivity,
  listUsers,
  populateUser,
  sameId,
  sanitizeUser,
  startOfDay,
} = require('../data/store');

const getMyProductivity = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 7;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const records = listProductivity({ user: req.user._id })
      .filter((record) => new Date(record.date) >= from)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTeamProductivity = async (req, res) => {
  try {
    const today = startOfDay();
    const records = listProductivity()
      .filter((record) => startOfDay(record.date).getTime() === today.getTime())
      .map((record) => ({ ...record, user: populateUser(record.user) }));

    const burnoutAlerts = listProductivity()
      .filter((record) => ['medium', 'high'].includes(record.burnoutRisk))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map((record) => ({ ...record, user: populateUser(record.user) }));

    const anomalies = listProductivity({ anomalyFlag: true })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map((record) => ({ ...record, user: populateUser(record.user) }));

    res.json({ success: true, records, burnoutAlerts, anomalies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getHeatmap = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const grouped = new Map();

    listActivities({ user: userId })
      .filter((activity) => new Date(activity.date) >= from && !activity.isPrivate)
      .forEach((activity) => {
        const date = new Date(activity.date);
        const dayOfWeek = date.getDay() + 1;
        const key = `${dayOfWeek}:${activity.hour}`;
        const current = grouped.get(key) || { _id: { dayOfWeek, hour: activity.hour }, totalSeconds: 0 };
        current.totalSeconds += activity.durationSeconds;
        grouped.set(key, current);
      });

    res.json({ success: true, heatmap: Array.from(grouped.values()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTeamSummary = async (req, res) => {
  try {
    const today = startOfDay();
    const productivity = listProductivity()
      .filter((record) => startOfDay(record.date).getTime() === today.getTime());

    const summary = listUsers({ isActive: true }).map((user) => ({
      user: sanitizeUser(user),
      productivity: productivity.find((record) => sameId(record.user, user._id)) || null,
    }));

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getMyProductivity, getTeamProductivity, getHeatmap, getTeamSummary };
