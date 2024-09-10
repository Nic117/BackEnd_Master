export class GetUsersDTO {
    constructor(user) {
        this.email = user.email;
        this.first_name = user.first_name;
        this.last_name = user.last_name ? user.last_name : null;
        this.fullName = user.last_name ? `${this.first_name} ${this.last_name}` : this.first_name;
        this.rol = user.rol 

    }
}
