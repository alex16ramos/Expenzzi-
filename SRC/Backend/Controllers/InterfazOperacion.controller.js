//Importacion de dependencias
const pool = require('../DB/dbConnection.js');
const interfazoperacionController = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js')
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');


// Obtener todas las interfaces de operacion asociadas a un idusuario
// Filtrado por estado y nombre
interfazoperacionController.getAllInterfazOperacionbyIdUsuario = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idusuario } = req.params;
    //Parametros opcionales para el filtrado
    const { estado, nombre, rol } = req.query;

    //Verificacion de acceso, el usuario solo puede ver sus propias interfaces de operacion
    if (req.usuario.idusuario !== idusuario) {
      return res.status(403).json({ message: 'No tienes acceso a este Usuario.' });
    }

    //Se definen los filtros y valores para la consulta
    const filters = [];
    const values = [];

    //Se agrega el idusuario a los valores de la consulta
    values.push(idusuario);

    //Se filtran los parametros opcionales
    if (estado !== null) {
      filters.push(`i.estado = $${values.length + 1}`);
      values.push(estado);
    }

    if (nombre) {
      filters.push(`i.nombre ILIKE '%' || $${values.length + 1} || '%'`);
      values.push(nombre);
    }

    if (rol) {
      filters.push(`ui.rol ILIKE '%' || $${values.length + 1} || '%'`);
      values.push(rol);
    }

    //Construccion de la consulta SQL ordenada por fecha de union
    const query = `
        SELECT i.nombre as "nombre", 
               i.descripcion as "descripcion", 
               i.idinterfazoperacion as "idinterfazoperacion",
               i.estado as "estado",
               ui.rol as "rol",
               i.linkinvitado as "linkinvitado",
               i.linkvisualizador as "linkvisualizador",
               ui.fechaunion as "fechaunion"
        FROM usuariointerfaz ui
        JOIN interfazoperacion i 
            ON ui.idinterfazoperacion = i.idinterfazoperacion
        JOIN usuario u 
            ON ui.idusuario = u.idusuario
        WHERE 
            u.idusuario = $1
            AND (ui.fechasalida IS NULL)
            ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
        ORDER BY ui.fechaunion DESC;
    `;

    //Se construye y ejecuta la consulta
    const result = await pool.query(query, values);

    //Si no se encuentran resultados, se retorna un 404
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron interfaz de operaciones para este usuario.' });
    }

    //Devolucion de los resultados
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};


// Obtener los usuarios asociados a una interfaz de operacion
//Filtrado por rol, nombreusuario y fecha de union
interfazoperacionController.getUsuariosByIdInterfazOperacion = async (req, res, next) => {
  try {
    //Parametros requeridos para la busqueda
    const { idinterfazoperacion } = req.params;
    const idinterfazoperacionNum = Number(idinterfazoperacion);
    //Parametros opcionales para el filtrado
    const { rol, nombreusuario, fechaDesde, fechaHasta } = req.query;
    //Roles permitidos para acceder a esta funcionalidad
    const allowedRoles = ['Administrador'];

    //Verificacion de acceso a la interfaz de operacion
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacionNum))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    //Verificacion de rol del usuario igual a allowedRoles
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Se definen los filtros y valores para la consulta
    const filters = [];
    const values = [];

    //Se agrega el idinterfazoperacion a los valores de la consulta
    values.push(idinterfazoperacion);

    //Se filtran los parametros opcionales
    if (rol) {
      filters.push(`ui.rol ILIKE '%' || $${values.length + 1} || '%'`);
      values.push(rol);
    }

    if (nombreusuario) {
      filters.push(`u.nombreusuario ILIKE '%' || $${values.length + 1} || '%'`);
      values.push(nombreusuario);
    }

    if (fechaDesde && fechaHasta) {
      filters.push(`ui.fechaunion BETWEEN $${values.length + 1} AND $${values.length + 2}`);
      values.push(fechaDesde, fechaHasta);
    }

    //Construccion de la consulta SQL ordenada por rol (Administradores primero) y fecha de union
    const query = `
      SELECT u.nombreusuario as "nombreusuario", 
            u.idusuario as "idusuario", 
            ui.rol AS "role" ,
            ui.fechaunion as "fechaunion",
            CONCAT(
              SUBSTRING(u.email FROM 1 FOR 3), 
              '*****', 
              SUBSTRING(u.email FROM POSITION('@' IN u.email) - 3 FOR 3),
              '@',
              SUBSTRING(u.email FROM POSITION('@' IN u.email) + 1 FOR LENGTH(u.email))
            ) AS "email",
            ui.fechasalida as "fechasalida"
        FROM usuariointerfaz ui
        JOIN interfazoperacion i 
            ON ui.idinterfazoperacion = i.idinterfazoperacion
        JOIN usuario u 
            ON ui.idusuario = u.idusuario
        WHERE i.idinterfazoperacion = $1
        ${filters.length > 0 ? 'AND ' + filters.join(' AND ') : ''}
        ORDER BY 
            CASE 
            WHEN ui.rol = 'Administrador' THEN 0 
            ELSE 1 
            END,
            ui.rol ASC,
            ui.fechaunion DESC;
    `;

    //Se construye y ejecuta la consulta
    const result = await pool.query(query, values);

    //Si no se encuentran resultados, se retorna un 404
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron usuarios para esta interfaz de operacion' });
    }

    //Devolucion de los resultados
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

