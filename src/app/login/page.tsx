'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Activity, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle standard credentials login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await authClient.signIn.email({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || 'Invalid email or password');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Quick dev login callback
  const handleQuickLogin = async (role: string) => {
    setLoading(true);
    setError('');
    
    let targetEmail = '';
    let targetPassword = 'OrbitPass123!';
    let targetName = '';

    if (role === 'admin') {
      targetEmail = 'admin-30be3215-v4@orbitapi.com';
      targetName = 'Admin Developer';
    } else {
      targetEmail = 'developer-30be3215-v4@orbitapi.com';
      targetName = 'Vibe Developer';
    }

    try {
      // 1. Attempt to sign in
      console.log('Attempting quick sign-in for:', targetEmail);
      await authClient.signIn.email({
        email: targetEmail,
        password: targetPassword,
      });

      // If sign-in succeeds
      router.push(callbackUrl);
      router.refresh();
    } catch (signInErr: any) {
      console.warn('Initial quick sign-in failed, attempting registration:', signInErr);
      
      try {
        // 2. If sign-in fails (user doesn't exist yet), try to register them
        await authClient.signUp.email({
          email: targetEmail,
          password: targetPassword,
          name: targetName,
        });

        console.log('Quick registration succeeded, logging in...');

        // 3. Sign in after successful registration
        await authClient.signIn.email({
          email: targetEmail,
          password: targetPassword,
        });

        router.push(callbackUrl);
        router.refresh();
      } catch (signUpErr: any) {
        console.error('Quick registration or sign-in failed:', signUpErr);
        setError(`Quick login failed: ${signUpErr.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-dark-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Header logo & slogan */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 neon-glow text-white">
            <Activity className="h-6 w-6" />
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white">
            Welcome to <span className="gradient-text">Orbit API</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to test and track your API endpoints
          </p>
        </div>

        {/* Card containing login form */}
        <div className="glassmorphism rounded-2xl p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm transition-all"
                  placeholder="name@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Sandbox Login Buttons */}
          <div className="mt-6 border-t border-zinc-800/80 pt-6">
            <span className="block text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
              Developer Sandbox Access
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickLogin('developer')}
                disabled={loading}
                className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
              >
                Quick Dev User
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/30 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all cursor-pointer"
              >
                Quick Admin User
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Register for free
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-dark-950 text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  );
}
