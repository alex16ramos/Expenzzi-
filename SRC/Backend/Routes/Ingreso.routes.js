//Importacion de dependencias
const express = require('express');
const router = express.Router();
const ingresoController = require('../Controllers/Ingreso.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas de INGRESO
router.get(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoController.getIngresos);

router.get(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.getIngresobyID);

router.post(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoController.createIngreso);

router.put(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.updateIngreso);

router.delete(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.deleteIngreso);

//Rutas para manejar HISTORIAL INGRESO
router.get('/ingreso/:idinterfazoperacion/:idingreso/historial', verifyIDInterfazOperacion, authenticateToken, ingresoController.getHistorialIngreso);

router.get('/ingreso/:idinterfazoperacion/historial/:idhistorialingreso', verifyIDInterfazOperacion, authenticateToken, ingresoController.getHistorialIngresoByID);

module.exports = router;