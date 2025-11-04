const pool = require('../../DB/dbConnection.js');

//Middleware para verificar si el usuario tiene un rol permitido (pasado mediante allowedRoles) en la interfaz operacion
//allowedRoles es un array con los roles permitidos, ej: ['Administrador', 'Invitado']
//Esto se realiza mediante una busqueda en la tabla usuariointerfaz, verificando el rol del usuario en dicha interfaz operacion (tiene que estar activa)
//Si el rol del usuario esta en la lista de roles permitidos, devuelve el rol, si no, devuelve null
const hasRoleInterfazOperacion = async ( idusuario, idinterfazoperacion, allowedRoles) => {
    const result = await pool.query(  
        `SELECT ui.rol AS role
        FROM usuariointerfaz ui
        JOIN interfazoperacion i 
            ON ui.idinterfazoperacion = i.idinterfazoperacion
        JOIN usuario u 
            ON ui.idusuario = u.idusuario
        WHERE 
            i.idinterfazoperacion = $1
            AND u.idusuario = $2
            and i.estado = true;
    `, [idinterfazoperacion, idusuario]);

    //Si no se encuentra ninguna tupla, devolver null
    if (result.rowCount === 0) {
        return null;
    }

    //Obtener el rol del usuario
    const userRole = result.rows[0].role;

    //Devolver el rol si esta en la lista de roles permitidos, si no, devolver null
    return allowedRoles.includes(userRole) ? userRole : null;
};

module.exports = hasRoleInterfazOperacion;
