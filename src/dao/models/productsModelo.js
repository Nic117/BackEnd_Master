import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const productsCollection = "products";
const productsSchema = new mongoose.Schema(
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
        timestamps: true
    }
)

productsSchema.plugin(mongoosePaginate);

export const productsModelo = mongoose.model(productsCollection, productsSchema)