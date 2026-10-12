const express = require('express');
const router = express.Router();
const { sendStatusUpdateEmail, sendAuthEmail } = require('../controllers/emailController');

router.post('/notify-status', sendStatusUpdateEmail);
router.post('/notify-auth', sendAuthEmail);

module.exports = router;
