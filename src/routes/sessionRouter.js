import { Router } from 'express';
import passport from 'passport';
import { SessionController } from '../controller/sessionController.js';
export const router = Router()

router.get('/logout', SessionController.logout)

router.get('/error', SessionController.error)

router.get('/github', passport.authenticate("github", { scope: ['user:email'] }))

router.get('/callbackGitHub', passport.authenticate("github", { failureRedirect: "/api/sessions/error", session: false }), SessionController.callbackGitHub)

router.get("/current", passport.authenticate("current", { failureRedirect: "/api/sessions/error", session: false }), SessionController.current)

router.post('/register', passport.authenticate("registro", { failureRedirect: "/api/sessions/error", session: false }), SessionController.register)

router.post('/login', passport.authenticate("login", { failureRedirect: "/api/sessions/error", session: false }), SessionController.login)