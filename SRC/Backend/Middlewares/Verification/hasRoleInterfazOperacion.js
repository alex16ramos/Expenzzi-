const pool = require('../../DB/dbConnection.js');

const hasRoleInterfazOperacion = async ( idusuario, idinterfazoperacion, allowedRoles) => {
    const result = await pool.query(  
        `SELECT ui.rol AS role
        FROM usuariointerfaz ui
        JOIN interfazoperacion i 
            ON ui.idinterfazoperacion = i.idinterfazoperacion
        JOIN usuario u 
            ON ui.idusuario = u.idusuario
        WHERE 
            i.idinterfazoperacion = $2
            AND u.idusuario = $1
            and i.estado = true;
    `, [, idusuario, idinterfazoperacion]);

    if (result.rowCount === 0) {
        return null;
    }

    const userRole = result.rows[0].role;

    return allowedRoles.includes(userRole) ? userRole : null;
};

module.exports = hasRoleInterfazOperacion;
