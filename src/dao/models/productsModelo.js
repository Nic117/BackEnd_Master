import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";


const productsCollection = "products";

const productsSchema = new mongoose.Schema(
    {
        status: { type: Boolean, default: true },  
        title: { 
            type: String, 
            required: [true, "El título es requerido"],  
            trim: true  
        },
        description: { 
            type: String, 
            trim: true  
        },
        price: { 
            type: Number, 
            required: [true, "El precio es requerido"],  
            min: [0, "El precio no puede ser negativo"]  
        },
        thumbnail: { 
            type: String, 
            validate: {
                validator: function(v) {
                    return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/i.test(v);  
                },
                message: props => `${props.value} no es una URL válida de imagen`
            }
        },
        code: { 
            type: String, 
            unique: true,  
            required: [true, "El código del producto es requerido"],  
            trim: true 
        },
        stock: { 
            type: Number, 
            required: [true, "El stock es requerido"],  
            min: [0, "El stock no puede ser negativo"]  
        },
        category: { 
            type: String, 
            enum: ['Electrónica', 'Ropa', 'Alimentos', 'Libros', 'Otro'],  
            required: [true, "La categoría es requerida"],  
            trim: true 
        }
    },
    {
        timestamps: true  
    }
);


productsSchema.plugin(mongoosePaginate);


export const productsModelo = mongoose.model(productsCollection, productsSchema);

