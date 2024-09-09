import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { CartController } from '../controller/cartController.js';

export const router = Router();

const authUserPremium = [verifyJWT, auth(["usuario", "premium"])];
const authAdminUserPremium = [verifyJWT, auth(["admin", "usuario", "premium"])];

router.get('/', CartController.getCarts);
router.get('/:cid', CartController.getCartsById);
router.post('/', CartController.createCart);
router.post('/:cid/products/:pid', ...authUserPremium, CartController.addToCart);
router.put('/:cid', ...authUserPremium, CartController.updateCart);
router.put('/:cid/products/:pid', ...authUserPremium, CartController.updateQuantity);
router.delete('/:cid', ...authAdminUserPremium, CartController.clearCart);
router.delete('/:cid/products/:pid', ...authAdminUserPremium, CartController.deleteProductFromCart);
router.get('/:cid/purchase', ...authUserPremium, CartController.purchase);
router.post('/:cid/purchase', ...authUserPremium, CartController.purchase);