//Creacion de una nueva interfaz de operacion
interfazoperacionController.createInterfazOperacion = async (req, res, next) => {
  try {
    //Parametros requeridos para la creacion
    const { nombre, descripcion } = req.body;
    const idusuario = req.usuario.idusuario;

    //Construccion y ejecucion del insert en interfazoperacion
    const newInterfazOperacion = await pool.query(`
      INSERT INTO interfazoperacion (nombre, descripcion)
      VALUES ($1, $2) RETURNING idinterfazoperacion;
    `, [nombre, descripcion]);

    //Obtencion del id de la nueva interfaz de operacion
    const idinterfazoperacion = newInterfazOperacion.rows[0].idinterfazoperacion;

    //Construccion y ejecucion del insert en usuariointerfaz con el idinterfazoperacion recien creado
    const newUsuarioInterfaz = await pool.query(`
      INSERT INTO usuariointerfaz (rol, idinterfazoperacion, idusuario)
      VALUES ($1, $2, $3) RETURNING *;
    `, ['Administrador', idinterfazoperacion, idusuario]);

    //Devolucion de ambos resultados
    res.status(200).json({
        interfaz: newInterfazOperacion.rows[0],
        usuarioInterfaz: newUsuarioInterfaz.rows[0]
        });
  } catch (err) {
    next(err);
  }
};

// Actualizar una interfaz de operacion
interfazoperacionController.updateInterfazOperacion = async (req, res, next) => {
  try {
    //Parametros que se pueden actualizar
    const { nombre, descripcion } = req.body;
    //Parametros requeridos
    const { idinterfazoperacion } = req.params;
    //Roles permitidos para acceder a esta funcionalidad
    const allowedRoles = ['Administrador'];

    //Verificacion de rol del usuario igual a allowedRoles
    const userRole = await hasRoleInterfazOperacion(req.usuario.idusuario, idinterfazoperacion, allowedRoles);
    if (!userRole) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Construccion y ejecucion del update en interfazoperacion
    const updateInterfazOperacion = await pool.query(`
        UPDATE interfazoperacion
        SET nombre = $1, descripcion = $2
        WHERE idinterfazoperacion = $3
        RETURNING *;
      `,
      [nombre, descripcion, idinterfazoperacion]
    );

    //Si no se ejecuta el update, se retorna un 404
    if (updateInterfazOperacion.rows.length === 0) {
      return res.status(404).json({ message: 'Interfaz de operacion no encontrada' });
    }

    //Devolucion del resultado
    res.status(200).json(updateInterfazOperacion.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Desactivar o activar una interfaz de operacion mediante el estado
interfazoperacionController.deleteInterfazOperacion = async (req, res, next) => {
  try {
    //Parametros requeridos
    const { idinterfazoperacion } = req.params;
    //Roles permitidos para acceder a esta funcionalidad
    const allowedRoles = ['Administrador'];

    //Función para verificar si el usuario tiene un rol permitido en la interfaz operacion este inactica o activa dicha interfaz
    const result = await pool.query(  
            `SELECT ui.rol AS role
            FROM usuariointerfaz ui
            JOIN interfazoperacion i 
                ON ui.idinterfazoperacion = i.idinterfazoperacion
            JOIN usuario u 
                ON ui.idusuario = u.idusuario
            WHERE 
                i.idinterfazoperacion = $1
                AND u.idusuario = $2;
        `, [idinterfazoperacion, req.usuario.idusuario]);

    //Obtener el rol del usuario
    const userRole = result.rows[0].role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'No tienes acceso a esta funcionalidad' });
    }

    //Construccion y ejecucion del delete en interfazoperacion
    //Se asigna el estado contrario al actual (false o true)
    const deleteInterfazOperacion = await pool.query(`
        UPDATE interfazoperacion
        SET estado = not estado
        WHERE idinterfazoperacion = $1
        RETURNING *;
      `,
      [idinterfazoperacion]
    );

    //Si no se ejecuta el delete, se retorna un 404
    if (deleteInterfazOperacion.rows.length === 0) {
      return res.status(404).json({ message: 'Interfaz de operacion no encontrada' });
    }

    //Devolucion del resultado mediante un mensaje de exito
    res.status(200).json({ message: 'La Interfaz de operacion ha cambiado su estado correctamente' });
  } catch (err) {
    next(err);
  }
};

