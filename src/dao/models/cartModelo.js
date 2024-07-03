import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema, model } = mongoose;

const cartSchema = new Schema(
    {
        products: [
            {
                product: {
                    type: Schema.Types.ObjectId,
                    ref: "Product" // Referencia al modelo de productos, utilizando el nombre del modelo definido en Mongoose
                },
                quantity: Number
            }
        ]
    },
    {
        timestamps: true // Habilita automáticamente los campos createdAt y updatedAt
    }
);

cartSchema.plugin(mongoosePaginate); // Aplica el plugin de paginación mongoose-paginate-v2 al esquema

const cartModel = model("Cart", cartSchema); // El nombre "Cart" se utilizará como colección en la base de datos

export default cartModel;
