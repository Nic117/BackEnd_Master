import jwt from "jsonwebtoken";
import { SECRET, generaHash, validaPassword } from "../utils/utils.js";
import { isValidObjectId } from "mongoose";
import { userService } from "../services/userService.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { CustomError } from "../utils/CustomError.js";
import { logger } from "../utils/Logger.js";
import nodemailer from 'nodemailer';

export class UserController {
    static async resetPassword(req, res, next) {
        const { email } = req.body;
        logger.info(`Restableciendo contraseña para el usuario: ${email}`);

        try {
            const usuario = await userService.getUsersBy({ email });

            if (!usuario) {
                logger.warn(`El email ${email} no está registrado`);
                return next(CustomError.createError("resetPassword --> UserController", "Email no encontrado", "El correo electrónico no se encuentra registrado", TIPOS_ERROR.NOT_FOUND));
            }

            const token = jwt.sign({ email: usuario.email, _id: usuario._id }, SECRET, { expiresIn: "1h" });
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
                `,
            });

            logger.info(`Correo de recuperación de contraseña enviado al usuario ${email}`);
            res.setHeader("Content-Type", "text/html");
            res.status(200).json(`Recibirá un correo en ${usuario.email} para restablecer su contraseña`);
        } catch (error) {
            next(error);
        }
    }

    static async createNewPassword(req, res, next) {
        logger.info("Reiniciando la contraseña");

        if (!req.cookies.usercookie) {
            return next(CustomError.createError("createNewPassword --> UserController", "Token inválido", "El token es inválido o ha expirado", TIPOS_ERROR.ARGUMENTOS_INVALIDOS));
        }

        const { password } = req.body;
        const token = req.params.token;

        try {
            const decoded = jwt.verify(token, SECRET);
            const id = decoded._id;

            const user = await userService.getUserId(id);
            if (!user) {
                return next(CustomError.createError("createNewPassword --> UserController", "Usuario no encontrado", "El usuario con el ID proporcionado no existe", TIPOS_ERROR.NOT_FOUND));
            }

            if (validaPassword(password, user.password)) {
                return next(CustomError.createError("createNewPassword --> UserController", "Contraseña repetida", "La nueva contraseña no puede ser igual a la anterior", TIPOS_ERROR.ARGUMENTOS_INVALIDOS));
            }

            logger.info("La contraseña es válida, hasheando y actualizando");

            const hashedPassword = generaHash(password);
            const updatedUser = await userService.updatePassword(id, hashedPassword);

            if (!updatedUser) {
                logger.error("Error al actualizar la contraseña del usuario");
                return next(CustomError.createError("createNewPassword --> UserController", "Error al actualizar la contraseña", "Error al actualizar la contraseña del usuario", TIPOS_ERROR.INTERNAL_SERVER_ERROR));
            }

            res.clearCookie("usercookie");
            logger.info("Contraseña actualizada con éxito");
            res.status(200).json({ status: "success", message: "Contraseña actualizada con éxito" });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                logger.error('Token inválido o expirado');
                res.status(400).json({ status: "error", message: "Token inválido o expirado" });
            } else {
                next(error);
            }
        }
    }

    static async userPremium(req, res, next) {
        const { uid } = req.params;
        logger.info(`Solicitud para cambiar el rol del usuario: ${uid}`);

        if (!isValidObjectId(uid)) {
            return next(CustomError.createError("userPremium --> UserController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS));
        }

        try {
            const user = await userService.getUserId(uid);
            if (!user) {
                return next(CustomError.createError("userPremium --> UserController", "Usuario no encontrado", `No existe el usuario con id ${uid}`, TIPOS_ERROR.NOT_FOUND));
            }

            if (!user.rol) {
                logger.error(`El usuario no tiene la propiedad 'rol'`);
                return next(CustomError.createError("userPremium --> UserController", "El usuario no tiene la propiedad 'rol'", "El usuario no tiene la propiedad 'rol'", TIPOS_ERROR.NOT_FOUND));
            }

            logger.info(`Usuario obtenido: ${JSON.stringify(user)}`);

            user.rol = user.rol === "usuario" ? "premium" : "usuario";

            logger.info(`Nuevo rol del usuario: ${user.rol}`);

            const updateUser = await userService.updateRol(uid, user.rol);
            logger.info(`Usuario actualizado a rol: ${updateUser.rol}`);
            res.status(200).send({ status: "success", updateUser });
        } catch (error) {
            next(error);
        }
    }

    static async getUsers(req, res, next) {
        try {
            const users = await userService.getAllUser();
            res.status(200).json({ users });
        } catch (error) {
            next(error);
        }
    }
}

