import passport from "passport";
import passportJWT from "passport-jwt";
import local from "passport-local";
import github from "passport-github2"

import { generaHash, validaPassword } from "../utils/utils.js";
import { config } from "./config.js";

import UserManager from "../dao/UsersDAO.js";
import CartManager from "../dao/CartDAO.js";
import { userModel } from "../dao/models/userModel.js";

const cartManager = new CartManager();
const userManager = new UserManager();

const buscaToken = (req) => {
    let token = null

    if (req.cookies["codercookie"]) {
        token = req.cookies["codercookie"]
    }

    return token
}

export const initPassport = () => {
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

                    let existEmail = await userManager.getUsersBy({ email: username })
                    if (existEmail) {
                        return done(null, false, { message: 'El email indicado ya existe' });
                    }

                    password = generaHash(password)

                    let newCart = await cartManager.createCart();

                    let newUser = await userManager.createUser({ first_name, last_name, email: username, age, password, cart: newCart._id })
                    return done(null, newUser);
                } catch (error) {
                    return done(error)
                }
            }
        )
    )

    passport.use(
        "login",
        new local.Strategy({
            usernameField: "email"
        },
            async (username, password, done) => {
                try {
                    let user = await userManager.getUsersBy({ email: username })
                    if (!user) {
                        return done(null, false, { message: 'Usuario incorrecto' })
                    }

                    if (!validaPassword(password, user.password)) {
                        return done(null, false, { message: 'Contraseña incorrecto' })
                    }
                    user = { ...user }
                    delete user.password
                    return done(null, user);
                } catch (error) {
                    return done(error)
                }
            }
        )
    )

    passport.use(
        "github",
        new github.Strategy(
            {
                clientID: config.CLIENT_ID_GITHUB,
                clientSecret: config.CLIENT_SECRET_GITHUB,
                callbackURL: `http://localhost:8080/api/sessions/callbackGitHub`,
            },
            async (tokenAcceso, tokenRefresh, profile, done) => {
                try {
                    let email = profile._json.email
                    if (!email) {
                        return done(null, false);
                    }
                    let first_name = profile._json.name
                    let avatar_url = profile._json.avatar_url;
                    let user = await userManager.getByPopulate({ email })
                    if (!user) {
                        let newCart = await cartManager.createCart()
                        user = await userManager.createUser({ first_name, email, profile, avatar: avatar_url, cart: newCart._id })
                    } else {
                        await userModel.updateOne(
                            { _id: user._id },
                            { $set: { avatar: avatar_url } }
                        );
                    }

                    if (!user.cart) {
                        let newCart = await cartManager.createCart();
                        await userModel.updateOne(
                            { _id: user._id },
                            { $set: { cart: newCart._id } }
                        );
                    }

                    return done(null, user)
                } catch (error) {
                    return done(error)
                }
            }
        )
    )

    passport.use(
        "current",
        new passportJWT.Strategy(
            {
                secretOrKey: config.SECRET,
                jwtFromRequest: new passportJWT.ExtractJwt.fromExtractors([buscaToken])
            },
            async (contenidoToken, done) => {
                try {
                    return done(null, contenidoToken)
                } catch (error) {
                    return done(error)
                }
            }
        )
    )

    passport.serializeUser((user, done) => {
        return done(null, user._id)
    })

    passport.deserializeUser(async (id, done) => {
        let user = await userManager.getUsersBy({ _id: id })
        return done(null, user)
    })
}