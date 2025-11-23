
const express = require('express');
const router = express.Router();
const { StateController } = require('../controllers/stateController');

// Rota GET: Baixa o estado completo do banco para o Frontend
router.get('/', StateController.getState);

// Rota POST: Recebe o estado do Frontend (opcional, para persistência em lote)
router.post('/', StateController.saveState);

module.exports = router;
