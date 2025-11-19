const fs = require('fs');
const path = require('path');

//Funcion para cargar todas las rutas automaticamente
//Esta funcion lee todos los archivos .routes.js en el directorio actual (excepto este archivo loadRoutes.js)
function loadRoutes(app) {
  const routesPath = path.join(__dirname);
  fs.readdirSync(routesPath)
    .filter(file => file !== 'loadRoutes.js' && file.endsWith('.routes.js'))
    .forEach(file => {
      const route = require(path.join(routesPath, file));
      app.use(route); // Automatically register the routes
    });
}

module.exports = loadRoutes;
