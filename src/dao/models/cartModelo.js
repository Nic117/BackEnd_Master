import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const cartCollection = "cart";
const cartSchema = new mongoose.Schema({
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products"
        },
        quantity: Number
    }]
},
    {
        timestamps: true
    }
)

cartSchema.plugin(mongoosePaginate);


export const cartModelo = mongoose.model(cartCollection, cartSchema)