//Importacion de dependencias
const express = require('express');
const router = express.Router();
const categoriaController = require('../Controllers/Categoria.controller.js');
const authenticateToken = require('../Middlewares/Authentication/authentication.controller.js');
const verifyIDInterfazOperacion = require('../Middlewares/Verification/verifyIDInterfazOperacion.js');

//Rutas para manejar los categorias
router.get(`/categoria/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, categoriaController.getCategorias);

router.get(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaController.getCategoriaByID);

router.post(`/categoria/:idinterfazoperacion`, verifyIDInterfazOperacion,authenticateToken, categoriaController.createCategoria);

router.put(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaController.updateCategoria);

router.delete(`/categoria/:idinterfazoperacion/:idcategoria`, verifyIDInterfazOperacion,authenticateToken, categoriaController.deleteCategoria);

//Rutas para manejar los limites de categorias
router.put('/categoria/:idinterfazoperacion/:idcategoria/limite', verifyIDInterfazOperacion, authenticateToken, categoriaController.setLimiteCategoria);

router.put('/categoria/:idinterfazoperacion/:idcategoria/remover-limite', verifyIDInterfazOperacion, authenticateToken, categoriaController.removeLimiteCategoria );

module.exports = router;