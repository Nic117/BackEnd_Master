import passport from "passport";
import passportJWT from "passport-jwt";
import local from "passport-local";
import github from "passport-github2";
import { generaHash, validaPassword } from "../utils/utils.js";
import { config } from "./config.js";
import UserManager from "../dao/UsersDAO.js";
import CartManager from "../dao/CartDAO.js";

const cartManager = new CartManager();
const userManager = new UserManager();

const buscaToken = (req) => req.cookies["codercookie"] || null;

export const initPassport = () => {
    passport.use(
        "registro",
        new local.Strategy(
            { usernameField: "email", passReqToCallback: true },
            async (req, username, password, done) => {
                try {
                    const { first_name, last_name, age } = req.body;

                    if (!first_name || !last_name || !age) return done(null, false, { message: 'Todos los campos son requeridos' });

                    if (await userManager.getUsersBy({ email: username })) return done(null, false, { message: 'ya existe ese Email' });

                    const newCart = await cartManager.createCart();
                    const newUser = await userManager.createUser({ first_name, last_name, email: username, age, password: generaHash(password), cart: newCart._id });
                    return done(null, newUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

    passport.use(
        "login",
        new local.Strategy(
            { usernameField: "email" },
            async (username, password, done) => {
                try {
                    const user = await userManager.getUsersBy({ email: username });
                    if (!user || !validaPassword(password, user.password)) {
                        return done(null, false, { message: !user ? 'Usuario incorrecto' : 'Contraseña incorrecta' });
                    }
                    const sanitizedUser = { ...user._doc };
                    delete sanitizedUser.password;
                    return done(null, sanitizedUser);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

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
                    const email = profile._json.email;
                    if (!email) return done(null, false);

                    let user = await userManager.getUsersBy({ email });
                    if (!user) {
                        const newCart = await cartManager.createCart();
                        const first_name = profile._json.name;
                        user = await userManager.createUser({ first_name, email, profile, cart: newCart._id });
                    }
                    return done(null, user);
                } catch (error) {
                    return done(error);
                }
            }
        )
    );

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

    passport.serializeUser((user, done) => done(null, user._id));

    passport.deserializeUser(async (id, done) => {
        const user = await userManager.getUsersBy({ _id: id });
        return done(null, user);
    });
};
