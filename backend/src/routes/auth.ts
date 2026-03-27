import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimit';
import {
  GoogleCallbackSchema,
  RefreshTokenSchema,
} from '../utils/validation';
import {
  ERROR_MESSAGES,
  API_STATUS_CODE,
  GOOGLE_OAUTH_SCOPES,
  COOKIE_NAMES,
} from '../utils/constants';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

// Helper function to set secure cookies
const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  const isProduction = env.NODE_ENV === 'production';

  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  if (refreshToken) {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });
  }
};

// Get Google OAuth URL
router.get('/google/url', (_req: Request, res: Response) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [...GOOGLE_OAUTH_SCOPES],
    prompt: 'consent', // Force consent screen to ensure offline access
  });

  res.json({ url: authUrl });
});

// Handle Google OAuth callback with authorization code or verify ID token
router.post(
  '/google/callback',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const validation = GoogleCallbackSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        'Invalid request data'
      );
    }

    const { code, credential } = validation.data;
    
    interface UserInfo {
      id: string;
      email: string;
      name?: string | null;
    }
    
    let userInfo: UserInfo;
    let accessToken: string | undefined;
    let refreshTokenValue: string | undefined;

    if (credential) {
      // Handle Google Sign-In ID token verification
      // Note: ID token alone doesn't provide Google Drive access
      // This is for authentication only, not authorization for Drive API
      const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) {
          throw new AppError(
            API_STATUS_CODE.BAD_REQUEST,
            ERROR_MESSAGES.INVALID_GOOGLE_TOKEN
          );
        }

        userInfo = {
          id: payload.sub!,
          email: payload.email!,
          name: payload.name,
        };
      } catch (err) {
        throw new AppError(
          API_STATUS_CODE.BAD_REQUEST,
          ERROR_MESSAGES.INVALID_GOOGLE_TOKEN
        );
      }
    } else if (code) {
      // Handle authorization code - this provides both ID and access tokens
      try {
        const { tokens: codeTokens } = await oauth2Client.getToken(code);

        if (!codeTokens.access_token) {
          throw new AppError(
            API_STATUS_CODE.BAD_REQUEST,
            'Failed to obtain access token'
          );
        }

        oauth2Client.setCredentials(codeTokens);
        accessToken = codeTokens.access_token;
        refreshTokenValue = codeTokens.refresh_token ?? undefined;

        // Get user info
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfoResponse = await oauth2.userinfo.get();
        
        const data = userInfoResponse.data;
        userInfo = {
          id: data.id!,
          email: data.email!,
          name: data.name,
        };
      } catch (err) {
        throw new AppError(
          API_STATUS_CODE.INTERNAL_SERVER_ERROR,
          ERROR_MESSAGES.AUTH_FAILED
        );
      }
    } else {
      throw new AppError(
        API_STATUS_CODE.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_PARAMS
      );
    }

    // Create JWT tokens
    const jwtToken = jwt.sign(
      {
        id: userInfo.id,
        email: userInfo.email,
        accessToken: accessToken || undefined,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRES_IN as string | number,
      } as any
    );

    // Create refresh token with separate secret
    const refreshToken = jwt.sign(
      {
        id: userInfo.id,
        email: userInfo.email,
        googleRefreshToken: refreshTokenValue,
      },
      env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    // Set secure httpOnly cookies
    setAuthCookies(res, jwtToken, refreshToken);

    res.json({
      token: jwtToken,
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
      },
      refreshToken: refreshToken,
    });
  })
);

// Refresh access token
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    let refreshTokenValue = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

    if (!refreshTokenValue) {
      const validation = RefreshTokenSchema.safeParse(req.body);
      if (!validation.success) {
        throw new AppError(
          API_STATUS_CODE.BAD_REQUEST,
          'Refresh token is required'
        );
      }
      refreshTokenValue = validation.data.refreshToken;
    }

    try {
      const decoded = jwt.verify(refreshTokenValue, env.REFRESH_TOKEN_SECRET) as any;

      // Create new JWT token
      const newJwtToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
        },
        env.JWT_SECRET,
        {
          expiresIn: env.JWT_EXPIRES_IN as string | number,
        } as any
      );

      // Create new refresh token (rotate refresh tokens)
      const newRefreshToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
        },
        env.REFRESH_TOKEN_SECRET,
        { expiresIn: '30d' }
      );

      setAuthCookies(res, newJwtToken, newRefreshToken);

      res.json({
        token: newJwtToken,
        user: {
          id: decoded.id,
          email: decoded.email,
        },
        refreshToken: newRefreshToken,
      });
    } catch (err) {
      throw new AppError(
        API_STATUS_CODE.UNAUTHORIZED,
        'Invalid or expired refresh token'
      );
    }
  })
);

// Logout
router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { path: '/' });
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

export default router;
