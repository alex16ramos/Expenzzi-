//Importacion de dependencias
const express = require('express');
const router = express.Router();
const categoriaService = require('../Services/Categoria.Service.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.Service.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los categorias
router.get(`/categoria/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, categoriaService.getCategorias);

router.get(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaService.getCategoriaByID);

router.post(`/categoria/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, categoriaService.createCategoria);

router.put(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaService.updateCategoria);

router.delete(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaService.deleteCategoria);

//Rutas para manejar los limites de categorias
router.put('/categoria/:idinterfazoperacion/:idcategoria/limite', verifyIDInterfazOperacion, authenticateToken, categoriaService.setLimiteCategoria);

router.put('/categoria/:idinterfazoperacion/:idcategoria/deletelimite', verifyIDInterfazOperacion, authenticateToken, categoriaService.deleteLimiteCategoria );

module.exports = router;