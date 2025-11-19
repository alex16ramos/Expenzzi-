//Importacion de dependencias
const express = require('express');
const router = express.Router();
const submetodopagoController = require('../Controllers/SubMetodoPago.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los submetodos de pago
router.get(`/submetodopago/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, submetodopagoController.getSubMetodosPago);

router.get(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoController.getSubMetodoPagoByID);

router.post(`/submetodopago/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, submetodopagoController.createSubMetodoPago);

router.put(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoController.updateSubMetodoPago);

router.delete(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoController.deleteSubMetodoPago);

module.exports = router;