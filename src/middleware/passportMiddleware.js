import passport from "passport";

export const passportCall = (strategy) => {
  return (req, res, next) => {
    passport.authenticate(strategy, (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        const errorMessage = info?.message || info?.toString() || "Autenticación fallida";
        return res.status(401).json({ error: errorMessage });
      }
      
      req.user = user;
      next();
    })(req, res, next);
  };
};
