import jwt from "jsonwebtoken";
import { SECRET } from "../utils.js";

export const verifyJWT = (req, res, next) => {
    const token = req.cookies["codercookie"];
    if (!token) {
        return res.status(401).json({ error: "No hay usuarios autenticados" });
    }
    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            console.error(`Error al verificar token JWT: ${err.message}`);
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
};

export const auth = (permisos = []) => {
    return (req, res, next) => {
        permisos = permisos.map(p => p.toLowerCase());

        if (!req.user?.rol) {
            return res.status(401).json({ error: "No hay usuarios autenticados" });
        }

        if (!permisos.includes(req.user.rol.toLowerCase())) {
            return res.status(403).json({ error: "El usuario no tiene permisos" });
        }

        next();
    };
};
