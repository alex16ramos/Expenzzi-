//Importacion de dependencias
const express = require('express');
const router = express.Router();
const ahorroService = require('../Services/Ahorro.Service.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.Service.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los ahorros
router.get(`/ahorro/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ahorroService.getAhorros);

router.get(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroService.getAhorroByID);

router.post(`/ahorro/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ahorroService.createAhorro);

router.put(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroService.updateAhorro);

router.delete(`/ahorro/:idinterfazoperacion/:idahorro`, verifyIDInterfazOperacion,authenticateToken, ahorroService.deleteAhorro);

//Rutas para manejar HISTORIAL AHORRO 
router.get('/ahorro/:idinterfazoperacion/:idahorro/historial', verifyIDInterfazOperacion, authenticateToken, ahorroService.getHistorialAhorro);

router.get('/ahorro/:idinterfazoperacion/historial/:idhistorialahorro', verifyIDInterfazOperacion, authenticateToken, ahorroService.getHistorialAhorroByID);

module.exports = router;