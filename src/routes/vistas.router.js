import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ViewController } from '../controller/viewController.js';

export const router = Router();

const authUserPremium = [verifyJWT, auth(["usuario", "premium"])];
const authUserAdminPremium = [verifyJWT, auth(["usuario", "admin", "premium"])];

router.get('/', ViewController.getProducts);
router.get('/realtimeproducts', ViewController.getRealTimeProducts);
router.get("/chat", ...authUserPremium, ViewController.getChat);
router.get("/products", ...authUserPremium, ViewController.getProductsPaginate);
router.get("/carts/:cid", verifyJWT, ViewController.getCartById);
router.get('/register', ViewController.register);
router.get('/login', ViewController.login);
router.get('/profile', ...authUserAdminPremium, ViewController.getProfile);
router.get('/forgotpassword', ViewController.forgotPassword);
router.get('/newpassword/:token', ViewController.generateNewPassword);