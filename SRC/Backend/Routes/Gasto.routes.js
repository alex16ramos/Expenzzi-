//Importacion de dependencias
const express = require('express');
const router = express.Router();
const gastoController = require('../Controllers/Gasto.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los gastos
router.get(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, gastoController.getGastos);

router.get(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoController.getGastobyID);

router.post(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, gastoController.createGasto);

router.put(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoController.updateGasto);

router.delete(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoController.deleteGasto);

module.exports = router;