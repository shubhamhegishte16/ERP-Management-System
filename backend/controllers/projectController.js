const {
  createProject: addProject,
  deleteProject: removeProject,
  listProjects,
  populateUser,
  sameId,
  updateProject: changeProject,
} = require('../data/store');

const populateProject = (project) => ({
  ...project,
  manager: populateUser(project.manager),
  team: project.team.map(populateUser).filter(Boolean),
  tasks: project.tasks.map((task) => ({
    ...task,
    assignedTo: populateUser(task.assignedTo),
  })),
});

const getProjects = async (req, res) => {
  try {
    const projects = listProjects()
      .filter((project) => req.user.role !== 'employee' || project.team.some((id) => sameId(id, req.user._id)))
      .map(populateProject);

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createProject = async (req, res) => {
  try {
    const manager = req.user.role === 'admin' && req.body.manager ? req.body.manager : req.user._id;
    const team = Array.isArray(req.body.team) ? [...new Set(req.body.team.filter(Boolean).map(String))] : [];
    const project = populateProject(addProject({ ...req.body, manager, team }));
    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = changeProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project: populateProject(project) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const completeMyProject = async (req, res) => {
  try {
    const project = listProjects().find((item) => sameId(item._id, req.params.id));

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (!project.team.some((memberId) => sameId(memberId, req.user._id))) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this project' });
    }

    const updatedProject = changeProject(project._id, {
      team: project.team.filter((memberId) => !sameId(memberId, req.user._id)),
      tasks: project.tasks.map((task) => (
        task.assignedTo && sameId(task.assignedTo, req.user._id)
          ? { ...task, status: 'done' }
          : task
      )),
    });

    res.json({
      success: true,
      message: 'Project completed for your account',
      project: populateProject(updatedProject),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    removeProject(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getProjects, createProject, updateProject, completeMyProject, deleteProject };
