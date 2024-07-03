import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { CartController } from '../controller/cartController.js';

export const router = Router();

// Rutas públicas
router.get('/', CartController.getCarts);
router.get('/:cid', CartController.getCartsById);
router.get('/:cid/purchase', CartController.getCartsById);
router.post('/', CartController.createCart);

// Rutas que requieren verificación JWT y autorización de usuario
router.use('/:cid', verifyJWT, auth(["usuario"]));

router.post('/:cid/products/:pid', CartController.addToCart);
router.put('/:cid', CartController.updateCart);
router.put('/:cid/products/:pid', CartController.updateQuantity);
router.delete('/:cid', CartController.clearCart);
router.delete('/:cid/products/:pid', CartController.deleteProductFromCart);

export default router;
