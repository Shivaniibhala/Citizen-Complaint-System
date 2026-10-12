const express = require('express');
const router = express.Router();
const { verifyRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/complaintController');

// All endpoints chained here require 'Admin' role mock header mapping
router.use(verifyRole('Admin'));

// Protected Admin Endpoints
router.get('/complaints', controller.getAllComplaints);
router.put('/assign/:id', controller.assignDepartmentAdmin);

module.exports = router;
