//Para ejecutar localmente: node SRC/index.js
//Se abre en el puerto 3000

//Importacion de dependencias
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const loadRoutes = require('../SRC/Backend/Routes/loadRoutes.js');
require('dotenv').config();

//Definicion del puerto a utilizar
const port = process.env.PORT || 3000
//Creacion de la aplicacion express
const app = express()

//Middlewares globales
app.use(cors())
app.use(morgan('tiny', {
  skip: (req, res) => res.statusCode < 400
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

//Routes
//Ruta base de la pagina
app.get(`/`, (req, res) => {
  res.json({ message: `Hola mundo!` })
})
//Cargar todas las rutas automaticamente
loadRoutes(app);

//Manejo de errores global
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);
  res.status(500).json( err.message );
});

//Cronjobs
//require('./Backend/cronjobs');

//Iniciar el servidor
app.listen(port, () => {
  console.log(`Server on port ${port}`)
})