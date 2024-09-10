import path from "path";
import __dirname from "./utils.js";
import swaggerJsdoc from 'swagger-jsdoc';


const swaggerOptions = {
    definition: {
        openapi: "3.0.1",
        info: {
            title: "Documentacion Ecommerce",
            version: "1.0.0",
            description: "API pensada para aplicacion de un E-Commerce",
        },
    },
    apis: [path.join(__dirname, '/docs/*.yaml')]
};

export const specs = swaggerJsdoc(swaggerOptions);