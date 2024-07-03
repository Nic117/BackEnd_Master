import jwt from 'jsonwebtoken';
import { SECRET } from '../utils.js';

export class SessionController {
    static logout = (req, res) => {
        res.clearCookie("codercookie", { httpOnly: true });
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json({ payload: "Cerraste la sesión con éxito" });
    }

    static error = (req, res, error) => {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            error: "Error en el servidor",
            detalle: error.message
        });
    }

    static callbackGitHub = (req, res) => {
        try {
            const tokenData = {
                first_name: req.user.first_name,
                email: req.user.email,
                rol: req.user.rol,
                cart: req.user.cart
            };
            const token = jwt.sign(tokenData, SECRET, { expiresIn: "1h" });
            res.cookie("codercookie", token, { httpOnly: true });
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ payload: "Login correcto", user: req.user });
        } catch (error) {
            SessionController.error(req, res, error);
        }
    }

    static current = (req, res) => {
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(req.user);
    }

    static register = async (req, res) => {
        try {
            const { web } = req.body;
            if (web) {
                res.redirect("/login");
            } else {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ payload: "Usuario creado exitosamente", user: req.user });
            }
        } catch (error) {
            SessionController.error(req, res, error);
        }
    }

    static login = async (req, res) => {
        try {
            const { web } = req.body;
            let user = { ...req.user };
            delete user.password;
            const token = jwt.sign(user, SECRET, { expiresIn: "1h" });
            res.cookie("codercookie", token, { httpOnly: true });

            if (web) {
                res.redirect("/products");
            } else {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ payload: "Login correcto", user, token });
            }
        } catch (error) {
            SessionController.error(req, res, error);
        }
    }
}
