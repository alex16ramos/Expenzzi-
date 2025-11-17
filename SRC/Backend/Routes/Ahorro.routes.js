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

//Rutas para manejar HISTORIAL AHORRO 
router.get('/ahorro/:idinterfazoperacion/:idahorro/historial', verifyIDInterfazOperacion, authenticateToken, ahorroController.getHistorialAhorro);

router.get('/ahorro/:idinterfazoperacion/historial/:idhistorialahorro', verifyIDInterfazOperacion, authenticateToken, ahorroController.getHistorialAhorroByID);

module.exports = router;