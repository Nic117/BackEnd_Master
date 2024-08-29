import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/utils.js';
import { UsersDTO } from '../dto/UsersDTO.js';
import "express-async-errors";

export class SessionController {
    static clearCookieAndRespond(res, message, status = 200) {
        res.clearCookie("codercookie", { httpOnly: true });
        res.setHeader("Content-Type", "application/json");
        return res.status(status).json({ payload: message });
    }

    static logout(req, res) {
        return this.clearCookieAndRespond(res, "Sesion Cerrada");
    }

    static handleError(req, res, error) {
        const errorMessage = error?.message || 'Error desconocido';
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            error: "Error en el servidor",
            detalle: errorMessage
        });
    }

    static generateToken(user) {
        const tokenData = {
            first_name: user.first_name,
            email: user.email,
            rol: user.rol,
            cart: user.cart
        };
        return jwt.sign(tokenData, SECRET, { expiresIn: "1h" });
    }

    static callbackGitHub(req, res) {
        const token = this.generateToken(req.user);
        res.cookie("codercookie", token, { httpOnly: true });
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: "Login correcto", user: req.user });
    }

    static current(req, res) {
        const userDTO = new UsersDTO(req.user);
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json(userDTO);
    }

    static async register(req, res) {
        try {
            const { web } = req.body;

            if (web) {
                return res.redirect("/login");
            } else {
                return this.clearCookieAndRespond(res, "Usuario creado exitosamente");
            }
        } catch (error) {
            console.error('Error en el registro:', error);
            return this.handleError(req, res, error);
        }
    }

    static async login(req, res) {
        try {
            const { web } = req.body;
            const user = { ...req.user };
            const token = this.generateToken(user);

            res.cookie("codercookie", token, { httpOnly: true });

            if (web) {
                return res.redirect("/products");
            } else {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ payload: "Login correcto", user, token });
            }
        } catch (error) {
            return this.handleError(req, res, error);
        }
    }
}
