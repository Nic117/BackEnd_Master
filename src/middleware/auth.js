import jwt from "jsonwebtoken";
import { SECRET } from "../utils/utils.js";

export const verifyJWT = (req, res, next) => {
    const token = req.cookies["codercookie"];
    if (!token) {
        return res.status(401).json({ error: "No hay usuarios autenticados" });
    }

    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token inválido" });
        }
        req.user = user;
        next();
    });
};

export const auth = (permissions = []) => {
    return (req, res, next) => {
        const userRole = req.user?.rol?.toLowerCase();
        permissions = permissions.map(permission => permission.toLowerCase());

        if (!userRole) {
            return res.status(401).json({ error: "No hay usuarios autenticados" });
        }

        if (!permissions.includes(userRole)) {
            return res.status(403).json({ error: "El usuario no tiene acceso a esta ruta" });
        }

        next();
    };
};
