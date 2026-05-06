const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  deleteUser,
  listActivities,
  listProductivity,
  listProjects,
  listUsers,
  populateUser,
  sameId,
  sanitizeUser,
  snapshot,
  startOfDay,
} = require('../data/store');

router.use(protect);
router.use(adminOnly);

const isToday = (date) => startOfDay(date).getTime() === startOfDay().getTime();

router.get('/stats', async (req, res) => {
  try {
    const users = listUsers();
    const projects = listProjects();
    const todayActivities = listActivities().filter((activity) => isToday(activity.date));
    const todayProductivity = listProductivity().filter((record) => isToday(record.date));
    const activeUserIds = new Set(todayActivities.map((activity) => String(activity.user)));
    const avgProductivity = todayProductivity.length
      ? todayProductivity.reduce((sum, record) => sum + (record.score || 0), 0) / todayProductivity.length
      : 0;

    res.json({
      success: true,
      data: {
        totalUsers: users.length,
        activeUsersToday: activeUserIds.size,
        totalProjects: projects.length,
        activeProjects: projects.filter((project) => project.status === 'active').length,
        todayActivities: todayActivities.length,
        avgProductivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/active-users', async (req, res) => {
  try {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const latest = new Map();

    listActivities()
      .filter((activity) => new Date(activity.date) >= lastHour)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach((activity) => {
        if (!latest.has(activity.user)) latest.set(activity.user, activity);
      });

    const activeUsers = Array.from(latest.values()).map((activity) => {
      const user = populateUser(activity.user);
      return {
        _id: activity.user,
        name: user?.name,
        email: user?.email,
        department: user?.department,
        role: user?.role,
        lastActivity: activity.date,
        currentApp: activity.appName,
        category: activity.category,
      };
    });

    res.json({ success: true, data: activeUsers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/employee-rankings', async (req, res) => {
  try {
    const rankings = listProductivity()
      .filter((record) => isToday(record.date))
      .map((record) => ({ ...record, user: populateUser(record.user) }))
      .filter((record) => record.user?.isActive)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20)
      .map((record) => ({
        userId: record.user._id,
        name: record.user.name,
        email: record.user.email,
        department: record.user.department,
        role: record.user.role,
        score: record.score,
        focusScore: record.focusScore,
        burnoutRisk: record.burnoutRisk,
        totalActiveSeconds: record.totalActiveSeconds,
      }));

    res.json({ success: true, data: rankings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const projectStats = listProjects()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((project) => ({
        id: project._id,
        name: project.name,
        manager: populateUser(project.manager),
        teamSize: project.team.length,
        tasks: {
          total: project.tasks.length,
          todo: project.tasks.filter((task) => task.status === 'todo').length,
          inprogress: project.tasks.filter((task) => task.status === 'inprogress').length,
          done: project.tasks.filter((task) => task.status === 'done').length,
        },
        completionPercent: project.completionPercent,
        status: project.status,
        startDate: project.startDate,
        endDate: project.endDate,
      }));

    res.json({ success: true, data: projectStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/hourly-activity', async (req, res) => {
  try {
    const todayActivities = listActivities().filter((activity) => isToday(activity.date));
    const data = Array.from({ length: 24 }, (_, hour) => {
      const activities = todayActivities.filter((activity) => activity.hour === hour);
      return {
        hour,
        totalActivities: activities.length,
        activeUsers: new Set(activities.map((activity) => String(activity.user))).size,
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/at-risk-employees', async (req, res) => {
  try {
    const atRisk = listProductivity()
      .filter((record) => isToday(record.date))
      .filter((record) => record.score < 40 || record.burnoutRisk === 'high' || record.anomalyFlag)
      .map((record) => {
        const user = populateUser(record.user);
        return {
          userId: user?._id,
          name: user?.name,
          email: user?.email,
          department: user?.department,
          score: record.score,
          burnoutRisk: record.burnoutRisk,
          anomalyFlag: record.anomalyFlag,
          anomalyReason: record.anomalyReason,
          focusScore: record.focusScore,
        };
      });

    res.json({ success: true, data: atRisk });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/all-data', async (req, res) => {
  try {
    res.json({ success: true, data: snapshot() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (sameId(req.params.id, req.user._id)) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account' });
    }

    const targetUser = listUsers().find((user) => sameId(user._id, req.params.id));
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.role === 'manager') {
      return res.status(400).json({ success: false, message: 'Managers are permanent and cannot be deleted' });
    }

    const user = deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted successfully', user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
