//Importacion de dependencias
const express = require('express');
const router = express.Router();
const gastoController = require('../Controllers/Gasto.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los gastos
router.get(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion, gastoController.getGastos);

router.get(`/gasto/:idinterfazoperacion/:idusuario`, verifyIDInterfazOperacion, gastoController.getGastobyID);

router.post(`/gasto/:idinterfazoperacion`, verifyIDInterfazOperacion, gastoController.createGasto);

router.put(`/gasto/:idinterfazoperacion/:idusuario`, verifyIDInterfazOperacion, gastoController.updateGasto);

router.delete(`/gasto/:idinterfazoperacion/:idusuario`, verifyIDInterfazOperacion, gastoController.deleteGasto);

module.exports = router;