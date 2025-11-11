const axios = require('axios');
const cron = require('node-cron');
const pool = require('../DB/dbConnection.js');
require('dotenv').config();

cron.schedule('40 11 * * *', async () => {
    console.log('Ejecutando actualización de tipos de cambio USD...');
    try {
        const responseUSD = await axios.get(`http://apilayer.net/api/live`, {
            params: {
                access_key: process.env.KEY_API_MONEDA_CAMBIO,
                currencies: 'USD,UYU,ARS',
                source: 'USD',
                format: 1
            }
        });

        if (responseUSD.data.success) {
            const ratesUSD = responseUSD.data.quotes;
            const USDUYU = ratesUSD['USDUYU'];
            const USDARS = ratesUSD['USDARS'];

            console.log('Cambio actualizado: USD', { USDUYU, USDARS});
        } else {
            console.error('Error en la respuesta de CurrencyLayer para USD:', responseUSD.data.error);
        }
    } catch (error) {
        console.error('Error al actualizar USD:', error.message);
    }
});

cron.schedule('41 11 * * *', async () => {
    console.log('Ejecutando actualización de tipos de cambio ARS...');

    try {
        const responseARS = await axios.get(`http://apilayer.net/api/live`, {
            params: {
                access_key: process.env.KEY_API_MONEDA_CAMBIO,
                currencies: 'USD,UYU,ARS',
                source: 'ARS',
                format: 1
            }
        });

        if (responseARS.data.success) {
            const ratesARS = responseARS.data.quotes;
            const ARSUSD = ratesARS['ARSUSD'];
            const ARSUYU = ratesARS['ARSUYU'];

            console.log('Cambio actualizado: ARS', { ARSUSD, ARSUYU });
        } else {
            console.error('Error en la respuesta de CurrencyLayer para ARS:', responseARS.data.error);
        }
    } catch (error) {
        console.error('Error al actualizar ARS:', error.message);
    }
});

cron.schedule('42 11 * * *', async () => {
    console.log('Ejecutando actualización de tipos de cambio UYU...');

    try {
        const responseUYU = await axios.get(`http://apilayer.net/api/live`, {
            params: {
                access_key: process.env.KEY_API_MONEDA_CAMBIO,
                currencies: 'USD,UYU,ARS',
                source: 'UYU',
                format: 1
            }
        });

        if (responseUYU.data.success) {
            const ratesUYU = responseUYU.data.quotes;
            const UYUARS = ratesUYU['UYUARS'];
            const UYUUSD = ratesUYU['UYUUSD'];

            console.log('Cambio actualizado: UYU', { UYUARS, UYUUSD });
        } else {
            console.error('Error en la respuesta de CurrencyLayer para UYU:', responseUYU.data.error);
        }
    } catch (error) {
        console.error('Error al actualizar UYU:', error.message);
    }
});

cron.schedule('43 11 * * *', async () => {
    try {
    await pool.query(`
                INSERT INTO cambio (fecha, cambiouyuusd, cambiouyuars, cambiousdars, cambiousduyu, cambioarsuyu, cambioarsusd)
                VALUES (NOW(), $1, $2, $3, $4, $5, $6)
            `, [UYUUSD, UYUARS, USDARS, USDUYU, ARSUYU, ARSUSD ]);
    console.log('Cambio guardados en la base de datos');
} 
catch (error) {
    console.error('Error al actualizar cambios:', error.message);
}});