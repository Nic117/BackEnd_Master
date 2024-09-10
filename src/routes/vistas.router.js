export const router = Router()
import { Router } from 'express';
import { auth, verifyJWT } from '../middleware/auth.js';
import { ViewController } from '../controller/viewController.js';


router.get('/', ViewController.getProducts)

router.get('/realtimeproducts',verifyJWT, ViewController.getRealTimeProducts)

router.get("/chat", verifyJWT, auth(["usuario", "premium"]), ViewController.getChat);

router.get("/products", verifyJWT, auth(["usuario", "premium"]), ViewController.getProductsPaginate);

router.get("/carts/:cid", verifyJWT, auth(["usuario", "premium"]), ViewController.getCartById)

router.get('/register', ViewController.register)

router.get('/login', ViewController.login)

router.get('/profile', verifyJWT, auth(["usuario", "premium"]), ViewController.getProfile)

router.get('/forgotpassword', verifyJWT, auth(["usuario", "admin", "premium"]), ViewController.forgotPassword)

router.get('/newpassword/:token', verifyJWT, auth(["usuario", "admin", "premium"]), ViewController.generateNewPassword)

router.get("/purchase", verifyJWT, auth(["usuario", "premium"]), ViewController.purchase)

router.get("/adminpanel", verifyJWT, auth(["admin"]), ViewController.adminPanel);
