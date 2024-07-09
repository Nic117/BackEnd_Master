import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/utils.js';
import { UsersDTO } from '../dto/UsersDTO.js';
import "express-async-errors";

const COOKIE_NAME = "codercookie";
const JWT_EXPIRES_IN = "1h";

export class SessionController {
    static logout = (req, res) => {
        res.clearCookie(COOKIE_NAME, { httpOnly: true });
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json({ payload: "Sesión cerrada" });
    }

    static error = (req, res, error) => {
        const errorMessage = error?.message || 'Error desconocido';
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            error: `Error en el servidor`,
            detalle: errorMessage
        });
    }

    static callbackGitHub = (req, res) => {
        try {
            const { first_name, email, rol, cart } = req.user;
            const tokenData = { first_name, email, rol, cart };
            const token = jwt.sign(tokenData, SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.cookie(COOKIE_NAME, token, { httpOnly: true });
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ payload: "Login correcto", user: req.user });
        } catch (error) {
            SessionController.error(req, res, error);
        }
    }

    static current = (req, res) => {
        res.setHeader("Content-Type", "application/json");
        const userDTO = new UsersDTO(req.user);
        return res.status(200).json(userDTO);
    }

    static register = async (req, res) => {
        try {
            const { web } = req.body;
    
            if (web) {
                res.redirect("/login");
            } else {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).json({ payload: `Usuario creado exitosamente`, user: req.user });
            }
        } catch (error) {
            SessionController.error(req, res, error);
        }
    }

    static login = async (req, res) => {
        try {
            const { web } = req.body;
            const user = { ...req.user };
            const token = jwt.sign(user, SECRET, { expiresIn: JWT_EXPIRES_IN });
            res.cookie(COOKIE_NAME, token, { httpOnly: true });

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
