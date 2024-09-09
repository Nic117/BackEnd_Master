import jwt from "jsonwebtoken";
import { SECRET, generaHash, validaPassword } from "../utils/utils.js";
import { isValidObjectId } from "mongoose";
import { userService } from "../services/userService.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";
import { CustomError } from "../utils/CustomError.js";
import { logger } from "../utils/Logger.js";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
        user: "enzodiazs7e@gmail.com",
        pass: "",
    },
});

const validDocumentTypes = ["ID", "adress", "statement"];

const updateUserDocumentRecords = async (uid, documents, avatar) => {
    try {
        let user = await userService.getUserId({ _id: uid });
        if (!user) throw new Error("Usuario no encontrado.");

        if (documents) {
            documents.forEach(doc => {
                if (!validDocumentTypes.includes(doc.docType)) {
                    throw new Error(`Tipo de documento inválido: ${doc.docType}`);
                }

                const existingDocumentIndex = user.documents.findIndex(existingDoc => existingDoc.docType === doc.docType);
                existingDocumentIndex !== -1 ? user.documents[existingDocumentIndex] = doc : user.documents.push(doc);
            });
        }

        const update = { ...documents && { documents: user.documents }, ...avatar && { avatar } };
        await userService.updateUser(uid, update);

        return { message: "Documentos actualizados!" };
    } catch (error) {
        return { error: error.message };
    }
};

export class UserController {

    static resetPassword = async (req, res, next) => {
        const { email } = req.body;
        logger.info(`Restableciendo contraseña para el usuario: ${email}`);

        try {
            let usuario = await userService.getUsersBy({ email });
            if (!usuario) {
                logger.warn(`El email ${email} no está registrado`);
                throw CustomError.createError("resetPassword --> UserController", "Email no encontrado", "El correo electrónico no se encuentra registrado", TIPOS_ERROR.NOT_FOUND);
            }

            const token = jwt.sign({ email: usuario.email, _id: usuario._id }, SECRET, { expiresIn: "1h" });
            res.cookie("usercookie", token, { httpOnly: true });

            await transporter.sendMail({
                from: "Recuperación de contraseña <>",
                to: email,
                subject: "Código de recuperación de contraseña",
                html: `
                    <div>
                        <h1>¿Olvidaste tu contraseña?</h1>
                        <h3>No te preocupes, con solo dos pasos ya tendrás tu cuenta nuevamente.</h3>
                    </div>
                    <div>
                        <p>Por favor, haz <a href="http://localhost:8080/newpassword/${token}">click aquí</a> para restablecer tu contraseña</p>
                        <br>
                        <p>El código para recuperar tu contraseña es: ${token}<br>Si no fuiste tú quien lo solicitó, ignora este mensaje.</p>
                    </div>
                `
            });

            logger.info(`Correo de recuperación de contraseña enviado al usuario ${email}`);
            res.status(200).json(`Recibirá un correo en ${usuario.email} para restablecer su contraseña`);
        } catch (error) {
            return next(error);
        }
    };

