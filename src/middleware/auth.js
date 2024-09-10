import jwt from "jsonwebtoken";
import { SECRET } from "../utils/utils.js"

export const verifyJWT = (req, res, next) => {
    const token = req.cookies["codercookie"];
    if (!token) {
        return res.status(401).json({ error: "No hay usuarios autenticados" })
    }
    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            return res.status(403).json("Token inválido");
        }
        req.user = user;

    });
    next();
}

export const auth = (permisos = []) => {
    return (req, res, next) => {

        permisos = permisos.map(p => p.toLowerCase())

        if (!req.user?.rol) {
            res.setHeader("Content-Type", "application/json")
            return res.status(401).json("No hay usuarios autenticados")
        }

        if (!permisos.includes(req.user.rol.toLowerCase())) {
            res.setHeader("Content-Type", "application/json")
            return res.status(403).json("El usuario no tiene acceso a esta ruta")
        }

        next()
    }
}

