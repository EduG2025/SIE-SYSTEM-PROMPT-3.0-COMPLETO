
const express = require('express');
const router = express.Router();
const { SettingsController } = require('../controllers/settingsController');
const { ApiKeyController } = require('../controllers/apiKeyController');
const { protect, admin } = require('../middleware/authMiddleware');

// Theme & Homepage
router.get('/theme', SettingsController.getTheme);
router.get('/homepage', SettingsController.getHomepage);
router.post('/theme', protect, admin, SettingsController.saveTheme);
router.post('/homepage', protect, admin, SettingsController.saveHomepage);

// AI Settings (System Prompt & Automation)
router.get('/ai', protect, SettingsController.getAiSettings);
router.post('/ai', protect, admin, SettingsController.saveAiSettings);
router.post('/ai/automation', protect, admin, SettingsController.saveAutomationSettings); // Configurar Cron
router.post('/ai/run', protect, admin, SettingsController.runAutomationTask); // Trigger Manual

// API Keys Management
router.get('/keys', protect, admin, ApiKeyController.getAllKeys);
router.post('/keys', protect, admin, ApiKeyController.addKey);
router.put('/keys/:id/toggle', protect, admin, ApiKeyController.toggleStatus);
router.delete('/keys/:id', protect, admin, ApiKeyController.deleteKey);

module.exports = router;
