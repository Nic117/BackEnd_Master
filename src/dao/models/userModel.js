import mongoose from "mongoose";

const usersCollection = "users";

// Definición del esquema de usuario
const userSchema = new mongoose.Schema(
    {
        first_name: { 
            type: String, 
            required: true 
        },
        last_name: String,
        email: { 
            type: String, 
            required: true, 
            unique: true 
        },
        age: Number,
        password: String,
        rol: {
            type: String,
            default: "usuario"
        },
        cart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "cart" // Referencia al modelo de carrito
        }
    },
    {
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
        strict: false // Permite campos no definidos en el esquema
    }
);

// Modelo de Mongoose para usuarios
export const userModel = mongoose.model(usersCollection, userSchema);
