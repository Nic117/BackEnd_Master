import jwt from 'jsonwebtoken';
import { SECRET } from '../utils/utils.js';
import { UsersDTO } from '../dto/UsersDTO.js';
import "express-async-errors";

export class SessionController {

    static logout = (req, res) => {
        res.clearCookie("codercookie", { httpOnly: true });
        res.status(200).json({ payload: "Cerraste la sesión con éxito" });
    };

    static error = (req, res, error) => {
        const errorMessage = error?.message || 'Error desconocido';
        res.status(500).json({
            error: "Error en el servidor",
            detalle: errorMessage
        });
    };

    static callbackGitHub = (req, res) => {
        const tokenData = {
            first_name: req.user.first_name,
            email: req.user.email,
            rol: req.user.rol,
            cart: req.user.cart
        };
        const token = jwt.sign(tokenData, SECRET, { expiresIn: "1h" });
        res.cookie("codercookie", token, { httpOnly: true });
        res.status(200).json({ payload: "Login correcto", user: req.user });
    };

    static current = (req, res) => {
        const userDTO = new UsersDTO(req.user);
        res.status(200).json(userDTO);
    };

    static register = async (req, res) => {
        try {
            const { web } = req.body;
            if (web) {
                return res.redirect("/login");
            }
            res.status(200).json({ payload: "Usuario creado exitosamente", user: req.user });
        } catch (error) {
            return SessionController.handleServerError(res, error, 'Error en el registro');
        }
    };

    static login = async (req, res) => {
        try {
            const { web } = req.body;
            const token = jwt.sign({ ...req.user }, SECRET, { expiresIn: "1h" });
            res.cookie("codercookie", token, { httpOnly: true });

            if (web) {
                return res.redirect("/products");
            }
            res.status(200).json({ payload: "Login correcto", user: req.user, token });
        } catch (error) {
            return SessionController.handleServerError(res, error, 'Error en el login');
        }
    };

    static handleServerError(res, error, customMessage) {
        console.error(customMessage, error);
        return res.status(500).json({
            error: "Error en el servidor",
            detalle: error.message || 'Error desconocido'
        });
    }
}
