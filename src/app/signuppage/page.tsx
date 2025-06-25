'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import RedirectWrapper from '../components/redirectwrapper';

const inputClasses =
  'w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-10 transition-all bg-white text-gray-900 placeholder-gray-400';

function PasswordInput({
  id,
  placeholder,
  show,
  setShow,
  value,
  onChange,
}: {
  id: string;
  placeholder: string;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        id={id}
        className={inputClasses + ' pr-12'}
        placeholder={placeholder}
        required
        title={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
        onClick={() => setShow((v) => !v)}
        title={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

export default function SignupPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showSignPwd, setShowSignPwd] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleTab = (login: boolean) => {
    setIsLogin(login);
    setLoginError('');
    setSignupError('');
    setSignupSuccess(false);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) setLoginError(error.message);
      else window.location.href = '/';
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess(false);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { first_name: firstName, last_name: lastName } },
      });
      if (error) setSignupError(error.message);
      else setSignupSuccess(true);
    } catch {
      setSignupError('Sign up failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
    if (error) {
      alert('Google sign-in failed: ' + error.message);
    }
  };

  return (
    <RedirectWrapper>
      <div className="min-h-screen flex flex-col md:flex-row items-center justify-center bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 px-2">
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-400 p-12 w-1/2 h-full min-h-screen text-white">
          <div className="mb-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-4xl">
              🎓
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-wide">Welcome to Stitch</h1>
            <p className="text-lg opacity-90">Organize, track, and excel in your courses with our intuitive platform.</p>
          </div>
          <ul className="space-y-3 text-left text-lg">
            <li>📚 Organize course materials</li>
            <li>📈 Track progress easily</li>
            <li>📱 Access anywhere, anytime</li>
            <li>🎯 Stay on top of deadlines</li>
            <li>✨ Modern UI that feels great</li>
          </ul>
        </div>
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-16">
          <div className="w-full max-w-md mx-auto bg-white/95 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 animate-fade-in-up">
            <div className="flex mb-2 bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all duration-300 ${
                  isLogin ? 'bg-white shadow text-indigo-700' : 'text-gray-500'
                }`}
                onClick={() => handleTab(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all duration-300 ${
                  !isLogin ? 'bg-white shadow text-indigo-700' : 'text-gray-500'
                }`}
                onClick={() => handleTab(false)}
              >
                Sign Up
              </button>
            </div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 py-3 mb-2 bg-white border border-gray-300 rounded-xl shadow hover:bg-gray-50 transition-all duration-300 text-gray-700 font-semibold text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C36.64 2.7 30.74 0 24 0 14.82 0 6.73 5.48 2.69 13.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.64-.15-3.22-.43-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.6C43.27 37.27 46.1 31.4 46.1 24.5z"/><path fill="#FBBC05" d="M10.67 28.65c-1.13-3.36-1.13-6.94 0-10.3l-7.98-6.2C.9 16.36 0 20.06 0 24c0 3.94.9 7.64 2.69 11.15l7.98 6.2z"/><path fill="#EA4335" d="M24 48c6.74 0 12.64-2.23 16.84-6.07l-7.19-5.6c-2.01 1.35-4.6 2.17-7.65 2.17-6.38 0-11.87-3.63-14.33-8.85l-7.98 6.2C6.73 42.52 14.82 48 24 48z"/></g></svg>
              {isLogin ? 'Sign in with Google' : 'Sign up with Google'}
            </button>
            {isLogin ? (
              <form onSubmit={handleLogin} autoComplete="off" className="space-y-4 animate-fade-in-up">
                <div>
                  <label htmlFor="login-email" className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    className={inputClasses}
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block font-semibold mb-1">Password</label>
                  <PasswordInput
                    id="login-password"
                    placeholder="Password"
                    show={showPwd}
                    setShow={setShowPwd}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && <p className="text-red-600">{loginError}</p>}
                <button type="submit" disabled={loginLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition-all duration-300">
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <p className="text-sm text-center">
                  Don&apos;t have an account?{' '}
                  <span onClick={() => handleTab(false)} className="text-indigo-600 cursor-pointer font-semibold">
                    Sign Up
                  </span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} autoComplete="off" className="space-y-4 animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block font-semibold mb-1">First Name</label>
                    <input
                      type="text"
                      id="first-name"
                      className={inputClasses}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block font-semibold mb-1">Last Name</label>
                    <input
                      type="text"
                      id="last-name"
                      className={inputClasses}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-email" className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    id="signup-email"
                    className={inputClasses}
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="block font-semibold mb-1">Password</label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="Password"
                    show={showSignPwd}
                    setShow={setShowSignPwd}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                {signupError && <p className="text-red-600">{signupError}</p>}
                {signupSuccess && <p className="text-green-600">🎉 Sign up successful! Check your email.</p>}
                <button type="submit" disabled={signupLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition-all duration-300">
                  {signupLoading ? 'Creating...' : 'Sign Up'}
                </button>
                <p className="text-sm text-center">
                  Already have an account?{' '}
                  <span onClick={() => handleTab(true)} className="text-indigo-600 cursor-pointer font-semibold">
                    Sign In
                  </span>
                </p>
              </form>
            )}
            <div className="mt-4 text-center">
              <Link href="/" className="text-gray-500 hover:underline">
                ⬅️ Back to home
              </Link>
            </div>
          </div>
        </div>
        <style jsx global>{`
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.7s cubic-bezier(0.4,0,0.2,1) both;
          }
        `}</style>
      </div>
    </RedirectWrapper>
  );
}
