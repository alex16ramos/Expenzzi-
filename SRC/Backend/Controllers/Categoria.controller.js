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
        c.importe AS "importe",
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
        c.importe AS "importe",
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
    const { importe, moneda, periodoaplicacion } = req.body;

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

    //Obtenemos importe utilizado
    const importeQuery = await pool.query(`
      SELECT v.importeutilizado 
      FROM vistalimitegastosperiodo v
      WHERE v.idcategoria = $1 
      ORDER BY v.periodoinicio DESC 
      LIMIT 1;
    `, [idcategoria]);

    const importeutilizado = importeQuery.rows.length > 0 
    ? Number(importeQuery.rows[0].importeutilizado)
    : 0;

    //Actualizar la categoría con el nuevo límite
    const updateCategoria = await pool.query(`
      UPDATE categoria
      SET estadolimite = true,
          importe = $1,
          moneda = $2,
          periodoaplicacion = $3,
          fechacreacionlimite = now()
      WHERE idcategoria = $4 AND idinterfazoperacion = $5
      RETURNING *;
    `, [importe, moneda, periodoaplicacion, idcategoria, idinterfazoperacion]);

    //Crear historial del límite
    await pool.query(`
      INSERT INTO historiallimite (periodoaplicacion, importeutilizado, ant, idcategoria, fechacreacionlimite)
      VALUES ($1, $2, ROW($3, $4), $5, $6 )
    `, [periodoaplicacion, importeutilizado, categoriaAnt.importe, categoriaAnt.moneda, idcategoria,
       categoriaAnt.fechacreacionlimite]);

    res.status(200).json({
      message: categoriaAnt.estadolimite ? 'Límite actualizado correctamente' : 'Límite establecido correctamente',
      limite: updateCategoria.rows[0],
      gastoActual: importeutilizado
    });
  } catch (err) {
    next(err);
  }
};

categoriaController.deleteLimiteCategoria = async (req, res, next) => {
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

    //Actualiza la categoría (reseteo)
    const updateCategoria = await pool.query(`
      UPDATE categoria
      SET estadolimite = false,
          importe = NULL,
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
