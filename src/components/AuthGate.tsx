'use client';

import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signInWithGoogle, isConfigured } = useAuth();

  // Bypass auth when Firebase isn't configured (local dev)
  if (!isConfigured) return <>{children}</>;

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!user && (
          <motion.div
            key="auth-gate"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50"
          >
            <div className="flex flex-col items-center gap-6 max-w-md px-6">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 10 12 6.16-1.26 10-6.45 10-12V7l-10-5z"/>
                </svg>
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Canvas</h1>
                <p className="text-sm text-gray-600">Sign in with your Miro account to continue</p>
              </div>

              <button
                onClick={signInWithGoogle}
                className="px-6 py-3 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-700 active:scale-95 transition-all duration-150 shadow-sm"
              >
                Sign in with Google
              </button>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {user && children}
    </>
  );
}