    static createNewPassword = async (req, res, next) => {
        logger.info("Reiniciando la contraseña");

        if (!req.cookies.usercookie) {
            return CustomError.createError("createNewPassword --> UserController", "Token inválido", "El token es inválido o ha expirado", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        const { password } = req.body;
        const token = req.params.token;

        try {
            const decoded = jwt.verify(token, SECRET);
            const user = await userService.getUserId(decoded._id);
            if (!user) throw CustomError.createError("createNewPassword --> UserController", "Usuario no encontrado", "El usuario con el ID proporcionado no existe", TIPOS_ERROR.NOT_FOUND);

            if (validaPassword(password, user.password)) {
                throw CustomError.createError("createNewPassword --> UserController", "Contraseña repetida", "La nueva contraseña no puede ser igual a la anterior", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const hashedPassword = generaHash(password);
            const updatedUser = await userService.updatePassword(decoded._id, hashedPassword);
            if (!updatedUser) throw CustomError.createError("createNewPassword --> UserController", "Error al actualizar la contraseña", "Error al actualizar la contraseña del usuario", TIPOS_ERROR.INTERNAL_SERVER_ERROR);

            res.clearCookie("usercookie");
            logger.info("Contraseña actualizada con éxito");
            res.status(200).json({ status: "success", message: "Contraseña actualizada con éxito" });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                logger.error('Token inválido o expirado');
                res.status(400).json({ status: "error", message: "Token inválido o expirado" });
            } else {
                return next(error);
            }
        }
    };

    static userPremium = async (req, res, next) => {
        const { uid } = req.params;
        logger.info(`Solicitud para cambiar el rol del usuario: ${uid}`);

        if (!isValidObjectId(uid)) {
            throw CustomError.createError("userPremium --> UserController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        try {
            const user = await userService.getUserId({ _id: uid });
            if (!user) throw CustomError.createError("userPremium --> UserController", "Usuario no encontrado", `No existe el usuario con id ${uid}`, TIPOS_ERROR.NOT_FOUND);

            if (user.rol === "admin") {
                user.rol = user.rol === "usuario" ? "premium" : "usuario";
                const updatedUser = await userService.updateRol(uid, user.rol);
                logger.info(`Usuario actualizado a rol: ${updatedUser.rol}`);
                return res.status(200).send({ status: "success", updatedUser });
            }

            const missingDocs = validDocumentTypes.filter(doc => !user.documents.some(document => document.docType === doc));
            if (missingDocs.length === 0) {
                user.rol = user.rol === "usuario" ? "premium" : "usuario";
                const updatedUser = await userService.updateRol(uid, user.rol);
                logger.info(`Usuario actualizado a rol: ${updatedUser.rol}`);
                res.status(200).send({ status: "success", updatedUser });
            } else {
                throw CustomError.createError("userPremium --> UserController", "Faltan documentos requeridos", `Faltan documentos requeridos: ${missingDocs.join(", ")}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }
        } catch (error) {
            return next(error);
        }
    };

    static uploadUserDocuments = async (req, res, next) => {
        try {
            logger.info(`Inicio del proceso de carga de documentos del usuario`);
            const { uid } = req.params;
            const { document_type } = req.query;
            const uploadedFiles = req.files;

            if (!uploadedFiles || uploadedFiles.length === 0) {
                throw CustomError.createError("uploadUserDocuments --> UserController", "No se recibieron archivos", "Error en la subida de archivos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            const documentsToSave = [];
            let avatarToSave = null;

            uploadedFiles.forEach((file) => {
                const reference = file.fieldname === "file" && file.mimetype.startsWith("image")
                    ? `/public/assets/img/profiles/${uid}/${file.filename}`
                    : `/public/assets/documents/${uid}/${file.filename}`;

                if (file.mimetype.startsWith("image")) {
                    if (!avatarToSave) avatarToSave = { name: file.filename, reference };
                } else {
                    documentsToSave.push({ name: file.filename, reference, docType: document_type });
                }
            });

            const response = await updateUserDocumentRecords(uid, documentsToSave, avatarToSave);
            res.status(200).send({ status: "success", ...response });
        } catch (error) {
            return next(error);
        }
    };

    static getUsers = async (req, res) => {
        const users = await userService.getAllUser();
        res.status(200).json({ users });
    };

    static deleteUsers = async (req, res) => {
        try {
            const inactiveDateLimit = new Date();
            inactiveDateLimit.setDate(inactiveDateLimit.getDate() - 2);
            logger.info(`Fecha y hora de hace dos días: ${inactiveDateLimit}`);

            const usersToDelete = await userService.getAllUsers({ last_connection: { $lt: inactiveDateLimit } });
            logger.info(`Usuarios a eliminar: ${usersToDelete.length}`);

            for (const user of usersToDelete) {
                const message = `Hola ${user.first_name}, tu cuenta ha sido eliminada por inactividad.`;

                if (user.email) {
                    await transporter.sendMail({
                        from: "Eliminación de cuenta <>",
                        to: user.email,
                        subject: "Cuenta eliminada por inactividad",
                        html: `<p>${message}</p>`
                    });
                }

                await userService.deleteUser({ _id: user._id });
                logger.info(`Usuario ${user._id} eliminado correctamente.`);
            }

            res.status(200).json({ status: "success", message: "Usuarios inactivos eliminados" });
        } catch (error) {
            logger.error("Error al eliminar usuarios inactivos:", error);
            res.status(500).json({ status: "error", message: "Error al eliminar usuarios inactivos." });
        }
    };
}

