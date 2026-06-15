'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Activity, Lock, Mail, User, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (signUpError) {
        setError(signUpError.message || 'Registration failed');
      } else {
        setSuccess(true);
        // Automatically sign in the user
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        });

        if (signInError) {
          // If auto sign-in fails, redirect to login page
          setTimeout(() => {
            router.push('/login');
          }, 1500);
        } else {
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
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
            Create an Account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start testing and tracking your API evolution today
          </p>
        </div>

        {/* Card containing register form */}
        <div className="glassmorphism rounded-2xl p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 p-3 text-sm text-emerald-400">
                <span>Account created successfully! Redirecting...</span>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-zinc-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm transition-all"
                  placeholder="Ali"
                  disabled={loading || success}
                />
              </div>
            </div>

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
                  disabled={loading || success}
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
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 py-2.5 pl-10 pr-3 text-white placeholder-zinc-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm transition-all"
                  placeholder="At least 6 characters"
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || success}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-950 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Sign Up
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition-colors">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
