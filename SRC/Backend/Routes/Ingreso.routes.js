//Importacion de dependencias
const express = require('express');
const router = express.Router();
const ingresoController = require('../Controllers/Ingreso.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los gastos
router.get(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoController.getIngresos);

router.get(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.getIngresobyID);

router.post(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoController.createIngreso);

router.put(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.updateIngreso);

router.delete(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoController.deleteIngreso);

module.exports = router;