import TicketManager from "../dao/TicketDAO.js";

class TicketService {
    constructor(dao) {
        this.dao = dao;
    }

    getTickets = async () => await this.dao.getTickets();

    createTicket = async (ticket) => await this.dao.createTicket(ticket);
}

export const ticketService = new TicketService(new TicketManager());