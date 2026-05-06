const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.get('/', auth, alertController.getAlerts);

module.exports = router;