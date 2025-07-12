// src/configs/passport.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/user-model';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from './env';

// Configure Google OAuth Strategy only if credentials are provided
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists with this Google ID
      let existingUser = await User.findOne({ googleId: profile.id });
      
      if (existingUser) {
        // Update profile information if needed
        existingUser.profilePicture = profile.photos?.[0]?.value || existingUser.profilePicture;
        existingUser.isEmailVerified = true;
        await existingUser.save();
        
        return done(null, existingUser);
      }

      // Check if user exists with same email
      const emailUser = await User.findOne({ email: profile.emails?.[0]?.value });
    
    if (emailUser) {
      // Link Google account to existing user
      emailUser.googleId = profile.id;
      emailUser.profilePicture = profile.photos?.[0]?.value || emailUser.profilePicture;
      emailUser.isEmailVerified = true;
      await emailUser.save();
      
      return done(null, emailUser);
    }

    // Create new user
    const newUser = new User({
      googleId: profile.id,
      email: profile.emails?.[0]?.value,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      profilePicture: profile.photos?.[0]?.value,
      isEmailVerified: true,
      authProvider: 'google'
    });

    await newUser.save();
    done(null, newUser);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    done(error, false);
  }
}));
} else {
  console.warn('Google OAuth credentials not provided. Google authentication will be disabled.');
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
