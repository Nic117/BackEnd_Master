import { Router } from 'express';
import UserManager from '../dao/UsersManager.js';
import { generaHash, validaPassword } from '../utils.js';
import passport from 'passport';
import { error } from 'console';
export const router = Router()
const userManager = new UserManager();

router.get('/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json(
                {
                    error: `Error interno del servidor`,
                    detalle: `${error.message}`
                }
            )
        }
    })

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ payload: "Cerraste la sesión con éxito" });
})

router.get('/error', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json(
        {
            error: `Error interno del servidor`,
            detalle: `Fallo al autenticar: ${error.message}`
        }
    )

})

router.get('/github', passport.authenticate("github", {}), (req, res) => { })

router.get('/callbackGitHub', passport.authenticate("github", { failureRedirect: "/api/sessions/error" }), (req, res) => {
    req.session.user = req.user
    console.log(req.user)

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ payload: "Login correcto", user: req.user });
})

router.post('/register', passport.authenticate("registro", { failureRedirect: "/api/sessions/error" }), async (req, res) => {
    let web = req.body;

    if (web) {
        res.redirect("/login")
    } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: `Usuario creado exitosamente`, user: req.user });
    }

})

router.post('/login', passport.authenticate("login", { failureRedirect: "/api/sessions/error" }), async (req, res) => {
    let { web } = req.body;
    let user = { ...req.user }
    req.session.user = user

    if (web) {
        res.redirect("/products")
    } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: "Login correcto", user });
    }
})