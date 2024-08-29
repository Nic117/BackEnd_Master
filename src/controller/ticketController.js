import UserManager from "../dao/UsersDAO.js";
import { ticketService } from "../services/ticketService.js";
import { productService } from "../services/productService.js";
import { isValidObjectId } from "mongoose";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

const userService = new UserManager();

export class TicketController {
    static async createTicket(req, res, next) {
        const { email, ticket } = req.body;

        if (!email || !ticket) {
            CustomError.createError(
                "Error",
                "Email y Ticket requerido",
                "Complete los datos",
                TIPOS_ERROR.ARGUMENTOS_INVALIDOS
            );
            return res.status(400).json({ error: "Email y Ticket requerido" });
        }

        if (!Array.isArray(ticket)) {
            CustomError.createError(
                "Error",
                "Ticket no es array",
                "El ticket tiene un formato inválido",
                TIPOS_ERROR.TIPO_DE_DATOS
            );
            return res.status(400).json({ error: "El ticket tiene un formato inválido" });
        }

        try {
            const user = await userService.getUsersBy({ email });

            if (!user) {
                CustomError.createError(
                    "Error",
                    "Usuario no encontrado",
                    "Usuario no encontrado",
                    TIPOS_ERROR.NOT_FOUND
                );
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            let total = 0;

            for (const t of ticket) {
                if (!isValidObjectId(t.pid)) {
                    CustomError.createError(
                        "Error",
                        "ID inválido",
                        "Ingrese un ID válido de MONGODB",
                        TIPOS_ERROR.ARGUMENTOS_INVALIDOS
                    );
                    continue;
                }

                const product = await productService.getProductsBy({ _id: t.pid });

                if (product) {
                    t.title = product.title;
                    t.price = product.price;
                    t.subtotal = product.price * t.quantity;
                    total += t.subtotal;
                } else {
                    CustomError.createError(
                        "Error",
                        "El producto no existe",
                        `No existe un producto con el ID: ${t.pid}`,
                        TIPOS_ERROR.ARGUMENTOS_INVALIDOS
                    );
                }
            }

            const code = `T-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const purchase_datetime = new Date();

            const newTicket = await ticketService.createTicket({
                code,
                purchase_datetime,
                purchaser: user.email,
                products: ticket,
                amount: total
            });

            return res.status(201).json(newTicket);
        } catch (error) {
            return next(error);
        }
    }

    static async getTickets(req, res) {
        try {
            const tickets = await ticketService.getTickets();
            return res.status(200).json({ tickets });
        } catch (error) {
            return res.status(500).json({ error: "Error al obtener los tickets" });
        }
    }
}
