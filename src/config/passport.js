const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

const { User } = require('../db/models');
const AuthUtils = require('../utils/authUtils');

module.exports = (passport) => {
  // Estrategia JWT
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
      },
      async (payload, done) => {
        try {
          const user = await User.findByPk(payload.id, {
            attributes: { exclude: ['password'] }
          });

          if (user) {
            return done(null, user);
          }

          return done(null, false, { message: 'Usuario no encontrado' });
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Estrategia Local (email/password)
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ 
            where: { email: email.toLowerCase() }
          });

          if (!user) {
            return done(null, false, { message: 'Credenciales inválidas' });
          }

          const isValidPassword = await AuthUtils.comparePassword(password, user.password);

          if (!isValidPassword) {
            return done(null, false, { message: 'Credenciales inválidas' });
          }

          if (!user.is_active) {
            return done(null, false, { message: 'Cuenta desactivada' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Estrategia Google OAuth
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Buscar usuario existente
          let user = await User.findOne({
            where: { google_id: profile.id }
          });

          if (user) {
            return done(null, user);
          }

          // Buscar por email si no existe por Google ID
          user = await User.findOne({
            where: { email: profile.emails[0].value }
          });

          if (user) {
            // Actualizar con Google ID
            user.google_id = profile.id;
            user.is_verified = true;
            await user.save();
            return done(null, user);
          }

          // Crear nuevo usuario
          user = await User.create({
            google_id: profile.id,
            email: profile.emails[0].value,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            avatar_url: profile.photos[0]?.value,
            is_verified: true,
            role: 'client' // Por defecto es cliente
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Estrategia LinkedIn OAuth
  passport.use(
    new LinkedInStrategy(
      {
        clientID: process.env.LINKEDIN_CLIENT_ID,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/linkedin/callback',
        scope: ['r_emailaddress', 'r_liteprofile']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Buscar usuario existente
          let user = await User.findOne({
            where: { linkedin_id: profile.id }
          });

          if (user) {
            return done(null, user);
          }

          // Buscar por email si no existe por LinkedIn ID
          user = await User.findOne({
            where: { email: profile.emails[0].value }
          });

          if (user) {
            // Actualizar con LinkedIn ID
            user.linkedin_id = profile.id;
            user.is_verified = true;
            await user.save();
            return done(null, user);
          }

          // Crear nuevo usuario
          user = await User.create({
            linkedin_id: profile.id,
            email: profile.emails[0].value,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            avatar_url: profile.photos[0]?.value,
            is_verified: true,
            role: 'professional' // LinkedIn users default to professional
          });

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );
};
