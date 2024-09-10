import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ProductController } from '../controller/productController.js';
export const router = Router();


router.get("/", ProductController.getProducts);

router.get("/mockingproducts", ProductController.mock);

router.get("/:pid", ProductController.getProductById);

router.post("/", verifyJWT, auth(["admin", "premium"]), ProductController.createProduct);

router.put("/:pid", verifyJWT, auth(["admin"]), ProductController.updateProduct);

router.delete("/:pid", verifyJWT, auth(["admin", "premium"]), ProductController.deleteProduct);