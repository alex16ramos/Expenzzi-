//Importaciones de dependencias
const express = require('express');
const router = express.Router();
const usuarioController = require ('../Controllers/Usuario.controller.js');

//Rutas de usuario
router.post(`/registrosesion`, usuarioController.register );

router.post(`/iniciosesion`, usuarioController.login);

module.exports = router;