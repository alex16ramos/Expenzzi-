//Importacion de dependencias
const express = require('express');
const router = express.Router();
const interfazoperacionController = require ('../Controllers/InterfazOperacion.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar las interfaces de operacion
//Ruta para obtener todas las interfaces de operacion por idusuario
router.get(`/interfazoperacion/allinterfazoperacionbyidusuario/:idusuario`, authenticateToken, interfazoperacionController.getAllInterfazOperacionbyIdUsuario);
//Ruta para obtener todos los usuarios que tienen acceso a una interfaz de operacion mediante idinterfazoperacion
router.get(`/interfazoperacion/allusuariosbyidinterfazoperacion/:idinterfazoperacion`,verifyIDInterfazOperacion, authenticateToken, interfazoperacionController.getUsuariosByIdInterfazOperacion);

router.post(`/interfazoperacion/`, authenticateToken, interfazoperacionController.createInterfazOperacion);

router.put(`/interfazoperacion/:idinterfazoperacion`, authenticateToken, interfazoperacionController.updateInterfazOperacion);

router.delete(`/interfazoperacion/:idinterfazoperacion`, authenticateToken, interfazoperacionController.deleteInterfazOperacion);

//Rutas para manejar invitaciones de usuarios a interfaces de operacion
//Ruta para unirse a una interfaz de operacion mediante un codigo de invitacion
router.post(`/interfazoperacion/codigoinvitacion/:codigoinvitacion`, authenticateToken, interfazoperacionController.unirseInterfazOperacion);
//Ruta para salirse de una interfaz de operacion mediante un codigo de invitacion
router.delete(`/interfazoperacion/codigoinvitacion/:idinterfazoperacion`, authenticateToken, interfazoperacionController.salirseInterfazOperacion);


module.exports = router;