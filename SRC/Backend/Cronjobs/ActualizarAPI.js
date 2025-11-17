const cron = require('node-cron');
require('dotenv').config();

cron.schedule('*/12 * * * *', () => {
    console.log('Actualizando server');
    fetch(`http://localhost:3000/`)
     .then(response => response.json())
    .catch(error => console.error(error));
  });