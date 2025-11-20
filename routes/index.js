const express = require('express');
const router = express.Router();

const systemRoutes = require('./systemRoutes');
const settingsRoutes = require('./settingsRoutes');
const uploadRoutes = require('./uploadRoutes');
const authRoutes = require('./authRoutes');
const moduleRoutes = require('./moduleRoutes');

router.use('/system', systemRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/auth', authRoutes);
router.use('/modules', moduleRoutes);

module.exports = router;