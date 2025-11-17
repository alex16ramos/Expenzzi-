//Importacion de dependencias
const pool = require('../DB/dbConnection.js');
const interfazoperacionService = {};
const hasAccessToInterfazOperacion = require('../Middlewares/Verification/hasAccessToInterfazOperacion.js')
const hasRoleInterfazOperacion = require('../Middlewares/Verification/hasRoleInterfazOperacion.js');


// Obtener todas las interfaces de operacion asociadas a un idusuario
// Filtrado por estado y nombre
interfazoperacionService.getAllInterfazOperacionbyIdUsuario = async (req, res, next) => {
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
interfazoperacionService.getUsuariosByIdInterfazOperacion = async (req, res, next) => {
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
      filters.push(`ui.rol = $${values.length + 1}`);
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
interfazoperacionService.createInterfazOperacion = async (req, res, next) => {
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
interfazoperacionService.updateInterfazOperacion = async (req, res, next) => {
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
interfazoperacionService.deleteInterfazOperacion = async (req, res, next) => {
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


// ------------------------------------------------Invitacion a Interfaz de Operacion------------------------------------------------
// Unirse a una interfaz de operacion mediante un codigo de invitacion
interfazoperacionService.joinToInterfazOperacion = async (req, res, next) => {
  try {
    const { codigoinvitacion } = req.params;

    // Buscar la interfaz y qué tipo de codigo invitacion es
    const getInterfazOperacion = await pool.query(`
      SELECT 
        io.idinterfazoperacion,
        CASE 
          WHEN io.linkinvitado = $1 THEN 'Invitado'
          WHEN io.linkvisualizador = $1 THEN 'Visualizador'
        END AS codigorol
      FROM interfazoperacion io
      WHERE (io.linkinvitado = $1 OR io.linkvisualizador = $1) AND io.estado = true;
    `, [codigoinvitacion]);

    if (getInterfazOperacion.rows.length === 0) {
      return res.status(404).json({ message: 'Codigo de invitacion invalido' });
    }

    const { idinterfazoperacion, codigorol } = getInterfazOperacion.rows[0];

    // Se busca cualquier registro previo del usuario en esa interfaz (sin filtrar por fechasalida)
    const checkUserInterfaz = await pool.query(`
      SELECT * FROM usuariointerfaz
      WHERE idinterfazoperacion = $1 AND idusuario = $2;
    `, [idinterfazoperacion, req.usuario.idusuario]);

    if (checkUserInterfaz.rows.length > 0) {
      const existing = checkUserInterfaz.rows[0];

      if (existing.fechasalida === null) {
        // El usuario ya está activo aun no salió (fechasalida es null).
        return res.status(200).json({
          message: 'Ya estás asociado a esta interfaz',
          data: existing
        });
      } else {
        // El usuario ya esta activo pero ya salio (fechasalida no es null). Lo reactivamos.
        const actualizarUsuarioInterfazOperacion = await pool.query(`
          UPDATE usuariointerfaz
          SET fechasalida = NULL,
              fechaunion = NOW(),
              rol = $1
          WHERE idinterfazoperacion = $2 AND idusuario = $3
          RETURNING *;
        `, [codigorol, idinterfazoperacion, req.usuario.idusuario]);

        return res.json({
          message: 'Se ha unido nuevamente con exito',
          data: actualizarUsuarioInterfazOperacion.rows[0]
        });
      }
    } else {
      // No existe registro previo: lo insertamos
      const agregarUsuarioInterfazOperacion = await pool.query(`
        INSERT INTO usuariointerfaz (rol, idinterfazoperacion, idusuario)
        VALUES ($1, $2, $3)
        RETURNING *;
      `, [codigorol, idinterfazoperacion, req.usuario.idusuario]);

      return res.json({
        message: 'Unido correctamente',
        data: agregarUsuarioInterfazOperacion.rows[0]
      });
    }

  } catch (error) {
    next(error);
  }
};

// Unirse a una interfaz de operacion mediante un codigo de invitacion
interfazoperacionService.getOutOfInterfazOperacion = async (req, res, next) => {
  try {
    const { idinterfazoperacion } = req.params;
    //Actualizar la fecha de salida del usuario en usuariointerfaz
    const setUsuarioInterfaz = await pool.query(`
        UPDATE usuariointerfaz
        SET fechasalida = NOW()
        WHERE idinterfazoperacion = $1 AND idusuario = $2 and fechasalida IS NULL
        RETURNING *;
    `, [idinterfazoperacion, req.usuario.idusuario]);
    //Si no se encuentra la interfaz de operacion, se retorna un 404
    if (setUsuarioInterfaz.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario interfaz no encontrado' });
    }
    //Devolucion del resultado mediante un mensaje de exito
    res.json({
      message: 'Saliste correctamente',
      data: setUsuarioInterfaz.rows[0]
    });

  } catch (error) {
    next(error);
  }
};

module.exports = interfazoperacionService;
