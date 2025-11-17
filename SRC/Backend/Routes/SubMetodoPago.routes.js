//Importacion de dependencias
const express = require('express');
const router = express.Router();
const submetodopagoService = require('../Services/SubMetodoPago.Service.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.Service.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los submetodos de pago
router.get(`/submetodopago/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, submetodopagoService.getSubMetodosPago);

router.get(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoService.getSubMetodoPagoByID);

router.post(`/submetodopago/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, submetodopagoService.createSubMetodoPago);

router.put(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoService.updateSubMetodoPago);

router.delete(`/submetodopago/:idinterfazoperacion/:idsubmetodopago`, verifyIDInterfazOperacion,authenticateToken, submetodopagoService.deleteSubMetodoPago);

module.exports = router;