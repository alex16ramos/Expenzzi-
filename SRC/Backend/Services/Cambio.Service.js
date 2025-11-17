// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const cambioService = {};

//Obtener último cambio o el de una fecha específica
cambioService.getCambio = async (req, res, next) => {
  try {
    const { fecha } = req.query;

    let query = '';
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
        WHERE c.fecha = $2
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

module.exports = cambioService;
