const express = require('express');
const router = express.Router();
const { getProjects, createProject, updateProject, completeMyProject, deleteProject } = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getProjects);
router.post('/', protect, authorize('manager', 'admin'), createProject);
router.put('/:id/complete-my-work', protect, authorize('employee'), completeMyProject);
router.put('/:id', protect, authorize('manager', 'admin'), updateProject);
router.delete('/:id', protect, authorize('admin'), deleteProject);

module.exports = router;
