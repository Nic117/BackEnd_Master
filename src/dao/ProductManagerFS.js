import fs from 'fs';

export default class ProductManager {

    constructor(rutaProducto) {
        this.path = rutaProducto;
    }

    async init() {
        const products = await this.getProducts();
        if (products.length > 0) {
            const maxId = Math.max(...products.map(product => product.id));
            ProductManager.idProducto = maxId + 1;
        }
        return ProductManager.idProducto || 1;
    }

    async getProducts() {
        if (fs.existsSync(this.path)) {
            const data = await fs.promises.readFile(this.path, { encoding: "utf-8" });
            return JSON.parse(data);
        } else {
            await this.saveProduct([]);
            return [];
        }
    }

    async saveProduct(data) {
        const jsonData = JSON.stringify(data, null, 4);
        await fs.promises.writeFile(this.path, jsonData, 'utf8');
    }

    async addProduct(product) {
        let products = await this.getProducts();
        let id = await this.init();
        product = { id: id, status: true, ...product };
        products.push(product);
        await this.saveProduct(products);
        return `El producto se ha añadido correctamente ${product}`;
    }

    async getProductsById(id) {
        const products = await this.getProducts();
        return products.find(p => p.id === id);
    }

    async updateProduct(id, updateData) {
        const products = await this.getProducts();
        const productId = Number(id);
        const index = products.findIndex(p => p.id === productId);

        if (index >= 0) {
            const allowedParams = ['title', 'description', 'price', 'thumbnail', 'stock', 'category'];
            Object.keys(updateData).forEach(key => {
                if (allowedParams.includes(key)) {
                    products[index][key] = updateData[key];
                }
            });
            await this.saveProduct(products);
            return `El producto ${productId} se ha modificado correctamente`;
        } else {
            return 'Error: Producto no encontrado';
        }
    }

    async deleteProduct(id) {
        const products = await this.getProducts();
        const productId = Number(id);
        const updatedProducts = products.filter(product => product.id !== productId);

        if (updatedProducts.length !== products.length) {
            await this.saveProduct(updatedProducts);
            return `El producto con la ID: ${productId} ha sido eliminado`;
        } else {
            return 'Error: Producto no encontrado';
        }
    }
}
