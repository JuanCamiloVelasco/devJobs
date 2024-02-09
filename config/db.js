const { default: mongoose } = require("mongoose");
require('dotenv').config({ path: 'variables.env'})

mongoose.connect(process.env.DATABASE);

mongoose.connection.on('error', (error) => {
    console.log(error)
})

// importar los modelos
require('../models/Usuarios');
require('../models/Vacantes');