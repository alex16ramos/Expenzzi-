// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const monedaController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js');

//Obtener último cambio o el de una fecha específica
monedaController.getCambio = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const { fecha } = req.query;

    // Verificación de acceso a la interfaz
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    let query = '';
    let values = [idinterfazoperacion];
    let message = '';

    if (fecha) {
      // Si se pasa una fecha → devolver el cambio de esa fecha exacta
      query = `
        SELECT 
          c.idcambio,
          c.fecha,
          c.cambioyousd AS "cambioYoUSD",
          c.cambioyousuy AS "cambioYoUYU",
          c.cambiousdars AS "cambioUSDARS",
          c.cambiousduyu AS "cambioUSDUYU",
          c.cambiarsuyu AS "cambioARSUYU",
          c.cambiarsusd AS "cambioARSUSD"
        FROM cambio c
        WHERE c.idinterfazoperacion = $1 AND c.fecha = $2
        ORDER BY c.fecha DESC
        LIMIT 1;
      `;
      values.push(new Date(fecha).toISOString());
      message = `Cambio correspondiente a la fecha ${fecha}`;
    } else {
      // Si no se pasa fecha → devolver el último cambio registrado
      query = `
        SELECT 
          c.idcambio,
          c.fecha,
          c.cambioyousd AS "cambioYoUSD",
          c.cambioyousuy AS "cambioYoUYU",
          c.cambiousdars AS "cambioUSDARS",
          c.cambiousduyu AS "cambioUSDUYU",
          c.cambiarsuyu AS "cambioARSUYU",
          c.cambiarsusd AS "cambioARSUSD"
        FROM cambio c
        WHERE c.idinterfazoperacion = $1
        ORDER BY c.fecha DESC
        LIMIT 1;
      `;
      message = 'Último cambio registrado';
    }

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontró un registro de cambio para los criterios especificados.' });
    }

    res.status(200).json({
      message,
      cambio: result.rows[0]
    });

  } catch (err) {
    next(err);
  }
};

module.exports = monedaController;
