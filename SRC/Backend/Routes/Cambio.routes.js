//Importacion de dependencias
const express = require('express');
const router = express.Router();
const cambioController = require('../Controllers/Cambio.controller.js');

//Rutas para manejar los cambios
router.get(`/cambio/`,  cambioController.getCambio);

module.exports = router;