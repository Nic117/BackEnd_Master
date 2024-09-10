import { ticketModelo } from './models/ticketModelo.js'

export default class TicketManager {
    async createTicket(ticket) {
        let newTicket = await ticketModelo.create(ticket)
        return newTicket.toJSON();
    }

    async getTickets() {
        return await ticketModelo.find().populate("purchaser").lean();
    }
}

export const ticketManager = new TicketManager();
