import ProductManager from "../dao/ProductDAO.js"

class ProductService {
    constructor(dao) {
        this.dao = dao
    }

    getProducts = async () => {
        return await this.dao.getProducts()
    }

    getProductsPaginate = async (filter, options)=>{
        return await this.dao.getProductsPaginate(filter, options)
    }

    getSortProducts = async (sort)=>{
        return await this.dao.getSortProducts(sort)
    }

    createProduct= async (product)=>{
        return await this.dao.createProduct(product)
    }

    getProductsBy = async (filtro)=>{
        return await this.dao.getProductsBy(filtro)
    }

    updateProduct = async (id, updateData)=>{
        return await this.dao.updateProduct(id, updateData)
    }

    deleteProduct = async (id)=>{
        return await this.dao.deleteProduct(id)
    }
}

export const productService = new ProductService(new ProductManager())