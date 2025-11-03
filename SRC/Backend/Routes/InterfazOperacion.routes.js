//Importacion de dependencias
const express = require('express');
const router = express.Router();
const interfazoperacionController = require ('../Controllers/InterfazOperacion.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar las interfaces de operacion
//Ruta para obtener todas las interfaces de operacion por idusuario
router.get(`/interfazoperacion/allinterfazoperacionbyidusuario/:idusuario`, interfazoperacionController.getAllInterfazOperacionbyIdUsuario);
//Ruta para obtener todos los usuarios que tienen acceso a una interfaz de operacion mediante idinterfazoperacion
router.get(`/interfazoperacion/allusuariosbyidinterfazoperacion/:idinterfazoperacion`,verifyIDInterfazOperacion, interfazoperacionController.getUsuariosByIdInterfazOperacion);

router.post(`/interfazoperacion/`, interfazoperacionController.createInterfazOperacion);

router.put(`/interfazoperacion/:idinterfazoperacion`, interfazoperacionController.updateInterfazOperacion);

router.delete(`/interfazoperacion/:idinterfazoperacion`, interfazoperacionController.deleteInterfazOperacion);

module.exports = router;