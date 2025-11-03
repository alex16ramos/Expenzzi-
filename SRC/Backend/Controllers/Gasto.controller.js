//Importacion de dependencias
const pool = require('../DB/dbConnection.js');
const gastoController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js')
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');


//Obtener todos los gastos
//Filtrado por estado, categoria, responsableGasto, moneda, metodopago, submetodopago, comentario, rango de fechas, montoMin, montoMax, monedaFiltro del montoMin y montoMax
//Paginacion con offset y limit
gastoController.getGastos = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Definicion de filtros opcionales
    const {
      estado,
      categoria,
      responsableGasto,
      moneda,
      metodopago,
      submetodopago,
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

    //Construccion del filtrado dinamico
    const buildFilter = (field, queryParam, alias) => {
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
      filters.push(`(g.nombre = $${values.length + 1})`);
      values.push(estado);
    }

    buildFilter('categoria', categoria, 'c.nombre');
    buildFilter('responsable', responsableGasto, 'g.responsableGasto');
    buildFilter('moneda', moneda, 'g.moneda');
    buildFilter('metodopago', metodopago, 'smp.metodo');
    buildFilter('submetodopago', submetodopago, 'smp.nombre');
    buildFilter('comentario', comentario, 'g.comentario');

    // Filtros por rango de fechas
    if (fechaDesde) {
      filters.push(`g.fecha >= $${values.length + 1}`);
      values.push(new Date(fechaDesde).toISOString());
    }
    if (fechaHasta) {
      filters.push(`g.fecha <= $${values.length + 1}`);
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
      filters.push(`g.importes${`importe`,monedaFiltro.toLowerCase()} >= $${values.length + 1}`);
      values.push(montoMinValid);
    }
    if (!isNaN(montoMaxValid) && monedaFiltro) {
      filters.push(`g.importes${`importe`,monedaFiltro.toLowerCase()} <= $${values.length + 1}`);
      values.push(montoMaxValid);
    }

    // Consulta SQL construida dinámicamente
    const query = `
      SELECT g.id,
        g.fecha,
        g.responsablegasto as "responsableGasto",
        g.moneda as "monedamonto",
        g.importe as "importe",
        g.comentario,
        g.importes(importeARS) as "ARG",
        g.importes(importeUSD) as "USD",
        g.importes(importeUYU) as "UYU",
        g.responsableingresargasto as "responsableIngresarGasto",
        g.estado,
        c.nombre as "categoria",
        c.idcategoria as "idcategoria",
        smp.nombre as "submetododepago",
        smp.metodo as "metodopago",
        smp.idsubmetodopago as "idsubmetodopago"
      FROM categoria c
      RIGHT JOIN gasto g ON c.idcategoria = g.idcategoria
      LEFT JOIN submetodopago smp ON smp.idsubmetodopago = g.idsubmetodopago
      WHERE c.idinterfazoperacion = $1
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY g.fecha DESC
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

//Obtener gasto por ID
gastoController.getGastobyID = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idgasto } = req.params;
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Consulta SQL para obtener el gasto por ID
    const result = await pool.query(`
    SELECT g.id,
        g.fecha,
        g.responsablegasto as "responsableGasto",
        g.moneda as "monedamonto",
        g.importe as "importe",
        g.comentario,
        g.importes(importeARS) as "ARG",
        g.importes(importeUSD) as "USD",
        g.importes(importeUYU) as "UYU",
        g.responsableingresargasto as "responsableIngresarGasto",
        g.estado,
        c.nombre as "categoria",
        c.idcategoria as "idcategoria",
        smp.nombre as "submetododepago",
        smp.metodo as "metodopago",
        smp.idsubmetodopago as "idsubmetodopago"
      FROM categoria c
      RIGHT JOIN gasto g ON c.idcategoria = g.idcategoria
      LEFT JOIN submetodopago smp ON smp.idsubmetodopago = g.idsubmetodopago
      WHERE c.idinterfazoperacion = $1 and g.idgasto = $2
      `, [idinterfazoperacion, idgasto]);
    //Si no se encuentra el gasto, retornar 404
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Gasto not found" });
    }
    //Caso contrario, retornar el gasto
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

//Crear nuevo gasto
gastoController.createGasto = async (req, res, next) => {
  try {
    //Parametros requeridos para la creacion
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para crear un gasto
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Parametros del cuerpo de la solicitud para la creacion del gasto
    const { fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago } = req.body;

    //Insert para la creacion del gasto
    const newGasto = await pool.query(`
      INSERT INTO gasto (fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago, responsableingresargasto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago, req.usuario.idusuario]);

    //Devolucion del nuevo gasto creado
    res.status(200).json(newGasto.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Actualizar gasto
gastoController.updateGasto = async (req, res, next) => {
  try {
    //Parametros requeridos para la actualizacion
    const { idinterfazoperacion, idgasto } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para actualizar un gasto
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Parametros del cuerpo de la solicitud para la actualizacion del gasto
    const { fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago } = req.body;

    //Update para la actualizacion del gasto mediante el idgasto
    const updateGasto = await pool.query(`
      UPDATE gasto 
      SET fecha = $1, 
          responsablegasto = $2, 
          moneda = $3, 
          importe = $4, 
          comentario = $5, 
          idcategoria = $6, 
          idsubmetodopago = $7
          estado = true
      FROM categoria c
      JOIN gasto on $6 = c.idcategoria AND c.idinterfazoperacion = $8
      WHERE gasto.idgasto = $9
      RETURNING *
    `, [
      fecha, responsablegasto, moneda, importe, comentario, idcategoria, idsubmetodopago, idinterfazoperacion, idgasto]);

    //Si no se encuentra el gasto a actualizar, retornar 404
    if (updateGasto.rows.length === 0) {
      return res.status(404).json({ message: 'Gasto no encontrado' });
    }
    //Devolucion del gasto actualizado
    return res.json(updateGasto.rows[0]);
  } catch (error) {
    next(error);
  }
};

//Eliminar gasto (cambiar estado a false)
gastoController.deleteGasto = async (req, res, next) => {
  try {
    //Parametros requeridos para la eliminacion
    const { idinterfazoperacion, idgasto } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Roles permitidos para eliminar un gasto
    const allowedRoles = ['Administrador', 'Invitado'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Verificacion de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Delete logico para cambiar el estado del gasto a false
    const deleteGasto = await pool.query(`
      UPDATE gasto
      SET estado = false
      FROM categoria c
      JOIN gasto on gasto.idcategoria = c.idcategoria AND c.idinterfazoperacion = $1
      WHERE gasto.idgasto = $2
      RETURNING *
    `, [idinterfazoperacion, idgasto]);

    //Si no se encuentra el gasto a eliminar, retornar 404
    if (deleteGasto.rows.length === 0) {
      return res.status(404).json({ message: 'Gasto no encontrado.' });
    }

    //Devolucion de exito sin contenido
    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

module.exports = gastoController;