import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ViewController } from '../controller/viewController.js';

export const router = Router();

// Rutas públicas
router.get('/', ViewController.getProducts);
router.get('/realtimeproducts', ViewController.getRealTimeProducts);
router.get('/register', ViewController.register);
router.get('/login', ViewController.login);

// Middleware para rutas que requieren verificación JWT
router.use(verifyJWT);

// Rutas que requieren verificación JWT y autorización de usuario
router.get("/chat", auth(["usuario"]), ViewController.getChat);
router.get("/products", auth(["usuario"]), ViewController.getProductsPaginate);
router.get("/carts/:cid", ViewController.getCartById);

// Rutas que requieren verificación JWT y autorización de usuario o administrador
router.get('/profile', auth(["usuario", "admin"]), ViewController.getProfile);

export default router;
