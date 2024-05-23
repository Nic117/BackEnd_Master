import { Router } from 'express';
import UserManager from '../dao/UsersManager.js';
import { generaHash } from '../utils.js';

export const router = Router();
const userManager = new UserManager();

router.get('/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            res.setHeader('Content-Type', 'application/json');
            return res.status(500).json({
                error: `Error interno del servidor`,
                detalle: `${error.message}`
            });
        }
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ payload: "Cerraste la sesión con éxito" });
});

router.post('/signin', async (req, res) => {
    let { first_name, last_name, email, age, password, web } = req.body;

    if (!first_name || !last_name || !email || !age || !password) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: `Complete los campos requeridos` });
    }

    let existEmail = await userManager.getUsersBy({ email });
    if (existEmail) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: `El email indicado ya existe` });
    }

    password = generaHash(password);

    try {
        let newUser = await userManager.createUser({ first_name, last_name, email, age, password: generaHash(password) });
        if (web) {
            res.redirect("/login");
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json({ payload: `Usuario creado exitosamente, bienvenid@ ${first_name}`, newUser });
        }
    } catch (error) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({
            error: `Error interno del servidor`,
            detalle: `${error.message}`
        });
    }
});

router.post('/login', async (req, res) => {
    let { email, password, web } = req.body;

    if (!email || !password) {
        if (web) {
            return res.redirect(`/login?error=Complete email y contraseña`);
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: `Complete email y contraseña` });
        }
    }

    let user = await userManager.getUsersBy({ email, password: generaHash(password) });
    if (!user) {
        if (web) {
            return res.redirect(`/login?error=Usuario o contraseña inválidos`);
        } else {
            res.setHeader('Content-Type', 'application/json');
            return res.status(400).json({ error: `Usuario o contraseña inválidos` });
        }
    }

    user = { ...user };
    delete user.password;
    req.session.user = user;

    if (web) {
        res.redirect("/products");
    } else {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ payload: "Login correcto", user });
    }
});
