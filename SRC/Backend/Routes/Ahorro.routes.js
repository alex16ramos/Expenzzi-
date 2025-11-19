//Importacion de dependencias
const express = require('express');
const router = express.Router();
const ahorroController = require('../Controllers/Ahorro.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los ahorros
router.get(`/ahorro/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ahorroController.getAhorros);

router.get(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroController.getAhorroByID);

router.post(`/ahorro/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ahorroController.createAhorro);

router.put(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroController.updateAhorro);

router.delete(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroController.deleteAhorro);

module.exports = router;