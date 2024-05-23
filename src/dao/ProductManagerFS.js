import fs from 'fs';

export default class ProductManager {

    constructor(rutaProducto) {
        this.path = rutaProducto;
        console.log(rutaProducto);
    }

    async init() {

        const products = await this.getProducts();
        if (products.length > 0) {
            const maxId = Math.max(...products.map(product => product.id));
            ProductManager.idProducto = maxId + 1;
        }
        return ProductManager.idProducto;

    }


    async getProducts() {

        if (fs.existsSync(this.path)) {
            const data = await fs.promises.readFile(this.path, { encoding: "utf-8" });
            console.log("Datos leídos del archivo JSON:", data);
            return JSON.parse(data);
        } else {
            console.log(`El archivo JSON no existe en la ruta: ${this.path}. Creando un nuevo archivo...`);
            await this.saveProduct([]); 
            return []; 
        }

    }


    async saveProduct(data) {
        const jsonData = JSON.stringify(data, null, 4);
        await fs.promises.writeFile(this.path, jsonData, 'utf8');
        console.log('Archivo guardado correctamente');

    }


    async addProduct(product) {
        let products = await this.getProducts();
        console.log("Productos obtenidos:", products); 

        let id = await this.init();
        console.log("Nuevo ID para el producto:", id); 


        product = {
            id: id,
            status: true,
            ...product
        };

        console.log("Producto a añadir:", product); 


        products.push(product);
        await this.saveProduct(products);
        return `El producto se ha añadido correctamente ${product}`;
    }


    async getProductsById(id) {
        const products = await this.getProducts();
        console.log(products)
        const product = products.find(p => p.id === id);
        return product;


    };

    async updateProduct(id, updateData) {
        const products = await this.getProducts();
        const productId = Number(id);
        const index = products.findIndex(p => p.id === productId);

        if (index >= 0) {
            const allowedParams = ['title', 'description', 'price', 'thumbnail', 'stock', 'category'];
            const updateKeys = Object.keys(updateData);

            if (updateKeys.some(key => !allowedParams.includes(key))) {
                console.log(`Error: Los parámetros añadidos no son válidos para la actualización. Solo se admitirán ${allowedParams}`);
                return 'Error: Parámetros no válidos';
            }

            products[index] = { ...products[index], ...updateData };

            updateKeys.forEach(key => {
                if (allowedParams.includes(key)) {
                    products[index][key] = updateData[key];
                }
            });

            await this.saveProduct(products);
            console.log(`El producto con la ID: ${productId} ha sido actualizado`);
            return `El producto ${productId} se ha modificado correctamente`;
        } else {
            console.log(`El producto con el id ${id} no existe`);
            return 'Error: Producto no encontrado';
        }
    }

    async deleteProduct(id) {
        const products = await this.getProducts();

        const productId = Number(id);

        const updatedProducts = products.filter(product => product.id !== productId);

        if (updatedProducts.length !== products.length) {
            await this.saveProduct(updatedProducts); 
            console.log(`El producto con la ID: ${productId} ha sido eliminado`);
            return `El producto con la ID: ${productId} ha sido eliminado`;
        } else {
            console.log(`El producto con el id ${productId} no existe`);
            return 'Error: Producto no encontrado';
        }
    }
};