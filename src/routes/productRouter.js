import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ProductController } from '../controller/productController.js';

export const router = Router();

const authAdminPremium = [verifyJWT, auth(["admin", "premium"])];
const authAdmin = [verifyJWT, auth(["admin"])];

router.get("/", ProductController.getProducts);
router.get("/mockingproducts", ProductController.mock);
router.get("/:pid", ProductController.getProductById);
router.post("/", ...authAdminPremium, ProductController.createProduct);
router.put("/:pid", ...authAdmin, ProductController.updateProduct);
router.delete("/:pid", ...authAdminPremium, ProductController.deleteProduct);
