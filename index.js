const mongoose = require('mongoose');
require("./config/db")

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const createError = require('http-errors');
const passport = require('./config/passport');
const { error } = require('console');

const store = MongoStore.create({
    mongoUrl: process.env.DATABASE
});

require('dotenv').config({ path: 'variables.env'})

const app = express();

// Habilitar bodyparser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


// Habilitar handlebars como view
app.engine('handlebars',
    exphbs.engine({
        defaultLayout: 'layout',
        helpers: require('./helpers/handlebars')
    })
);
app.set('view engine', 'handlebars')

// static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: store
}));

// Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Alertas y flash messages
app.use(flash());

// Crear nuestro Middleware
app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    next();
});

app.use('/',router());

// 404 pagina no existente
app.use((req, res , next) => {
    next(createError(404, 'No Encontrado'))
})

// Administracion de los errores
app.use((error, req ,res) => {
    res.locals.mensaje = error.message;
    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);
    res.render('error')
})

// Dejar que heroku asigne el puerto a nuestra app
const host = '0.0.0.0';
const port = process.env.PORT;

//app.listen(process.env.PUERTO);  // forma local

// forma conectar con heroku
app.listen(port, host, () => {
    console.log('El servidor esta funcionando')
});