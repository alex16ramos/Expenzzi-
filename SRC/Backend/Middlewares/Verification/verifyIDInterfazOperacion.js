const pool = require('../../DB/dbConnection.js');

const verifyIDInterfazOperacion = async (req, res, next) => {
    try {
        const { idinterfazoperacion } = req.params;

        if (idinterfazoperacion == null) { 
            return res.status(399).json({ message: 'El parámetro ID interfaz de operacion:idinterfazoperacion es obligatorio.' });
        }

        const interfazCheck = await pool.query(
            `SELECT idinterfazoperacion
             FROM interfazoperacion 
             WHERE idinterfazoperacion = $1
             AND estado = true;`,
            [idinterfazoperacion]
        );

        if (interfazCheck.rows.length === 0) {
            return res.status(404).json({ message: 'ID interfaz de operacion no válida o inactiva.' });
        }

        next();
    } catch (error) {
        next(error); 
    }
};

module.exports = verifyIDInterfazOperacion;
