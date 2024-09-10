import UserManager from "../dao/UsersDAO.js";
import { ticketService } from "../services/ticketService.js";
import { productService } from "../services/productService.js";
import { isValidObjectId } from "mongoose";
import { CustomError } from "../utils/CustomError.js";
import { TIPOS_ERROR } from "../utils/EErrors.js";

const userService = new UserManager()

export class TicketController {
    static createTicket = async (req, res, next) => {
        try {
        let { email, ticket } = req.body

        if (!email || !ticket) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("createTicket --> TicketController", "Email y Ticket requerido", "Complete los datos", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
        }

        if (!Array.isArray(ticket)) {
            res.setHeader('Content-Type', 'application/json');
            CustomError.createError("createTicket --> TicketController", "Ticket no es array", "El ticket tiene un formato inválido", TIPOS_ERROR.TIPO_DE_DATOS)
        }

            const user = await userService.getUsersBy({ email })
            if (!user) {
                CustomError.createError("createTicket --> TicketController", "Usuario no encontrado", "Usuario no encontrado", TIPOS_ERROR.NOT_FOUND)
            }

            let total = 0

            for (const t of ticket) {
                if (!isValidObjectId(t.pid)) {
                    CustomError.createError("createTicket --> TicketController", "ID inválido", "Ingrese un ID válido de MONGODB", TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
                    continue;
                }
                let product = await productService.getProductsBy({ _id: t.pid });
                if (product) {
                    t.title = product.title;
                    t.price = product.price;
                    t.subtotal = product.price * t.quantity;
                    total += t.subtotal;
                } else {
                    CustomError.createError("createTicket --> TicketController", "El producto no existe", `No existe un producto con el ID: ${t.pid}`, TIPOS_ERROR.ARGUMENTOS_INVALIDOS)
                }
            }

            const code = `T-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const purchase_datetime = new Date();

            let newTicket = await ticketService.createTicket({
                code,
                purchase_datetime,
                purchaser: user.email,
                products: ticket,
                amount: total
            });

            res.status(201).json(newTicket);
        } catch (error) {
            return next(error)
        }
    }

    static getTickets = async (req, res) => {
        let tickets = await ticketService.getTickets()
        return res.status(200).json({ tickets })
    }
}