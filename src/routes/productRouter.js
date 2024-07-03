import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ProductController } from '../controller/productController.js';

export const router = Router();

// Rutas públicas
router.get("/", ProductController.getProducts);
router.get("/:pid", ProductController.getProductById);

// Middleware para rutas que requieren verificación JWT y autorización de administrador
router.use(verifyJWT, auth(["admin"]));

router.post("/", ProductController.createProduct);
router.put("/:pid", ProductController.updateProduct);
router.delete("/:pid", ProductController.deleteProduct);

export default router;
