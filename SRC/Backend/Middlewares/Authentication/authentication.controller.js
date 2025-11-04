//Importaciones de dependencias
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = async (req, res, next) => {
    //Extraer el token del encabezado de autorizacion
  const token = req.headers.authorization?.split(' ')[1];

  //Si no hay token, devolver error 400
  if (!token) {
      return res.status(400).send('Token requerido');
  }

  //Verificar y decodificar el token
  try {
      //Verificacion del token con la clave secreta
      const decodificado = jwt.verify(token, process.env.PASSWORD_SECRET);
      //Asignar el usuario decodificado a la solicitud en req.usuario
      req.usuario = decodificado;
      //Continuar al siguiente middleware o ruta
      return next();
  } catch (error) {
     //Si el token no es valido, devolver error 500
      return res.status(500).send('Token inválido');
  }
};

module.exports = authenticateToken;
