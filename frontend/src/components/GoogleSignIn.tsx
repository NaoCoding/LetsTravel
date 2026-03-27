'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'i18next/react';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';

export const GoogleSignIn = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setUser } = useAuthStore();
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSDKReady, setIsGoogleSDKReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    // Check if Google SDK is loaded
    const checkGoogleSDK = () => {
      if (window.google && divRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: handleCredentialResponse,
          });

          window.google.accounts.id.renderButton(divRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
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

  const handleCredentialResponse = async (response: CredentialResponse) => {
    try {
      setIsLoading(true);
      // Extract the ID token from Google Sign-In response
      const idToken = response.credential;

      // Send the token to backend for verification
      const result = await authAPI.exchangeCode(idToken);

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
  return <div ref={divRef} className="flex justify-center my-6" />;
};

// Type declaration for Google response
interface CredentialResponse {
  clientId: string;
  credential: string;
  select_by: string;
}

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
