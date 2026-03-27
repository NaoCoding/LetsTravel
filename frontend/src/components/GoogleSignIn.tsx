'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { authAPI } from '@/lib/api';

export const GoogleSignIn = () => {
  const divRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  useEffect(() => {
    // Initialize Google Sign-In
    if (window.google && divRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      });
    }
  }, []);

  const handleCredentialResponse = async (response: CredentialResponse) => {
    try {
      // Extract the ID token from Google Sign-In response
      const idToken = response.credential;

      // Send the token to backend for verification
      const result = await authAPI.exchangeCode(idToken);

      if (result.data.token) {
        // Store user info in store and localStorage
        setUser(result.data.user);
        setTokens(result.data.token, result.data.refreshToken);

        // Store token in localStorage (httpOnly cookie is set by API)
        localStorage.setItem('token', result.data.token);
        if (result.data.refreshToken) {
          localStorage.setItem('refreshToken', result.data.refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(result.data.user));

        toast.success('Welcome! You have been signed in.');
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Sign-in error:', error);
      const errorMessage =
        error.response?.data?.error || 'Failed to sign in. Please try again.';
      toast.error(errorMessage);
    }
  };

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
