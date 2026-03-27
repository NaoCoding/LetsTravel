import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get Google OAuth URL
router.get('/google/url', (_req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.json({ url: authUrl });
});

// Handle Google OAuth callback
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      res.status(400).json({ error: 'Failed to obtain access token' });
    } else {
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      // Create JWT token
      const jwtToken = jwt.sign(
        {
          id: userInfo.data.id,
          email: userInfo.data.email,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '7d' }
      );

      res.json({
        token: jwtToken,
        user: {
          id: userInfo.data.id,
          email: userInfo.data.email,
          name: userInfo.data.name,
        },
        refreshToken: tokens.refresh_token,
      });
    }
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
