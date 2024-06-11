import { Router } from 'express';
import UserManager from '../dao/UsersManager.js';
import passport from 'passport';
import jwt from 'jsonwebtoken'
import { SECRET } from '../utils.js'
import { error } from 'console';
import { passportCall } from '../middleware/passportMiddleware.js';
export const router = Router()
const userManager = new UserManager();

router.get('/logout', (req, res) => {
    res.clearCookie("codercookie", { httpOnly: true })

    res.setHeader("Content-Type", "text/html")
    return res.status(200).json({ payload: "sesion cerrada" });
})

router.get('/error', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json(
        {
            error: `Error interno servidor`,
            detalle: `${error.message}`
        }
    )

})

router.get('/github', passport.authenticate("github", {}), (req, res) => { })

router.get('/callbackGitHub', passport.authenticate("github", { failureRedirect: "/api/sessions/error", session: false }), (req, res) => {
    let tokenData = {
        first_name: req.user.first_name,
        email: req.user.email,
        rol: req.user.rol,
        cart: req.user.cart
    }
    let token = jwt.sign(tokenData, SECRET, { expiresIn: "1h" })
    res.cookie("codercookie", token, { httpOnly: true })
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ payload: "Login correcto", user: req.user });
})

router.get("/current", passport.authenticate("current", { failureRedirect: "/api/sessions/error", session: false }), (req, res) => {
    res.setHeader("Content-Type", "application/json")
    return res.status(200).json(req.user)
})

router.post('/register', passport.authenticate("registro", { failureRedirect: "/api/sessions/error" }), async (req, res) => {
    let web = req.body;

    if (web) {
        res.redirect("/login")
    } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: `Usuario creado!`, user: req.user });
    }

})

router.post('/login', passport.authenticate("login", { failureRedirect: "/api/sessions/error", session: false }), async (req, res) => {
    let { web } = req.body;
    let user = { ...req.user }
    delete user.password
    let token = jwt.sign(user, SECRET, { expiresIn: "1h" })
    res.cookie("codercookie", token, { httpOnly: true })

    if (web) {
        res.redirect("/products")
    } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: "Login correcto", user, token });
    }
})