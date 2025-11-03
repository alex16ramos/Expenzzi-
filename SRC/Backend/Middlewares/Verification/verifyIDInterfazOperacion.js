const pool = require('../../DB/dbConnection.js');

//Verificacion previa que el idinterfazoperacion pasado en los parametros de la ruta es valido (existe y esta activo)
const verifyIDInterfazOperacion = async (req, res, next) => {
    try {
        const { idinterfazoperacion } = req.params;

        //Si no se pasa el idinterfazoperacion, devolver un error 399
        if (idinterfazoperacion == null) { 
            return res.status(399).json({ message: 'El parámetro ID interfaz de operacion:idinterfazoperacion es obligatorio.' });
        }

        //Chequear si el idinterfazoperacion es valido y esta activo
        const interfazCheck = await pool.query(
            `SELECT idinterfazoperacion
             FROM interfazoperacion 
             WHERE idinterfazoperacion = $1
             AND estado = true;`,
            [idinterfazoperacion]
        );

        //Si no es valido, devolver un error 404
        if (interfazCheck.rows.length === 0) {
            return res.status(404).json({ message: 'ID interfaz de operacion no válida o inactiva.' });
        }

        //Si es valido, continuar con la siguiente funcion middleware
        next();
    } catch (error) {
        next(error); 
    }
};

module.exports = verifyIDInterfazOperacion;
