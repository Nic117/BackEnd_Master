import passport from "passport";
import passportJWT from "passport-jwt";
import local from "passport-local";
import UserManager from "../dao/UsersDAO.js";
import { SECRET, generaHash, validaPassword } from "../utils.js";
import github from "passport-github2";
import CartManager from "../dao/CartDAO.js";
import { config } from "./config.js";

// Instancia de los manejadores de usuarios y carritos
const cartManager = new CartManager();
const userManager = new UserManager();

// Función para extraer el token de las cookies
const buscaToken = (req) => {
    let token = null;
    if (req.cookies["codercookie"]) {
        token = req.cookies["codercookie"];
    }
    return token;
};

export const initPassport = () => {
    // Estrategia de registro local
    passport.use(
        "registro",
        new local.Strategy({
            usernameField: "email",
            passReqToCallback: true
        },
            async (req, username, password, done) => {
                try {
                    let { first_name, last_name, age } = req.body;

                    if (!first_name || !last_name || !age) {
                        return done(null, false, { message: 'Complete los campos requeridos' });
                    }

                    let existEmail = await userManager.getUsersBy({ email: username });
                    if (existEmail) {
                        return done(null, false, { message: 'El email indicado ya existe' });
                    }

                    password = generaHash(password);
                    let newCart = await cartManager.createCart();
                    let newUser = await userManager.createUser({ first_name, last_name, email: username, age, password, cart: newCart._id });
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Estrategia de inicio de sesión local
    passport.use(
        "login",
        new local.Strategy({
            usernameField: "email"
        },
            async (username, password, done) => {
                try {
                    let user = await userManager.getUsersBy({ email: username });
                    if (!user) {
                        return done(null, false, { message: 'Usuario incorrecto' });
                    }

                    if (!validaPassword(password, user.password)) {
                        return done(null, false, { message: 'Contraseña incorrecta' });
                    }
                    user = { ...user._doc };
                    delete user.password;
                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Estrategia de autenticación con GitHub
    passport.use(
        "github",
        new github.Strategy(
            {
                clientID: config.CLIENT_ID_GITHUB,
                clientSecret: config.CLIENT_SECRET_GITHUB,
                callbackURL: `http://localhost:${config.PORT}/api/sessions/callbackGitHub`
            },
            async (tokenAcceso, tokenRefresh, profile, done) => {
                try {
                    console.log(profile);
                    let email = profile._json.email;
                    if (!email) {
                        return done(null, false);
                    }
                    let first_name = profile._json.name;
                    let user = await userManager.getUsersBy({ email });
                    if (!user) {
                        let newCart = await cartManager.createCart();
                        user = await userManager.createUser({ first_name, email, profile, cart: newCart._id });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Estrategia de autenticación JWT
    passport.use(
        "current",
        new passportJWT.Strategy(
            {
                secretOrKey: config.SECRET,
                jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([buscaToken])
            },
            async (contenidoToken, done) => {
                try {
                    return done(null, contenidoToken);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    // Serialización y deserialización de usuarios
    passport.serializeUser((user, done) => {
        return done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        let user = await userManager.getUsersBy({ _id: id });
        return done(null, user);
    });
};
