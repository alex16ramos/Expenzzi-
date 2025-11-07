// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const ingresoController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js');
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');

// ✅ Obtener todos los ingresos (con filtros y paginación)
ingresoController.getIngresos = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const {
      estado,
      responsableIngreso,
      moneda,
      comentario,
      fechaDesde,
      fechaHasta,
      montoMin,
      montoMax,
      monedaFiltro,
      offset = 0,
      limit = 10,
    } = req.query;

    let filters = [];
    let values = [idinterfazoperacion];

    // Filtro dinámico
    const buildFilter = (queryParam, alias) => {
      if (queryParam) {
        const terms = queryParam
          .split(/, | ,|,/) // Dividir por ", ", " ," o ","
          .map(term => term.trim().toLowerCase()) // Normalizar a minúsculas
          .filter(term => term.length > 0); // Filtrar vacíos

        if (terms.length) {
          const conditions = terms
            .map((_, i) => `LOWER(${alias}) ILIKE $${values.length + 1 + i}`)
            .join(' OR '); // Construir condiciones con OR
          filters.push(`(${conditions})`);
          values.push(...terms.map(term => `%${term}%`));
        }
      }
    };

   // Filtros dinámicos 
    if (estado) {
      filters.push(`(i.estado = $${values.length + 1})`);
      values.push(estado);
    }

    buildFilter(comentario, 'i.comentario');

    if (moneda) {
      filters.push(`i.moneda = $${values.length + 1}`);
      values.push(moneda);
    }

    if (responsableIngreso) {
      filters.push(`i.responsableingreso = $${values.length + 1}`);
      values.push(responsableIngreso);
    }

    // Fechas
    if (fechaDesde) {
      filters.push(`i.fecha >= $${values.length + 1}`);
      values.push(new Date(fechaDesde).toISOString());
    }
    if (fechaHasta) {
      filters.push(`i.fecha <= $${values.length + 1}`);
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
      filters.push(`(i.importes).importe${ monedaFiltro.toLowerCase()} >= $${values.length + 1}`);
      values.push(montoMinValid);
    }
    if (!isNaN(montoMaxValid) && monedaFiltro) {
      filters.push(`(i.importes).importe${ monedaFiltro.toLowerCase()} <= $${values.length + 1}`);
      values.push(montoMaxValid);
    }

    // Consulta SQL
    const query = `
      SELECT i.idingreso,
             i.fecha,
             i.responsableingreso AS "responsableIngreso",
             i.moneda,
             i.importe,
             i.comentario,
             (i.importes).importeARS AS "ARS",
             (i.importes).importeUSD AS "USD",
             (i.importes).importeUYU AS "UYU",
             i.estado
      FROM ingreso i
      WHERE i.idinterfazoperacion = $1
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY i.fecha DESC
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

// ✅ Obtener ingreso por ID
ingresoController.getIngresobyID = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idingreso, idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Consulta SQL para obtener el gasto por ID
    const result = await pool.query(`
      SELECT i.idingreso,
             i.fecha,
             i.responsableingreso AS "responsableIngreso",
             i.moneda,
             i.importe,
             i.comentario,
             (i.importes).importeARS AS "ARS",
             (i.importes).importeUSD AS "USD",
             (i.importes).importeUYU AS "UYU",
             i.estado
      FROM ingreso i
      WHERE i.idinterfazoperacion = $1 AND i.idingreso = $2
    `, [idinterfazoperacion, idingreso]);
    //Si no se encuentra el ingreso, retornar 404
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }
    //Caso contrario, retornar el ingreso
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Crear ingreso
ingresoController.createIngreso = async (req, res, next) => {
  try {
     //Parametros requeridos para la creacion
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para crear un ingreso
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }
    
    //Parametros del cuerpo de la solicitud para la creacion del ingreso
    const { fecha, responsableingreso, moneda, importe, comentario } = req.body;

    //Insert para la creacion del gasto
    const newIngreso = await pool.query(`
      INSERT INTO ingreso (fecha, responsableingreso, moneda, importe, comentario, idinterfazoperacion, responsableingresaringreso)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [fecha, responsableingreso, moneda, importe, comentario, idinterfazoperacion, req.usuario.idusuario]);

    //Devolucion del nuevo gasto creado
    res.status(201).json(newIngreso.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Actualizar ingreso
ingresoController.updateIngreso = async (req, res, next) => {
  try {
    //Parametros requeridos para la actualizacion
    const { idinterfazoperacion, idingreso } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para actualizar un gasto
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Obtenemos el ingreso actual
    const ingresoActual = await pool.query(`
      SELECT * FROM ingreso 
      WHERE idingreso = $1 AND idinterfazoperacion = $2
    `, [idingreso, idinterfazoperacion]);

    if (ingresoActual.rows.length === 0) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    const ingresoAnterior = ingresoActual.rows[0];

  
    //Parametros del cuerpo de la solicitud para la actualizacion del ingreso
    const { fecha, responsableingreso, moneda, importe, comentario } = req.body;

    //Update para la actualizacion del ingreso mediante el idingreso
    const updateIngreso = await pool.query(`
      UPDATE ingreso
      SET fecha = $1,
          responsableingreso = $2,
          moneda = $3,
          importe = $4,
          comentario = $5,
          estado = true
      WHERE idingreso = $6 AND idinterfazoperacion = $7
      RETURNING *
    `, [fecha, responsableingreso, moneda, importe, comentario, idingreso, idinterfazoperacion]);

    //Si no se encuentra el ingreso a actualizar, retornar 404
    if (updateIngreso.rows.length === 0) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    //Devolucion del gasto actualizado
    res.json(updateIngreso.rows[0]);

    // Se registra el historial luego de actualizar
    await pool.query(`
    INSERT INTO historialingreso (fechacambio, responsablecambio, ant, comentarioant, idingreso)
    VALUES (NOW(), $1, ROW($2, $3), $4, $5)`, 
    [req.usuario.idusuario, ingresoAnterior.importe, ingresoAnterior.moneda, 
    ingresoAnterior.comentario || null, ingresoAnterior.idingreso]);

  } catch (err) {
    next(err);
  }
};

// Eliminar ingreso (cambiar estado a false)
ingresoController.deleteIngreso = async (req, res, next) => {
  try {
    //Parametros requeridos para la eliminacion
    const { idinterfazoperacion, idingreso } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para eliminar un ingreso
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    // ✅ Obtenemos el ingreso actual antes de modificarlo
    const ingresoActual = await pool.query(`
      SELECT * FROM ingreso 
      WHERE idingreso = $1 AND idinterfazoperacion = $2
    `, [idingreso, idinterfazoperacion]);

    if (ingresoActual.rows.length === 0) {
      return res.status(404).json({ message: 'Ingreso no encontrado' });
    }

    const ingresoAnterior = ingresoActual.rows[0];

    //Delete logico para cambiar el estado del gasto a false
    const deleteIngreso = await pool.query(`
      UPDATE ingreso
      SET estado = not(estado)
      WHERE idingreso = $1 AND idinterfazoperacion = $2
      RETURNING *
    `, [idingreso, idinterfazoperacion]);

    //Si no se encuentra el ingreso a eliminar, retornar 404
    if (deleteIngreso.rows.length === 0) {
      return res.status(404).json({ message: 'Ingreso no encontrado.' });
    }
    
    await pool.query(`
      INSERT INTO historialingreso (fechacambio, responsablecambio, ant, comentarioant, idingreso)
      VALUES (NOW(), $1, ROW($2, $3), $4, $5)`, 
      [
      req.usuario.idusuario,                // responsable del cambio
      ingresoAnterior.importe,              // ant.importe
      ingresoAnterior.moneda,               // ant.moneda
      ingresoAnterior.comentario || null,   // comentario anterior
      ingresoAnterior.idingreso             // FK ingreso
    ]);

    //Devolucion de exito sin contenido
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

//Obtener historial de un ingreso
ingresoController.getHistorialIngreso = async (req, res, next) => {
  try {
    //Parámetros requeridos
    const { idinterfazoperacion, idingreso } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Filtros opcionales
    const { fechaDesde, fechaHasta } = req.query;
    let filters = [];
    let values = [idingreso];

    //Filtros por rango de fechas
    if (fechaDesde) {
      filters.push(`h.fechacambio >= $${values.length + 1}`);
      values.push(new Date(fechaDesde).toISOString());
    }
    if (fechaHasta) {
      filters.push(`h.fechacambio <= $${values.length + 1}`);
      values.push(new Date(fechaHasta).toISOString());
    }

    //Consulta SQL
    const query = `
      SELECT 
        h.idhistorialingreso,
        h.fechacambio,
        h.responsablecambio,
        (h.ant).importe AS importe_anterior,
        (h.ant).moneda AS moneda_anterior,
        h.comentarioant,
        h.idingreso
      FROM historialingreso h
      JOIN ingreso i ON i.idingreso = h.idingreso
      WHERE i.idingreso = $1
        AND i.idinterfazoperacion = $${values.length + 1}
        ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY h.fechacambio DESC;
    `;

    //Agregar idinterfazoperacion al final de los valores
    values.push(idinterfazoperacion);

    //Ejecutar consulta
    const result = await pool.query(query, values);

    //Si no hay resultados
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No hay historial registrado para este ingreso.' });
    }

    // Devolver resultados
    res.status(200).json(result.rows);

  } catch (err) {
    next(err);
  }
};

// Obtener historial de ingreso por ID
ingresoController.getHistorialIngresoByID = async (req, res, next) => {
  try {
    // Parámetros requeridos
    const { idinterfazoperacion, idhistorialingreso } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    // Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    // Consulta SQL
    const result = await pool.query(`
      SELECT 
        h.idhistorialingreso,
        h.fechacambio,
        h.responsablecambio,
        (h.ant).importe AS importe_anterior,
        (h.ant).moneda AS moneda_anterior,
        h.comentarioant,
        h.idingreso
      FROM historialingreso h
      JOIN ingreso i ON i.idingreso = h.idingreso
      WHERE i.idinterfazoperacion = $1 AND h.idhistorialingreso = $2;
    `, [idinterfazoperacion, idhistorialingreso]);

    // Si no se encuentra el historial
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Historial no encontrado' });
    }

    // Devolver resultado
    res.status(200).json(result.rows[0]);

  } catch (err) {
    next(err);
  }
};


module.exports = ingresoController;
