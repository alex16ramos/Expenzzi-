// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const ahorroController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js');
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');

// Obtener todos los ahorros (con filtros y paginación)
ahorroController.getAhorros = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    // Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    // Filtros opcionales
    const {
      estado,
      moneda,
      comentario,
      fechaDesde,
      fechaHasta,
      montoMin,
      montoMax,
      monedaFiltro,
      periodoaporte,
      offset = 0,
      limit = 10,
    } = req.query;

    let filters = [];
    let values = [idinterfazoperacion];

    // Construcción de filtros dinámicos
    const buildFilter = (queryParam, alias) => {
      if (queryParam) {
        const terms = queryParam
          .split(/, | ,|,/)
          .map(term => term.trim().toLowerCase())
          .filter(term => term.length > 0);
        if (terms.length) {
          const conditions = terms
            .map((_, i) => `LOWER(${alias}) ILIKE $${values.length + 1 + i}`)
            .join(' OR ');
          filters.push(`(${conditions})`);
          values.push(...terms.map(term => `%${term}%`));
        }
      }
    };

    // Filtros dinámicos
    if (estado) {
      filters.push(`(a.estado = $${values.length + 1})`);
      values.push(estado);
    }

    buildFilter(comentario, 'a.comentario');

    if (moneda) {
      filters.push(`a.moneda = $${values.length + 1}`);
      values.push(moneda);
    }

    if (periodoaporte) {
      filters.push(`a.periodoaporte = $${values.length + 1}`);
      values.push(periodoaporte);
    }

    // Filtros por rango de fechas
    if (fechaDesde) {
      filters.push(`a.fechadesde >= $${values.length + 1}`);
      values.push(new Date(fechaDesde).toISOString());
    }
    if (fechaHasta) {
      filters.push(`a.fechahasta <= $${values.length + 1}`);
      values.push(new Date(fechaHasta).toISOString());
    }

    // Validación de montoMin y montoMax
    let montoMinValid = parseFloat(montoMin);
    let montoMaxValid = parseFloat(montoMax);

    if (!isNaN(montoMinValid) && !isNaN(montoMaxValid) && montoMinValid > montoMaxValid) {
      [montoMinValid, montoMaxValid] = [montoMaxValid, montoMinValid];
    }

    // Filtros por valores monetarios
    if (!isNaN(montoMinValid) && monedaFiltro) {
      filters.push(`(a.importes).importe${monedaFiltro.toLowerCase()} >= $${values.length + 1}`);
      values.push(montoMinValid);
    }
    if (!isNaN(montoMaxValid) && monedaFiltro) {
      filters.push(`(a.importes).importe${monedaFiltro.toLowerCase()} <= $${values.length + 1}`);
      values.push(montoMaxValid);
    }

    // Consulta SQL
    const query = `
      SELECT a.idahorro,
             a.fechadesde,
             a.fechahasta,
             a.moneda,
             a.importe,
             a.comentario,
             a.periodoaporte AS "periodoAporte",
            (a.importes).importeARS AS "ARS",
            (a.importes).importeUSD AS "USD",
            (a.importes).importeUYU AS "UYU",
             a.estado
      FROM ahorro a
      WHERE a.idinterfazoperacion = $1
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY a.fechadesde DESC
      OFFSET $${values.length + 1} ROWS FETCH FIRST $${values.length + 2} ROWS ONLY;
    `;

    // Agregar offset y limit a los valores
    values.push(offset, limit);
    // Ejecucion de la consulta
    const result = await pool.query(query, values);

    // Devolucion del resultado
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Obtener ahorro por ID
ahorroController.getAhorroByID = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idahorro, idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const result = await pool.query(`
      SELECT a.idahorro,
             a.fechadesde,
             a.fechahasta,
             a.moneda,
             a.importe,
             a.comentario,
             a.periodoaporte AS "periodoAporte",
            (a.importes).importeARS AS "ARS",
            (a.importes).importeUSD AS "USD",
            (a.importes).importeUYU AS "UYU",
             a.estado
      FROM ahorro a
      WHERE a.idinterfazoperacion = $1 AND a.idahorro = $2
    `, [idinterfazoperacion, idahorro]);
    //Si no se encuentra el gasto, retornar 404
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ahorro no encontrado' });
    }
    //Caso contrario, retornar el ahorro
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Crear nuevo ahorro
ahorroController.createAhorro = async (req, res, next) => {
  try {
    //Parametros requeridos para la creacion
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para crear un ahorro
    const allowedRoles = ['Administrador'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Parametros del cuerpo de la solicitud para la creacion del ahorro
    const { fechadesde, fechahasta, moneda, importe, comentario, periodoaporte } = req.body;

    //Insert para la creacion del ahorro
    const newAhorro = await pool.query(`
      INSERT INTO ahorro (fechadesde, fechahasta, moneda, importe, comentario, periodoaporte, idinterfazoperacion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [fechadesde, fechahasta, moneda, importe, comentario, periodoaporte, idinterfazoperacion]);

    //Devolucion del nuevo ahorro nuevo 
    res.status(201).json(newAhorro.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Actualizar ahorro
ahorroController.updateAhorro = async (req, res, next) => {
  try {
     //Parametros requeridos para la actualizacion
    const { idinterfazoperacion, idahorro } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para actualizar un gasto
    const allowedRoles = ['Administrador'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Parametros del cuerpo de la solicitud para la actualizacion del ahorro
    const { fechadesde, fechahasta, moneda, importe, comentario, periodoaporte } = req.body;

    //Update para la actualizacion del ahorro mediante el idahorro
    const updateAhorro = await pool.query(`
      UPDATE ahorro
      SET fechadesde = $1,
          fechahasta = $2,
          moneda = $3,
          importe = $4,
          comentario = $5,
          periodoaporte = $6,
          estado = true
      WHERE idahorro = $7 AND idinterfazoperacion = $8
      RETURNING *
    `, [fechadesde, fechahasta, moneda, importe, comentario, periodoaporte, idahorro, idinterfazoperacion]);

    //Si no se encuentra el ahorro a actualizar, retornar 404
    if (updateAhorro.rows.length === 0) {
      return res.status(404).json({ message: 'Ahorro no encontrado' });
    }

    //Devolucion del ahorro actualizado
    res.json(updateAhorro.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Eliminar ahorro (borrado lógico)
ahorroController.deleteAhorro = async (req, res, next) => {
  try {
    //Parametros requeridos para la eliminacion
    const { idinterfazoperacion, idahorro } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para eliminar un ahorro
    const allowedRoles = ['Administrador'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Delete logico para cambiar el estado del ahorro a false
    const deleteAhorro = await pool.query(`
      UPDATE ahorro
      SET estado = not(estado)
      WHERE idahorro = $1 AND idinterfazoperacion = $2
      RETURNING *
    `, [idahorro, idinterfazoperacion]);

    //Si no se encuentra el ahorro a eliminar, retornar 404
    if (deleteAhorro.rows.length === 0) {
      return res.status(404).json({ message: 'Ahorro no encontrado.' });
    }

    //Devolucion de existo sin contenido
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

module.exports = ahorroController;