// getBalanceGeneral
interfazoperacionController.getBalanceGeneral = async (req, res, next) => {
  try {
    //  Obtenemos el ID de la interfaz que viene en la URL
    const { idinterfazoperacion } = req.params;

    // Verificamos que el usuario tenga acceso a esta interfaz
    //  método ya existente
    if (!(await hasAccessToInterfazOperacion(req.usuario.idusuario, idinterfazoperacion))) {
      return res.status(403).json({ message: 'No tienes acceso a esta interfaz de operacion' });
    }

    // Escribimos la consulta SQL    
    const query = `
      SELECT 
        balancegeneralars, 
        balancegeneralusd, 
        balancegeneraluyu 
      FROM interfazoperacion 
      WHERE idinterfazoperacion = $1
    `;
    const values = [idinterfazoperacion];

    // Ejecutamos la consulta
    const result = await pool.query(query, values);

    // 5. Si no la encuentra, respondemos con un error
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Interfaz de operación no encontrada' });
    }

    //  Si la encuentra, devolvemos el primer (y único) resultado
    //   
    res.status(200).json(result.rows[0]);

  } catch (err) {
    // 7. Por si todo falla
    next(err);
  }
};

// Actualiza los 3 balances (ARS, USD, UYU) de una interfaz.
// Se debe llamar después de cualquier cambio en gastos o ingresos.

// Actualiza los 3 balances (ARS, USD, UYU) de una interfaz.
// Se debe llamar después de cualquier cambio en gastos o ingresos.
interfazoperacionController.updateBalanceGeneral = async (idinterfazoperacion) => {
  try {
    //  Calculamos el total de INGRESOS (sumando las 3 monedas)
    const ingresosQuery = `
      SELECT 
        COALESCE(SUM(importeARS), 0) as totalIngresosARS,
        COALESCE(SUM(importeUSD), 0) as totalIngresosUSD,
        COALESCE(SUM(importeUYU), 0) as totalIngresosUYU
      FROM ingreso
      WHERE idinterfazoperacion = $1 AND estado = true
    `;
    const ingresosResult = await pool.query(ingresosQuery, [idinterfazoperacion]);
    const ingresos = ingresosResult.rows[0];

    //  Calculamos el total de GASTOS (sumando las 3 monedas)
    const gastosQuery = `
      SELECT 
        COALESCE(SUM(importeARS), 0) as totalGastosARS,
        COALESCE(SUM(importeUSD), 0) as totalGastosUSD,
        COALESCE(SUM(importeUYU), 0) as totalGastosUYU
      FROM gasto
      WHERE idinterfazoperacion = $1 AND estado = true
    `;
    const gastosResult = await pool.query(gastosQuery, [idinterfazoperacion]);
    const gastos = gastosResult.rows[0];

    //  Calculamos el BALANCE FINAL (Ingresos - Gastos)
    const balanceARS = ingresos.totalIngresosARS - gastos.totalGastosARS;
    const balanceUSD = ingresos.totalIngresosUSD - gastos.totalGastosUSD;
    const balanceUYU = ingresos.totalIngresosUYU - gastos.totalGastosUYU;

    //  Actualizamos la tabla 'interfazoperacion' con los nuevos balances
    const updateQuery = `
      UPDATE interfazoperacion
      SET 
        balancegeneralars = $1,
        balancegeneralusd = $2,
        balancegeneraluyu = $3
      WHERE idinterfazoperacion = $4
    `;
    await pool.query(updateQuery, [balanceARS, balanceUSD, balanceUYU, idinterfazoperacion]);

    console.log(`Balance actualizado para interfaz ${idinterfazoperacion}`);
    return true; // Terminó bien

  } catch (err) {
    console.error(`Error actualizando balance para interfaz ${idinterfazoperacion}:`, err);
    return false; // Hubo un error
  }
};
module.exports = interfazoperacionController;
