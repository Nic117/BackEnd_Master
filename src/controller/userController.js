import jwt from "jsonwebtoken";
import { SECRET, generaHash, validaPassword } from "../utils/utils.js";
import { isValidObjectId } from "mongoose";
import { userService } from "../services/userService.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { CustomError } from "../utils/CustomError.js";
import { logger } from "../utils/Logger.js";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Determina el entorno y carga el archivo de configuración correspondiente
const mode = process.env.MODE || 'dev';
dotenv.config({ path: `.env.${mode}` });

export class UserController {

    static resetPassword = async (req, res, next) => {
        const { email } = req.body;

        logger.info(`Restableciendo contraseña para el usuario: ${email}`);

        if (!email) {
            logger.warn("Email no proporcionado");
            return res.status(400).json({ status: "error", message: "Email no proporcionado" });
        }

        try {
            const usuario = await userService.getUsersBy({ email });
            if (!usuario) {
                logger.warn(`El email ${email} no está registrado`);
                return res.status(404).json({ status: "error", message: "El correo electrónico no se encuentra registrado" });
            }

            const token = jwt.sign({ email: usuario.email, _id: usuario._id }, process.env.SECRET, { expiresIn: "1h" });
            res.cookie("usercookie", token, { httpOnly: true });

            const transport = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            await transport.sendMail({
                from: `Recuperación de contraseña <${process.env.EMAIL_USER}>`,
                to: email,
                subject: "Código de recuperación de contraseña",
                html: `
                    <div>
                        <h1>¿Olvidaste tu contraseña?</h1>
                        <h3>No te preocupes, con solo dos pasos ya tendrás tu cuenta nuevamente.</h3>
                    </div>
                    <div>
                        <p>Por favor, haz <a href="http://localhost:8080/newpassword/${token}">click aqui</a> para restablecer tu contraseña</p>
                        <br>
                        <p>El código para recuperar tu contraseña es: ${token}<br>Si no fuiste tú quién lo solicitó, ignora este mensaje.</p>
                    </div>
                `
            });

            logger.info(`Correo de recuperación de contraseña enviado al usuario ${email}`);
            res.status(200).json({ status: "success", message: `Recibirá un correo en ${usuario.email} para restablecer su contraseña` });
        } catch (error) {
            next(error);
        }
    }

    static createNewPassword = async (req, res, next) => {
        logger.info("Reiniciando la contraseña");

        if (!req.cookies.usercookie) {
            return res.status(400).json({ status: "error", message: "Token inválido o ha expirado" });
        }

        const { password } = req.body;
        const token = req.params.token;

        try {
            const decoded = jwt.verify(token, process.env.SECRET);
            const userId = decoded._id;

            const user = await userService.getUserId(userId);
            if (!user) {
                return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
            }

            if (validaPassword(password, user.password)) {
                return res.status(400).json({ status: "error", message: "La nueva contraseña no puede ser igual a la anterior" });
            }

            const hashedPassword = generaHash(password);
            const updatedUser = await userService.updatePassword(userId, hashedPassword);

            if (!updatedUser) {
                return res.status(500).json({ status: "error", message: "Error al actualizar la contraseña del usuario" });
            }

            res.clearCookie("usercookie");
            logger.info("Contraseña actualizada con éxito");
            res.status(200).json({ status: "success", message: "Contraseña actualizada con éxito" });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                logger.error('Token inválido o expirado');
                return res.status(400).json({ status: "error", message: "Token inválido o expirado" });
            }
            next(error);
        }
    }

    static userPremium = async (req, res, next) => {
        const { uid } = req.params;

        logger.info(`Solicitud para cambiar el rol del usuario: ${uid}`);

        if (!isValidObjectId(uid)) {
            return res.status(400).json({ status: "error", message: "Ingrese un ID válido de MONGODB" });
        }

        try {
            const user = await userService.getUserId(uid);
            if (!user) {
                return res.status(404).json({ status: "error", message: `No existe el usuario con id ${uid}` });
            }

            if (!user.rol) {
                return res.status(404).json({ status: "error", message: "El usuario no tiene la propiedad 'rol'" });
            }

            switch (user.rol) {
                case "usuario":
                    user.rol = "premium";
                    break;
                case "premium":
                    user.rol = "usuario";
                    break;
                default:
                    return res.status(400).json({ status: "error", message: `Rol de usuario desconocido: ${user.rol}` });
            }

            const updateUser = await userService.updateRol(uid, user.rol);
            logger.info(`Usuario actualizado a rol: ${updateUser.rol}`);
            res.status(200).json({ status: "success", updateUser });
        } catch (error) {
            next(error);
        }
    }

    static getUsers = async (req, res, next) => {
        try {
            const users = await userService.getAllUser();
            res.status(200).json({ status: "success", users });
        } catch (error) {
            next(error);
        }
    }
}
