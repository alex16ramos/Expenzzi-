//Importacion de dependencias
const express = require('express');
const router = express.Router();
const ingresoService = require('../Services/Ingreso.Service.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.Service.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas de INGRESO
router.get(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoService.getIngresos);

router.get(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoService.getIngresobyID);

router.post(`/ingreso/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, ingresoService.createIngreso);

router.put(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoService.updateIngreso);

router.delete(`/ingreso/:idinterfazoperacion/:idingreso`, verifyIDInterfazOperacion,authenticateToken, ingresoService.deleteIngreso);

//Rutas para manejar HISTORIAL INGRESO
router.get('/ingreso/:idinterfazoperacion/:idingreso/historial', verifyIDInterfazOperacion, authenticateToken, ingresoService.getHistorialIngreso);

router.get('/ingreso/:idinterfazoperacion/historial/:idhistorialingreso', verifyIDInterfazOperacion, authenticateToken, ingresoService.getHistorialIngresoByID);

module.exports = router;