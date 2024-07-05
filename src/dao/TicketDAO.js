import { ticketModelo } from './models/ticketModelo.js';

export default class TicketManager {
    async createTicket(ticket) {
        try {
            let newTicket = await ticketModelo.create(ticket);
            return newTicket.toJSON();
        } catch (error) {
            console.error(`Error al crear ticket: ${error}`);
            throw new Error("Error al crear ticket");
        }
    }

    async getTickets() {
        try {
            return await ticketModelo.find().populate("purchaser").lean();
        } catch (error) {
            console.error(`Error al obtener tickets: ${error}`);
            throw new Error("Error al obtener tickets");
        }
    }
}

export const ticketManager = new TicketManager();

