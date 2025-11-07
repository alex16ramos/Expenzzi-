// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const categoriaController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js');
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');

// Obtener todas las categorías 
categoriaController.getCategorias = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    // Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const { estado, nombre } = req.query;
    let filters = [];
    let values = [idinterfazoperacion];

    // Filtro por estado
    if (estado) {
      filters.push(`(c.estado = $${values.length + 1})`);
      values.push(estado);
    }

    // Filtro por nombre
    if (nombre) {
      const terms = nombre
        .split(/, | ,|,/)
        .map(term => term.trim().toLowerCase())
        .filter(term => term.length > 0);

      if (terms.length) {
        const conditions = terms
          .map((_, i) => `LOWER(c.nombre) ILIKE $${values.length + 1 + i}`)
          .join(' OR ');
        filters.push(`(${conditions})`);
        values.push(...terms.map(term => `%${term}%`));
      }
    }

    // Consulta SQL
    const query = `
      SELECT 
        c.idcategoria,
        c.nombre,
        c.estadolimite AS "estadoLimite",
        c.importelimite AS "importeLimite",
        c.moneda,
        c.estado
      FROM categoria c
      WHERE c.idinterfazoperacion = $1
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY c.nombre ASC;
    `;

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

//Obtener categoría por ID
categoriaController.getCategoriaByID = async (req, res, next) => {
  try {
    const { idcategoria, idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    //Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const result = await pool.query(`
      SELECT 
        c.idcategoria,
        c.nombre,
        c.estadolimite AS "estadoLimite",
        c.importelimite AS "importeLimite",
        c.moneda,
        c.estado
      FROM categoria c
      WHERE c.idinterfazoperacion = $1 AND c.idcategoria = $2
    `, [idinterfazoperacion, idcategoria]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Crear nueva categoría
categoriaController.createCategoria = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    //Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificación de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Datos del cuerpo 
    const { nombre } = req.body;

    const newCategoria = await pool.query(`
      INSERT INTO categoria (nombre, idinterfazoperacion, estado)
      VALUES ($1, $2, true)
      RETURNING *
    `, [nombre, idinterfazoperacion]);

    res.status(201).json(newCategoria.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Actualizar categoría
categoriaController.updateCategoria = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idcategoria } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    const { nombre } = req.body;

    const updateCategoria = await pool.query(`
      UPDATE categoria
      SET nombre = $1,
          estado = true
      WHERE idcategoria = $2 AND idinterfazoperacion = $3
      RETURNING *
    `, [nombre, idcategoria, idinterfazoperacion]);

    if (updateCategoria.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    res.json(updateCategoria.rows[0]);
  } catch (err) {
    next(err);
  }
};

//Eliminar categoría (borrado lógico)
categoriaController.deleteCategoria = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idcategoria } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador', 'Invitado'];

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    const deleteCategoria = await pool.query(`
      UPDATE categoria
      SET estado = not(estado)
      WHERE idcategoria = $1 AND idinterfazoperacion = $2
      RETURNING *
    `, [idcategoria, idinterfazoperacion]);

    if (deleteCategoria.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada.' });
    }

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

//Ingresar Limite por categoria 
categoriaController.setLimiteCategoria = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idcategoria } = req.params;
    const { importelimite, moneda, periodoaplicacion } = req.body;

    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Buscamos categoría actual
    const categoriaActual = await pool.query(`
      SELECT * FROM categoria 
      WHERE idcategoria = $1 AND idinterfazoperacion = $2
    `, [idcategoria, idinterfazoperacion]);

    if (categoriaActual.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const categoriaAnt = categoriaActual.rows[0];

    //Segun la moneda ingresada
    let campoImporte;
    switch (moneda) {
      case 'ARS':
        campoImporte = '(g.importes).importeARS';
        break;
      case 'USD':
        campoImporte = '(g.importes).importeUSD';
        break;
      case 'UYU':
        campoImporte = '(g.importes).importeUYU';
        break;
      default:
        return res.status(400).json({ message: 'Moneda no válida. Use ARS, USD o UYU.' });
    }

    //Calcula importe utilizado segun la moneda 
    const gastoTotal = await pool.query(`
      SELECT COALESCE(SUM(${campoImporte}), 0) AS total
      FROM gasto g
      JOIN categoria c ON c.idcategoria = g.idcategoria
      WHERE g.idcategoria = $1 
        AND c.idinterfazoperacion = $2 
        AND g.estado = true
    `, [idcategoria, idinterfazoperacion]);

    const importeUtilizado = parseFloat(gastoTotal.rows[0].total);
    const porcentajeUtilizado = importelimite > 0 ? (importeUtilizado / importelimite) * 100 : 0;

    //Actualizar la categoría con el nuevo límite
    const updateCategoria = await pool.query(`
      UPDATE categoria
      SET estadolimite = true,
          importelimite = $1,
          moneda = $2,
          importes = ROW($1, $1, $1),
          estado = true
      WHERE idcategoria = $3 AND idinterfazoperacion = $4
      RETURNING *;
    `, [importelimite, moneda, idcategoria, idinterfazoperacion]);

    //Crear historial del límite
    await pool.query(`
      INSERT INTO historiallimite (periodoaplicacion, importeutilizado, porcentajeutilizado, act, ant, idcategoria)
      VALUES ($1, $2, $3, ROW($4, $5), ${categoriaAnt.estadolimite ? `ROW($6, $7)` : `NULL`}, $8)
    `, [periodoaplicacion, importeUtilizado, porcentajeUtilizado, importelimite, moneda, categoriaAnt.importelimite,
      categoriaAnt.moneda, idcategoria]);

    res.status(200).json({
      message: categoriaAnt.estadolimite ? 'Límite actualizado correctamente' : 'Límite establecido correctamente',
      limite: updateCategoria.rows[0],
      gastoActual: importeUtilizado,
      porcentajeUtilizado: porcentajeUtilizado.toFixed(2) + '%'
    });
  } catch (err) {
    next(err);
  }
};

categoriaController.removeLimiteCategoria = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idcategoria } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    //Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    //Verificación de rol
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Buscar la categoría
    const categoriaActual = await pool.query(`
      SELECT * FROM categoria
      WHERE idcategoria = $1 AND idinterfazoperacion = $2
    `, [idcategoria, idinterfazoperacion]);

    if (categoriaActual.rows.length === 0) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }

    const categoria = categoriaActual.rows[0];

    //Si no tenía límite, no hay nada que eliminar
    if (!categoria.estadolimite) {
      return res.status(400).json({ message: 'Esta categoría no tiene límite establecido.' });
    }

    //Se registra el cambio en historiallimite
    await pool.query(`
      INSERT INTO historiallimite (periodoaplicacion, importeutilizado, porcentajeutilizado, act, ant, idcategoria)
      VALUES (null, 0, 0, NULL, ROW($1, $2), $3)
    `, [categoria.importelimite, categoria.moneda, idcategoria]);

    //Actualiza la categoría (reseteo)
    const updateCategoria = await pool.query(`
      UPDATE categoria
      SET estadolimite = false,
          importelimite = NULL,
          moneda = NULL,
          importes = NULL
      WHERE idcategoria = $1 AND idinterfazoperacion = $2
      RETURNING *;
    `, [idcategoria, idinterfazoperacion]);

    res.status(200).json({
      message: 'Límite eliminado correctamente',
      categoria: updateCategoria.rows[0]
    });

  } catch (err) {
    next(err);
  }
};


module.exports = categoriaController;
