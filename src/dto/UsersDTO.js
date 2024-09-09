export class UsersDTO {
    constructor(user) {
        this.id = user.id;
        this.firstName = user.first_name;
        this.lastName = user.last_name || null;
        this.email = user.email;
        this.age = user.age || null;
        this.fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
        this.role = user.rol ? user.rol.name : "usuario";
    }
}


