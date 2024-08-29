import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ViewController } from '../controller/viewController.js';

export const router = Router();

// Rutas públicas
router.get('/', ViewController.getProducts);
router.get('/register', ViewController.register);
router.get('/login', ViewController.login);
router.get('/forgotpassword', ViewController.forgotPassword);
router.get('/newpassword/:token', ViewController.generateNewPassword);

// Rutas protegidas
router.get('/realtimeproducts', ViewController.getRealTimeProducts);
router.get('/products', verifyJWT, auth(["usuario", "premium"]), ViewController.getProductsPaginate);
router.get('/carts/:cid', verifyJWT, ViewController.getCartById);
router.get('/profile', verifyJWT, auth(["usuario", "admin", "premium"]), ViewController.getProfile);
router.get('/chat', verifyJWT, auth(["usuario", "premium"]), ViewController.getChat);



