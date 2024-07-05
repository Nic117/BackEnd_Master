import TicketManager from "../dao/TicketDAO.js";

class TicketService {
    constructor(dao) {
        this.dao = dao;
    }
    async getTickets() {
        return await this.dao.getTickets();
    }

    async createTicket(ticket) {
        return await this.dao.createTicket(ticket);
    }
}

export const ticketService = new TicketService(new TicketManager());