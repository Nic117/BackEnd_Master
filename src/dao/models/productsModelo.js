import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const { Schema, model } = mongoose;

const productsSchema = new Schema(
    {
        status: Boolean,
        title: { type: String, required: true },
        description: String,
        price: { type: Number, required: true },
        thumbnail: String,
        code: String,
        stock: Number,
        category: String
    },
    {
        timestamps: true // Habilita automáticamente los campos createdAt y updatedAt
    }
);

productsSchema.plugin(mongoosePaginate); // Aplica el plugin de paginación mongoose-paginate-v2 al esquema

const productsModel = model("Product", productsSchema); // El nombre "Product" se utilizará como colección en la base de datos

export default productsModel;
