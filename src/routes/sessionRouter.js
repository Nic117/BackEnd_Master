import { Router } from 'express';
import passport from 'passport';
import { SessionController } from '../controller/sessionController.js';

export const router = Router();

// Rutas públicas
router.get('/logout', SessionController.logout);
router.get('/error', SessionController.error);
router.get('/github', passport.authenticate("github", {}), (req, res) => {});

// Rutas que requieren autenticación con GitHub
router.get('/callbackGitHub', passport.authenticate("github", { failureRedirect: "/api/sessions/error", session: false }), SessionController.callbackGitHub);

// Rutas que requieren autenticación con el middleware "current"
router.get('/current', passport.authenticate("current", { failureRedirect: "/api/sessions/error", session: false }), SessionController.current);

// Rutas que requieren autenticación para registro y login
router.post('/register', passport.authenticate("registro", { failureRedirect: "/api/sessions/error" }), SessionController.register);
router.post('/login', passport.authenticate("login", { failureRedirect: "/api/sessions/error", session: false }), SessionController.login);

export default router;
