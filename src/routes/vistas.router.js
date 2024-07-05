import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ViewController } from '../controller/viewController.js';

export const router = Router();

// Rutas públicas
router.get('/', ViewController.getProducts);
router.get('/realtimeproducts', ViewController.getRealTimeProducts);
router.get('/register', ViewController.register);
router.get('/login', ViewController.login);

// Middleware de autenticación y autorización para las rutas siguientes
router.use(verifyJWT);

// Rutas protegidas para "usuario"
router.use(auth(["usuario"]));

router.get('/chat', ViewController.getChat);
router.get('/products', ViewController.getProductsPaginate);
router.get('/carts/:cid', ViewController.getCartById);

// Rutas protegidas para "usuario" y "admin"
router.use(auth(["usuario", "admin"]));

router.get('/profile', ViewController.getProfile);

export default router;


