//Importaciones de dependencias
const pool = require('../DB/dbConnection.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioController = {};
require('dotenv').config();

// Registro de usuario
usuarioController.register = async (req, res) => {
    //Parametros del body para registrar un usuario
    const { nombreusuario, email, contrasena } = req.body;

    try {
        //Encriptamos la contraseña ingresada por el usuario por el metodo hash de bcrypt (un solo sentido)
        const hashedContrasena = await bcrypt.hash(contrasena, 10);

        //Insertamos el nuevo usuario en la base de datos con la contraseña encriptada
        await pool.query(
            `INSERT INTO usuario (nombreusuario, email, contrasena) VALUES ($1, $2, $3)`,
            [nombreusuario, email, hashedContrasena]
        );

        //Respuesta exitosa
        res.status(200).send('Usuario registrado exitosamente');
    } catch (error) {
        //Error en el proceso de registro
        console.error('Error al registrar usuario:', error);
        res.status(400).send('Error al registrar el usuario');
    }
};

// Inicio de sesión de usuario
usuarioController.login = async (req, res) => {
    //Parametros del body para iniciar sesión
    const { email, contrasena } = req.body;

    try {
        //Buscar el usuario en la base de datos por su email
        const userResult = await pool.query(`SELECT idusuario, nombreusuario, contrasena FROM usuario WHERE email = $1`, [email]);

        //Verificar si el usuario existe
        if (userResult.rows.length > 0) {
            //Si el usuario existe, verificar la contraseña
            const user = userResult.rows[0];
            //Comparar la contraseña ingresada con la almacenada en la base de datos ambas encriptadas
            const validPassword = await bcrypt.compare(contrasena, user.contrasena);

            //Si la contraseña es válida, generar un token JWT
            if (validPassword) {
                //Token de acceso con datos del usuario y expiración de 15 días
                const accessToken = jwt.sign(
                    {
                        idusuario: usuario.idusuario,
                        nombreusuario: usuario.nombreusuario
                    },
                    process.env.PASSWORD_SECRET,
                    { expiresIn: '15d' }
                );
                //Devolver el token al cliente mediante una respuesta JSON
                res.status(200).json({ accessToken });
            } else {
                //Contraseña incorrecta
                res.status(400).send('Contraseña incorrecta');
            }
        } else {
            //Usuario no encontrado en la base de datos
            res.status(404).send('Email no encontrado');
        }
    } catch (error) {
        //Error en el proceso de inicio de sesión
        console.error('Error al iniciar sesión:', error);
        res.status(500).send('Error al iniciar sesión');
    }
};

module.exports = usuarioController;