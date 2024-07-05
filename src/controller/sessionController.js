import jwt from 'jsonwebtoken'
import { SECRET } from '../utils.js'

export class SessionController {
    static logout = (req, res) => {
        res.clearCookie("codercookie", { httpOnly: true })
        res.setHeader("Content-Type", "text/html")
        return res.status(200).json({ payload: "Cerraste la sesión con éxito" });
    }

    static error = (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json(
            {
                error: `Error inesperado en el servidor `,
                detalle: `${error.message}`
            }
        )
    }

    static callbackGitHub = (req, res) => {
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
    }

    static current = (req, res) => {
        res.setHeader("Content-Type", "application/json")
        return res.status(200).json(req.user)
    }

    static register = async (req, res) => {
        let web = req.body;
        if (web) {
            res.redirect("/login")
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ payload: `Usuario creado exitosamente`, user: req.user });
        }
    }

    static login = async (req, res) => {
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
    }
}