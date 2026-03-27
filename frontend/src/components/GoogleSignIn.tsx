'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(options: CodeClientOptions): CodeClient;
          revoke(email: string, callback?: () => void): void;
        };
        id: {
          initialize(options: InitializeOptions): void;
          renderButton(element: HTMLElement, options: RenderOptions): void;
          revoke(email: string, callback?: () => void): void;
        };
      };
    };
  }
}

interface InitializeOptions {
  client_id: string;
  callback: (response: CredentialResponse) => void;
}

interface RenderOptions {
  theme: string;
  size: string;
  text: string;
}

interface CredentialResponse {
  clientId: string;
  credential: string;
  select_by: string;
}

interface CodeClientOptions {
  client_id: string;
  scope: string;
  ux_mode: 'popup' | 'redirect';
  callback: (codeResponse: CodeResponse) => void;
  error_callback?: (error: CodeErrorResponse) => void;
}

interface CodeResponse {
  code: string;
}

interface CodeErrorResponse {
  error: string;
  error_subtype?: string;
}

interface CodeClient {
  requestCode(): void;
}

export const GoogleSignIn = () => {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSDKReady, setIsGoogleSDKReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const codeClientRef = useRef<CodeClient | null>(null);

  useEffect(() => {
    // Check if Google SDK is loaded
    const checkGoogleSDK = () => {
      if (window.google?.accounts?.oauth2) {
        try {
          // Initialize the OAuth2 code client for authorization code flow
          codeClientRef.current = window.google.accounts.oauth2.initCodeClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            scope: 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            ux_mode: 'popup',
            callback: handleCodeResponse,
            error_callback: handleCodeError,
          });
          
          setIsGoogleSDKReady(true);
        } catch (err) {
          setSdkError(t('errors.failedToInitializeGoogle'));
          console.error('Google SDK initialization error:', err);
        }
      } else if (!window.google) {
        // SDK not loaded yet, retry
        setTimeout(checkGoogleSDK, 500);
      }
    };

    // Set a timeout for SDK loading failure
    const sdkLoadTimeout = setTimeout(() => {
      if (!isGoogleSDKReady && !window.google) {
        setSdkError(t('errors.googleSignInFailed'));
      }
    }, 5000);

    checkGoogleSDK();

    return () => clearTimeout(sdkLoadTimeout);
  }, [t]);

  const handleCodeResponse = async (codeResponse: CodeResponse) => {
    try {
      setIsLoading(true);
      
      // Send the authorization code to backend for token exchange
      const result = await authAPI.exchangeCode(codeResponse.code);

      if (result.data.user) {
        // Store user info in store only (httpOnly cookie is set by backend)
        setUser(result.data.user);

        toast.success(t('login.welcomeMessage'));
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      const errorMessage =
        error.response?.data?.error || t('login.googleSignInFailed');
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeError = (error: CodeErrorResponse) => {
    console.error('Auth error:', error);
    setSdkError('Authentication failed. Please try again.');
  };

  const handleSignInClick = () => {
    if (codeClientRef.current) {
      codeClientRef.current.requestCode();
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center my-6">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">{t('login.signingIn')}</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (sdkError) {
    return (
      <div className="flex justify-center my-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{sdkError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show button when SDK is ready
  return (
    <div className="flex justify-center my-6">
      <button
        onClick={handleSignInClick}
        disabled={!isGoogleSDKReady || isLoading}
        className="px-6 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-gray-700"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.365,1,12.545,1 C6.477,1,1.54,5.952,1.54,12s4.938,11,11.005,11c6.066,0,11.067-4.941,11.067-11c0-0.713-0.084-1.405-0.242-2.083H12.545z"/>
        </svg>
        {t('common.signInWith')}
      </button>
    </div>
  );
};

// Extend Window interface to include google
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          cancel: () => void;
          revoke: (email: string, callback: () => void) => void;
        };
      };
    };
  }
}
