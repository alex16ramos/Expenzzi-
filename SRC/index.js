const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const loadRoutes = require('../SRC/Backend/Routes/loadRoutes.js');
require('dotenv').config();
const port = process.env.PORT || 3000

const app = express()

// Middlewares
app.use(cors())
app.use(morgan('tiny', {
  skip: (req, res) => res.statusCode < 400
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Routes
app.get(`/`, (req, res) => {
  res.json({ message: `Hola mundo!` })
})

loadRoutes(app);

// handling errors
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err.stack);
  res.status(500).json( err.message );
});

//require('./Backend/cronjobs');

app.listen(port, () => {
  console.log(`Server on port ${port}`)
})