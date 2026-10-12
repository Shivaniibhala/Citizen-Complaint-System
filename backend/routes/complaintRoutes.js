const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintController');

// Public Citizen Endpoints
router.post('/', controller.submitComplaint);
router.get('/query/:email', controller.lookupUserComplaints);
router.get('/:complaintId', controller.trackComplaint);

module.exports = router;
