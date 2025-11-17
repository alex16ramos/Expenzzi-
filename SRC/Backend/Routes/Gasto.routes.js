//Importacion de dependencias
const express = require('express');
const router = express.Router();
const gastoService = require('../Services/Gasto.Service.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.Service.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los gastos
router.get(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, gastoService.getGastos);

router.get(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoService.getGastobyID);

router.post(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, gastoService.createGasto);

router.put(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoService.updateGasto);

router.delete(`/gasto/:idinterfazoperacion/:idgasto`, verifyIDInterfazOperacion,authenticateToken, gastoService.deleteGasto);

//Rutas para manejar HISTORIAL GASTO
router.get('/gasto/:idinterfazoperacion/:idgasto/historial', verifyIDInterfazOperacion, authenticateToken, gastoService.getHistorialGasto);

router.get('/gasto/:idinterfazoperacion/historial/:idhistorialgasto', verifyIDInterfazOperacion, authenticateToken, gastoService.getHistorialGastoByID);

module.exports = router;