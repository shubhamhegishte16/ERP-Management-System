const bcrypt = require('bcryptjs');

const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const sameId = (a, b) => String(a) === String(b);

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value._id || value.id || null;
  return String(value);
};

const startOfDay = (input = new Date()) => {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

const withUserMethods = (user) => {
  if (!user) return null;
  return {
    ...user,
    matchPassword: async (entered) => bcrypt.compare(entered, user.password),
  };
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return clone(safeUser);
};

const completionPercent = (project) => {
  if (!project.tasks?.length) return 0;
  const done = project.tasks.filter((task) => task.status === 'done').length;
  return Math.round((done / project.tasks.length) * 100);
};

const serializeProject = (project) => ({
  ...clone(project),
  completionPercent: completionPercent(project),
});

const state = {
  users: [],
  projects: [],
  activities: [],
  productivity: [],
};

function ensureDefaultUsers() {
  if (state.users.length) return;

  const defaults = [
    {
      name: 'System Admin',
      email: 'admin@workpulse.com',
      password: 'admin123',
      role: 'admin',
      department: 'Administration',
    },
    {
      name: 'Shubham Hegishte',
      email: 'shubham@gmail.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
    },
    {
      name: 'Vinaya Patole',
      email: 'vinaya@gmail.com',
      password: 'manager123',
      role: 'manager',
      department: 'Operations',
    },
    {
      name: 'Rushan Kamble',
      email: 'rushan@gmail.com',
      password: 'manager123',
      role: 'manager',
      department: 'Product',
    },
  ];

  defaults.forEach((user) => {
    createUserSync(user);
  });
}

function createUserSync(userData) {
  const now = new Date();
  const user = {
    _id: createId(),
    name: userData.name,
    email: String(userData.email).toLowerCase().trim(),
    password: bcrypt.hashSync(userData.password, 10),
    role: userData.role || 'employee',
    manager: userData.manager || null,
    department: userData.department || 'General',
    registrationDate: userData.registrationDate ? new Date(userData.registrationDate) : now,
    avatar: userData.avatar || '',
    isActive: userData.isActive !== false,
    createdAt: now,
  };
  state.users.push(user);
  return withUserMethods(user);
}

const matches = (record, query = {}) => Object.entries(query).every(([key, expected]) => {
  const actual = record[key];
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$gte' in expected && new Date(actual) < new Date(expected.$gte)) return false;
    if ('$lte' in expected && new Date(actual) > new Date(expected.$lte)) return false;
    if ('$lt' in expected && new Date(actual) >= new Date(expected.$lt)) return false;
    if ('$in' in expected && !expected.$in.includes(actual)) return false;
    return true;
  }
  if (Array.isArray(actual)) return actual.some((item) => sameId(item, expected));
  return sameId(actual, expected);
});

function listUsers(query = {}) {
  return state.users.filter((user) => matches(user, query)).map(withUserMethods);
}

function findUser(query = {}) {
  return listUsers(query)[0] || null;
}

function findUserById(id) {
  return withUserMethods(state.users.find((user) => sameId(user._id, id)));
}

function createUser(userData) {
  return createUserSync(userData);
}

function deleteUser(id) {
  const index = state.users.findIndex((user) => sameId(user._id, id));
  if (index === -1) return null;
  const [deleted] = state.users.splice(index, 1);
  state.activities = state.activities.filter((activity) => !sameId(activity.user, id));
  state.productivity = state.productivity.filter((record) => !sameId(record.user, id));
  state.projects.forEach((project) => {
    project.team = project.team.filter((memberId) => !sameId(memberId, id));
    project.tasks = project.tasks.filter((task) => !sameId(task.assignedTo, id));
  });
  return withUserMethods(deleted);
}

function createActivity(activityData) {
  const anchor = new Date(activityData.sessionStart || activityData.date || Date.now());
  const duration = Number(activityData.durationSeconds) || 0;
  const activity = {
    _id: createId(),
    ...activityData,
    user: String(activityData.user),
    date: anchor,
    sessionStart: anchor,
    sessionEnd: activityData.sessionEnd ? new Date(activityData.sessionEnd) : new Date(anchor.getTime() + duration * 1000),
    durationSeconds: duration,
    hour: anchor.getHours(),
  };
  state.activities.push(activity);
  return clone(activity);
}

function listActivities(query = {}) {
  return state.activities.filter((activity) => matches(activity, query)).map(clone);
}

function createOrUpdateProductivity(userId, date, data) {
  const day = startOfDay(date);
  let record = state.productivity.find((item) => sameId(item.user, userId) && startOfDay(item.date).getTime() === day.getTime());
  if (!record) {
    record = { _id: createId(), user: String(userId), date: day };
    state.productivity.push(record);
  }
  Object.assign(record, data);
  return clone(record);
}

function listProductivity(query = {}) {
  return state.productivity.filter((record) => matches(record, query)).map(clone);
}

function createProject(projectData) {
  const now = new Date();
  const project = {
    _id: createId(),
    name: projectData.name,
    description: projectData.description || '',
    manager: projectData.manager || null,
    team: Array.isArray(projectData.team) ? projectData.team.map(String) : [],
    tasks: Array.isArray(projectData.tasks) ? projectData.tasks.map((task) => ({
      _id: task._id || createId(),
      title: task.title,
      assignedTo: normalizeId(task.assignedTo),
      status: task.status || 'todo',
      estimatedHours: Number(task.estimatedHours) || 0,
      loggedHours: Number(task.loggedHours) || 0,
    })) : [],
    status: projectData.status || 'active',
    startDate: projectData.startDate ? new Date(projectData.startDate) : now,
    endDate: projectData.endDate ? new Date(projectData.endDate) : null,
    createdAt: now,
  };
  state.projects.push(project);
  return serializeProject(project);
}

function listProjects(query = {}) {
  return state.projects.filter((project) => matches(project, query)).map(serializeProject);
}

function updateProject(id, updates) {
  const project = state.projects.find((item) => sameId(item._id, id));
  if (!project) return null;
  Object.assign(project, updates);
  if (updates.team) project.team = updates.team.map(String);
  if (updates.tasks) {
    project.tasks = updates.tasks.map((task) => ({
      ...task,
      _id: task._id || createId(),
      assignedTo: normalizeId(task.assignedTo),
    }));
  }
  return serializeProject(project);
}

function deleteProject(id) {
  const index = state.projects.findIndex((project) => sameId(project._id, id));
  if (index === -1) return null;
  const [deleted] = state.projects.splice(index, 1);
  return serializeProject(deleted);
}

function populateUser(userId) {
  return sanitizeUser(state.users.find((user) => sameId(user._id, userId)));
}

function snapshot() {
  return {
    users: state.users.map(sanitizeUser),
    projects: state.projects.map(serializeProject),
    activities: state.activities.map(clone),
    productivity: state.productivity.map(clone),
  };
}

module.exports = {
  clone,
  sameId,
  startOfDay,
  ensureDefaultUsers,
  sanitizeUser,
  populateUser,
  listUsers,
  findUser,
  findUserById,
  createUser,
  deleteUser,
  createActivity,
  listActivities,
  createOrUpdateProductivity,
  listProductivity,
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  snapshot,
};
