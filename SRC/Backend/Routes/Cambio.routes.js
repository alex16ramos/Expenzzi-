//Importacion de dependencias
const express = require('express');
const router = express.Router();
const cambioService = require('../Services/Cambio.Service.js');

//Rutas para manejar los cambios
router.get(`/cambio/`,  cambioService.getCambio);

module.exports = router;