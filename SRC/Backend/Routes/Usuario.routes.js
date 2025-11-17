//Importaciones de dependencias
const express = require('express');
const router = express.Router();
const usuarioService = require ('../Services/Usuario.Service.js');

//Rutas de usuario
router.post(`/registrosesion`, usuarioService.register );

router.post(`/iniciosesion`, usuarioService.login);

module.exports = router;