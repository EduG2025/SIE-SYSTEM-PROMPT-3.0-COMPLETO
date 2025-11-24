
const express = require('express');
const router = express.Router();

// Importação de Rotas Modulares
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const planRoutes = require('./planRoutes');
const moduleRoutes = require('./moduleRoutes');
const systemRoutes = require('./systemRoutes');
const themeRoutes = require('./themeRoutes');
const homepageRoutes = require('./homepageRoutes');
const uploadRoutes = require('./uploadRoutes');
const aiRoutes = require('./aiRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const domainRoutes = require('./domainRoutes');
const logRoutes = require('./logRoutes');
const dataRoutes = require('./dataRoutes');

// Definição dos Endpoints (/api/...)
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/plans', planRoutes);
router.use('/modules', moduleRoutes);
router.use('/system', systemRoutes);
router.use('/settings/theme', themeRoutes);
router.use('/settings/homepage', homepageRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/domain', domainRoutes); // Políticos, Empresas, etc.
router.use('/logs', logRoutes);
router.use('/data', dataRoutes);

module.exports = router;
