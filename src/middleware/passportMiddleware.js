import passport from "passport";

export const passportCall = (estrategia) => {
    return (req, res, next) => {
        passport.authenticate(estrategia, (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.status(401).json({ error: info.message || info.toString() });
            }
            req.user = user;
            next();
        })(req, res, next);
    };
};
