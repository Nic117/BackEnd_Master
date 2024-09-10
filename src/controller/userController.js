import jwt from "jsonwebtoken"
import { SECRET, generaHash, validaPassword } from "../utils/utils.js"
import { isValidObjectId } from "mongoose"
import { userService } from "../services/userService.js"
import { TIPOS_ERROR } from "../utils/EErrors.js"
import { CustomError } from "../utils/CustomError.js"
import { logger } from "../utils/Logger.js"
import nodemailer from 'nodemailer'
import { config } from "../config/config.js"
import { GetUsersDTO } from "../dto/getUserDTO.js"


const updateUserDocumentRecords = async (uid, documents, avatar) => {
    try {
        let user = await userService.getUserId({ _id: uid })
        if (!user) {
            throw new Error("Usuario no encontrado.");
        }

        let update = {};

        if (documents) {
            const validDocumentTypes = ["ID", "adress", "statement"];
            for (const doc of documents) {
                if (validDocumentTypes.includes(doc.docType)) {
                    const existingDocumentIndex = user.documents.findIndex((existingDoc) => existingDoc.docType === doc.docType);

                    if (existingDocumentIndex !== -1) {
                        user.documents[existingDocumentIndex] = doc;
                    } else {
                        user.documents.push(doc);
                    }
                } else {
                    throw new Error(`Tipo de documento inválido: ${doc.docType}`);
                }
            }
            update.documents = user.documents;
        }

        if (avatar) {
            update.avatar = avatar;
        }
        await userService.updateUser(uid, update);
        return { message: "Documentos actualizados correctamente" };
    } catch (error) {
        return { error: error.message };
    }
};



export class UserController {


    static resetPassword = async (req, res, next) => {
        let { email } = req.body
        logger.info(`Restableciendo contraseña para el usuario: ${email}`)

        try {
            let usuario = await userService.getUsersBy({ email: email })

            let token = jwt.sign({ email: usuario.email, _id: usuario._id }, SECRET, { expiresIn: "1h" })
            res.cookie("usercookie", token, { httpOnly: true })

            if (!usuario) {
                logger.warn(`El email ${email} no está registrado`);
                CustomError.createError("resetPassword --> UserController", "Email no encontrado", "El correo electrónico no se encuentra registrado", TIPOS_ERROR.NOT_FOUND)
            }

            const transport = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                auth: {
                    user: `${config.APP_MAIL_DIR}`,
                    pass: `${config.APP_MAIL_PASS}`,
                },
            })

            await transport.sendMail({
                from: `Recuperación de contraseña <${config.APP_MAIL_DIR}>`,
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
            })

