import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { CartController } from '../controller/cartController.js';

export const router = Router();

router.get('/', CartController.getCarts)

router.get('/:cid/purchase', verifyJWT, auth(["usuario", "premium"]), CartController.purchase)

router.get('/:cid', CartController.getCartsById)

router.post("/:cid/purchase", verifyJWT, auth(["usuario", "premium"]), CartController.purchase)

router.post('/', CartController.createCart)

router.post('/:cid/products/:pid', verifyJWT, auth(["usuario", "premium"]), CartController.addToCart)

router.put('/:cid', verifyJWT, auth(["usuario", "premium"]), CartController.updateCart)

router.put('/:cid/products/:pid', verifyJWT, auth(["usuario", "premium"]), CartController.updateQuantity)

router.delete('/:cid', verifyJWT, auth(["admin", "usuario", "premium"]), CartController.clearCart)

router.delete('/:cid/products/:pid', verifyJWT, auth(["admin", "usuario", "premium"]), CartController.deleteProductFromCart);
