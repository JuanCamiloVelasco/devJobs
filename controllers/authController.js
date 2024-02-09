const mongoose = require('mongoose');
const passport = require('passport');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email')

exports.autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/administracion',
    failureRedirect : '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage : 'Ambos Campos Son Obligatorios'
});

// Revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req, res, next) => {

    // Revisar el usuario
    if(req.isAuthenticated()){
        return next(); // esta utenticado
    }

    // redireccionar
    res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async (req, res) => {

    // Consultar el usuario autenticado
    const vacantes = await Vacante.find({ autor: req.user._id }).lean();

    res.render('administracion', {
        nombrePagina: 'Panel de Administracion',
        tagline: 'Crea y administra tus vacantes desde aqui',
        cerrarSesion: true,
        nombre : req.user.nombre,
        imagen : req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res) => {
    req.logout();
    req.flash('correcto', 'Cerraste Sesion Correctamente');
    return res.redirect('/iniciar-sesion');
}

/**  formulario para reiniciar password*/
exports.formReestablecerPassword = (req,res) => {
    res.render('reestablecer-password', {
        nombrePagina: 'Reestablece tu password',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu password coloca tu email'
    })
}

// Genera el token en la tabla del usuario
exports.enviarToken = async (req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email });

    if(!usuario) {
        req.flash('error', 'no existe esa cuenta'),
        res.redirect('/iniciar-sesion');
    }

    // El usuario existe generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000// este valor son milisegundos;

    // Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    // enviar notificacion por email
    await enviarEmail.enviar({
        usuario,
        subject : 'Password Reset',
        resetUrl,
        archivo: 'reset'
    });


    // todo correcto
    req.flash('correcto', 'revisa tu email para las indicaciones');
    res.redirect('/iniciar-sesion');
}

// valida si el token es valido y el usuario existe, museta la vista
exports.reestablecerPassword = async (req,res) => {
    const usuario = await Usuarios.findOne({ 
        token : req.params.token,
        expira : {
            $gt : Date.now()
        }
    });

    if(!usuario) {
        req.flash('error', 'El formulario no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    // Todo bien, mostrar el formulario
    res.render('nuevo-password', {
        nombrePagina : 'Nuevo Password'
    })
}

// Almacena el nuevo passowrd en la base de datos
exports.guardarPassword = async (req, res) => {
    const usuario = await Usuarios.findOne({ 
        token : req.params.token,
        expira : {
            $gt : Date.now()
        }
    });

    // No existe el usuario o el token es invalido
    if(!usuario) {
        req.flash('error', 'El formulario no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    // Asignar nuevopassword, limpiar valores previos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    // agregar y eliminar valores del objeto
    await usuario.save();

    //redirigir
    req.flash('correcto', 'Password Modificado Correctamente');
    res.redirect('/iniciar-sesion');
}