            logger.info(`Correo de recuperación de contraseña enviado al usuario ${email}`);
            res.setHeader("Content-Type", "text/html")
            res.status(200).json(`Recibirá un correo en ${usuario.email} para restablecer su contraseña`)
        } catch (error) {
            return next(error)
        }
    }

    static createNewPassword = async (req, res, next) => {
        logger.info("Reiniciando la contraseña");

        if (!req.cookies.usercookie) {
            return CustomError.createError("createNewPassword --> UserController", "Token inválido", "El token es inválido o ha expirado", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
        }

        let { password } = req.body;
        let token = req.params.token;

        try {
            let decoded = jwt.verify(token, SECRET);
            let id = decoded._id;
            const user = await userService.getUserId(id);
            if (!user) {
                return CustomError.createError("createNewPassword --> UserController", "Usuario no encontrado", "El usuario con el ID proporcionado no existe", TIPOS_ERROR.NOT_FOUND);
            }

            if (validaPassword(password, user.password)) {
                return CustomError.createError("createNewPassword --> UserController", "Contraseña repetida", "La nueva contraseña no puede ser igual a la anterior", TIPOS_ERROR.ARGUMENTOS_INVALIDOS);
            }

            logger.info("La contraseña es válida, hasheando y actualizando");

            let hashedPassword = generaHash(password);
            let updatedUser = await userService.updatePassword(id, hashedPassword);

            if (!updatedUser) {
                logger.error("Error al actualizar la contraseña del usuario");
                return CustomError.createError("createNewPassword --> UserController", "Error al actualizar la contraseña", "Error al actualizar la contraseña del usuario", TIPOS_ERROR.INTERNAL_SERVER_ERROR);
            }

            res.clearCookie("usercookie");
            logger.info("Contraseña actualizada con éxito");
            return res.status(200).json({ status: "success", message: "Contraseña actualizada con éxito" });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                logger.error('Token inválido o expirado');
                return res.status(400).json({ status: "error", message: "Token inválido o expirado" });
            }
            return next(error);
        }
    }

    static userPremium = async (req, res, next) => {

        let { uid } = req.params

        logger.info(`Solicitud para cambiar el rol del usuario: ${uid}`);

        if (!isValidObjectId(uid)) {
            res.setHeader("Content-Type", "application/json")
            CustomError.createError("userPremium --> UserController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        try {
            let user = await userService.getUserId({ _id: uid })
            if (!user) {
                res.setHeader("Content-Type", "application/json")
                CustomError.createError("userPremium --> UserController", "Usuario no encontrado", `No existe el usuario con id ${uid}`, TIPOS_ERROR.NOT_FOUND)
            }

            if (!user.rol) {
                logger.error(`El usuario no tiene la propiedad 'rol'`);
                CustomError.createError("userPremium --> UserController", "El usuario no tiene la propiedad 'rol'", "El usuario no tiene la propiedad 'rol'", TIPOS_ERROR.NOT_FOUND)
            }

            logger.info(`Usuario obtenido: ${JSON.stringify(user)}`);

            if (user.rol === "admin") {
                switch (user.rol) {
                    case "usuario":
                        user.rol = "premium";
                        break;
                    case "premium":
                        user.rol = "usuario";
                        break;
                    default:
                        logger.error(`Rol desconocido: ${user.rol}`);
                        CustomError.createError("userPremium --> UserController", "Rol desconocido", `Rol de usuario desconocido: ${user.rol}, TIPOS_ERROR.ARGUMENTOS_INVALIDOS`)
                }

                logger.info(`Nuevo rol del usuario: ${user.rol}`);

                const updateUser = await userService.updateRol(uid, user.rol)
                logger.info(`Usuario actualizado a rol: ${updateUser.rol}`);
                res.status(200).send({ status: "success", updateUser });
                return
            }

            const necessaryDocs = ["ID", "adress", "statement"];
            const missingDocs = necessaryDocs.filter((doc) => !user.documents.some((document) => document.docType === doc))

            if (missingDocs.length === 0) {
                switch (user.rol) {
                    case "usuario":
                        user.rol = "premium";
                        break;
                    case "premium":
                        user.rol = "usuario";
                        break;
                    default:
                        logger.error(`Rol desconocido: ${user.rol}`);
                        CustomError.createError("userPremium --> UserController", "Rol desconocido", `Rol de usuario desconocido: ${user.rol}, TIPOS_ERROR.ARGUMENTOS_INVALIDOS`)
                }

                const updateUser = await userService.updateRol(uid, user.rol)
                logger.info(`Usuario actualizado a rol: ${updateUser.rol}`);
                res.status(200).send({ status: "success", updateUser });
            } else {
                req.logger.error("Faltan documentos requeridos: " + missingDocs.join(", "));
                CustomError.createError("userPremium --> UserController", "Faltan documentos requeridos", `Faltan documentos requeridos: ${missingDocs}, TIPOS_ERROR.ARGUMENTOS_INVALIDOS`)
            }
        } catch (error) {
            return next(error)
        }
    }

    static uploadUserDocuments = async (req, res, next) => {
        try {
            req.logger.info(`Inicio del proceso de carga de documentos del usuario`);
            const { uid } = req.params;
            const { document_type } = req.query;
            const uploadedFiles = req.files;

            if (!uploadedFiles || uploadedFiles.length === 0) {
                CustomError.createError("uploadUserDocuments --> UserController", "No se recibieron archivos", `Error en la subida de archivos, TIPOS_ERROR.ARGUMENTOS_INVALIDOS`)
            }

            const documentsToSave = [];
            let avatarToSave = null;

            uploadedFiles.forEach((file) => {
                const docType = req.query.document_type;

                if (!docType) {
                    return res.status(400).send({ status: "error", error: "document_type no proporcionado" });
                }

                let reference;
                if (file.fieldname === "file") {
                    if (file.mimetype.startsWith("image")) {
                        if (!avatarToSave) {
                            reference = `/assets/img/profiles/${uid}/${file.filename}`;
                            avatarToSave = {
                                name: file.filename,
                                reference: reference,
                            };
                        }
                    } else {
                        reference = `/assets/documents/${uid}/${file.filename}`;
                        documentsToSave.push({
                            name: file.filename,
                            reference: reference,
                            docType: document_type,
                        });
                    }
                }
            });
            console.log('Avatar Path:', avatarToSave ? avatarToSave.reference : 'No se ha guardado un avatar');

            const response = await updateUserDocumentRecords(uid, documentsToSave, avatarToSave);

            if (avatarToSave) {
                await userService.updateUser(uid, { avatar: avatarToSave.reference });
            }

            return res.status(200).send({ status: "success", ...response });
        } catch (error) {
            return next(error)
        }
    };

    static getUsers = async (req, res) => {
        let users = await userService.getAllUser()
        let userDTOs = users.map(user => new GetUsersDTO(user));

        return res.status(200).json(userDTOs)
    }

    static deleteUsers = async (req, res) => {
        const { logger } = req;
        try {
            const usersToDelete = await userService.getInactiveUsers(2);
            logger.info(`Usuarios a eliminar: ${usersToDelete.length}`);

            const usersToDeleteFiltered = usersToDelete.filter(user => user.rol !== 'admin');
            logger.info(`Usuarios a eliminar después de filtrar administradores: ${usersToDeleteFiltered.length}`);

            const emailsToDelete = usersToDeleteFiltered.map(user => user.email).filter(email => email);
            logger.info(`Correos electrónicos a eliminar: ${emailsToDelete.length}`);
            logger.info(`Correos electrónicos: ${JSON.stringify(emailsToDelete)}`);


            const transport = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                auth: {
                    user: `${config.APP_MAIL_DIR}`,
                    pass: `${config.APP_MAIL_PASS}`,
                },
            })

            for (const user of usersToDelete) {

                if (user.email) {
                    await transport.sendMail({
                        from: `Eliminación de cuenta <${config.APP_MAIL_DIR}>`,
                        to: user.email,
                        subject: "AVISO - Eliminación de cuenta",
                        html: `
                    <div>
                        <h1>Hace mucho no te vemos, ${user.first_name}.</h1>
                        <h3>Lamentamos comunicarte que la cuenta asociada con este email ha sido eliminada por inactividad.</h3>
                    </div>
                    <div>
                        <p>Pero no te preocupes, siempre podés volver a registrarte <a href="http://localhost:8080/register">haciendo click aqui</a></p>
                        <br>
                        <p>Esperamos volver a verte pronto!.</p>
                    </div>
                    `
                    });
                    logger.info(`Correo enviado a: ${user.email}`);
                } else {
                    logger.warning(`No se pudo enviar correo al usuario ya que no posee dirección de correo electrónico.`);
                }

                if (user.cart && user.cart[0]) {
                    await deleteUserCart(user.cart[0]._id);
                    logger.info(`Carrito eliminado para el usuario: ${user._id}`);
                }
            }

            if (emailsToDelete.length > 0) {
                await userService.deleteUserByEmail(emailsToDelete);
                logger.info(`Usuarios eliminados correctamente. Total eliminados: ${emailsToDelete.length}`);
            } else {
                logger.info(`No hay usuarios para eliminar.`);
            }
            res.json({ message: "Usuarios eliminados correctamente" });
        } catch (error) {
            logger.error(`Error al eliminar usuarios: ${error.message}`);
            res.status(500).json({ message: "Hubo un error al eliminar los usuarios" });
        }
    };

    static deleteUser = async (req, res, next) => {
        const { uid } = req.params;
        try {
            const userToDelete = await userService.getUserId(uid);

            if (!userToDelete) {
                return CustomError.createError("createNewPassword --> UserController", "Usuario no encontrado", "El usuario con el ID proporcionado no existe", TIPOS_ERROR.NOT_FOUND);
            }

            const transport = nodemailer.createTransport({
                service: "gmail",
                port: 587,
                auth: {
                    user: `${config.APP_MAIL_DIR}`,
                    pass: `${config.APP_MAIL_PASS}`,
                },
            })

            if (userToDelete.email) {
                transport.sendMail({
                    from: `Eliminación de cuenta <${config.APP_MAIL_DIR}>`,
                    to: userToDelete.email,
                    subject: "AVISO - Eliminación de cuenta",
                    html: `
                <div>
                    <h1>Hola, ${userToDelete.first_name}.</h1>
                    <h3>Lamentamos comunicarte que la cuenta asociada con este email ha sido eliminada por el administrador.</h3>
                </div>
                <div>
                    <p>Pero no te preocupes, siempre podés volver a registrarte <a href="http://localhost:8080/register">haciendo click aqui</a></p>
                    <br>
                    <p>Esperamos volver a verte pronto!.</p>
                </div>
                `
                });
                req.logger.info(`Correo enviado a: ${userToDelete.email}`);
            } else {
                req.logger.warning(
                    `No se pudo enviar correo a ${userToDelete.first_name} (${userToDelete._id}) porque no tiene una dirección de correo electrónico.`
                );
            }

            await userService.deleteUserByEmail({ email: userToDelete.email });
            req.logger.info(`Usuario con ID ${uid} eliminado correctamente.`);
            res.json({ message: "Usuario eliminado correctamente" });
        } catch (error) {
            return next(error)
        }
    };
}
