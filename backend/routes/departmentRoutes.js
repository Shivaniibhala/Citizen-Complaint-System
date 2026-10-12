const express = require('express');
const router = express.Router();
const { verifyRole } = require('../middleware/authMiddleware');
const controller = require('../controllers/complaintController');

// Restrict these routes to Department Officer profiles
router.use(verifyRole('DepartmentOfficer'));

// Protected Department Endpoints
router.get('/:dept', controller.getDepartmentComplaints);
router.put('/update/:id', controller.updateComplaintStatus);

module.exports = router;
