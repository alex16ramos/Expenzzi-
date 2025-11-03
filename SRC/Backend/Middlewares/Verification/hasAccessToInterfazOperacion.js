const pool = require('../../DB/dbConnection.js');

const hasAccessToInterfazOperacion = async (idinterfazoperacion, idusuario) => {
    const result = await pool.query(`
        SELECT 1
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

    return result.rowCount > 0;
};

module.exports = hasAccessToInterfazOperacion;
