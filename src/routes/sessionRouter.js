import { Router } from 'express';
import passport from 'passport';
import { SessionController } from '../controller/sessionController.js';

export const router = Router();

const authErrorRedirect = { failureRedirect: "/api/sessions/error", session: false };

router.get('/logout', SessionController.logout);
router.get('/error', SessionController.error);
router.get('/github', passport.authenticate("github", {}));
router.get('/callbackGitHub', passport.authenticate("github", authErrorRedirect), SessionController.callbackGitHub);
router.get("/current", passport.authenticate("current", authErrorRedirect), SessionController.current);
router.post('/register', passport.authenticate("registro", authErrorRedirect), SessionController.register);
router.post('/login', passport.authenticate("login", authErrorRedirect), SessionController.login);
