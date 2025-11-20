const express = require('express');
const router = express.Router();

// Importação de Rotas
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const planRoutes = require('./planRoutes');
const moduleRoutes = require('./moduleRoutes');
const systemRoutes = require('./systemRoutes');
const settingsRoutes = require('./settingsRoutes');
const uploadRoutes = require('./uploadRoutes');
const aiRoutes = require('./aiRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const domainRoutes = require('./domainRoutes');
const logRoutes = require('./logRoutes');
const homepageRoutes = require('./homepageRoutes');
const dataRoutes = require('./dataRoutes');

// Definição de Endpoints da API REST
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/plans', planRoutes);
router.use('/modules', moduleRoutes);
router.use('/system', systemRoutes);
router.use('/settings', settingsRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/domain', domainRoutes); 
router.use('/logs', logRoutes);
router.use('/homepage', homepageRoutes);
router.use('/data', dataRoutes);

module.exports = router;