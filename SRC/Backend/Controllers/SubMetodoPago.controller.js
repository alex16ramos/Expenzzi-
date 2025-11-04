// Importación de dependencias
const pool = require('../DB/dbConnection.js');
const submetodopagoController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js');
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');

// Obtener todos los submétodos de pago (filtros simples)
submetodopagoController.getSubMetodosPago = async (req, res, next) => {
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
      filters.push(`(smp.estado = $${values.length + 1})`);
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
          .map((_, i) => `LOWER(smp.nombre) ILIKE $${values.length + 1 + i}`)
          .join(' OR ');
        filters.push(`(${conditions})`);
        values.push(...terms.map(term => `%${term}%`));
      }
    }

    // Consulta SQL (ya no se filtra por método)
    const query = `
      SELECT 
        smp.idsubmetodopago,
        smp.nombre,
        smp.metodo,
        smp.estado
      FROM submetodopago smp
      WHERE smp.idinterfazoperacion = $1
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
      ORDER BY smp.metodo, smp.nombre ASC;
    `;

    const result = await pool.query(query, values);
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

// Obtener submétodo de pago por ID
submetodopagoController.getSubMetodoPagoByID = async (req, res, next) => {
  try {
    const { idsubmetodopago, idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);

    // Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const result = await pool.query(`
      SELECT 
        smp.idsubmetodopago,
        smp.nombre,
        smp.metodo,
        smp.estado
      FROM submetodopago smp
      WHERE smp.idinterfazoperacion = $1 AND smp.idsubmetodopago = $2
    `, [idinterfazoperacion, idsubmetodopago]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submétodo de pago no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Crear nuevo submétodo de pago
submetodopagoController.createSubMetodoPago = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    // Verificación de acceso
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    // Verificación de rol permitido
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    // Solo se ingresan nombre y método (este último es fijo o seleccionado)
    const { nombre, metodo } = req.body;

    const newSubMetodo = await pool.query(`
      INSERT INTO submetodopago (nombre, metodo, idinterfazoperacion, estado)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `, [nombre, metodo, idinterfazoperacion]);

    res.status(201).json(newSubMetodo.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Actualizar submétodo de pago
submetodopagoController.updateSubMetodoPago = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idsubmetodopago } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    const { nombre, metodo } = req.body;

    const updateSubMetodo = await pool.query(`
      UPDATE submetodopago
      SET nombre = $1,
          metodo = $2,
          estado = true
      WHERE idsubmetodopago = $3 AND idinterfazoperacion = $4
      RETURNING *
    `, [nombre, metodo, idsubmetodopago, idinterfazoperacion]);

    if (updateSubMetodo.rows.length === 0) {
      return res.status(404).json({ message: 'Submétodo de pago no encontrado' });
    }

    res.json(updateSubMetodo.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Eliminar submétodo de pago (borrado lógico)
submetodopagoController.deleteSubMetodoPago = async (req, res, next) => {
  try {
    const { idinterfazoperacion, idsubmetodopago } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    const allowedRoles = ['Administrador'];

    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operación' });
    }

    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    const deleteSubMetodo = await pool.query(`
      UPDATE submetodopago
      SET estado = not(estado)
      WHERE idsubmetodopago = $1 AND idinterfazoperacion = $2
      RETURNING *
    `, [idsubmetodopago, idinterfazoperacion]);

    if (deleteSubMetodo.rows.length === 0) {
      return res.status(404).json({ message: 'Submétodo de pago no encontrado.' });
    }

    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
};

module.exports = submetodopagoController;
