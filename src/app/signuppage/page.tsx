'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import RedirectWrapper from '../components/redirectwrapper';

const inputClasses =
  'w-full px-4 py-3 border border-[#d4dbe2] rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300 focus:ring-opacity-10 transition-all bg-white font-sora';

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
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5c728a] hover:text-[#101418] transition-colors"
        onClick={() => setShow((v) => !v)}
        title={show ? 'Hide password' : 'Show password'}
      >
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

const features = [
  '📚 Organize course materials',
  '📈 Track progress easily',
  '📱 Access anywhere, anytime',
  '🎯 Stay on top of deadlines',
  '✨ Modern UI that feels great',
];

function BrandingSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-400 items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center animate-fade-in-down">
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#ffe5db] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pop-in">
              📘
            </div>
            <h1 className="text-4xl font-extrabold mb-4 font-sora tracking-wide animate-fade-in-up animate-delay-100">
              Welcome to Stitch 🎓
            </h1>
            <p className="text-lg opacity-90 font-sora animate-fade-in-up animate-delay-200">
              Organize, track, and excel in your courses with our intuitive platform.
            </p>
          </div>
          <ul className="space-y-4 text-left">
            {features.map((f, i) => (
              <li
                key={f}
                className="flex items-center gap-3 animate-fade-in-up"
                style={{ animationDelay: `${(i + 3) * 0.1}s` }}
              >
                <span className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  ✅
                </span>
                <span className="font-sora">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <span className="absolute w-96 h-96 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-purple-400 via-indigo-200 to-blue-200 opacity-30 blur-3xl rounded-full z-0"></span>
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

  return (
    <RedirectWrapper>
      <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 font-sora">
        <BrandingSection />
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-down">
            <div className="lg:hidden text-center mb-8">
              <h2 className="text-3xl font-extrabold text-[#101418] font-sora mb-4">Stitch</h2>
            </div>
            <div className="flex mb-8 bg-[#eaedf1] rounded-xl p-1 shadow">
              <button
                className={`flex-1 py-2 px-4 font-bold rounded-lg transition ${
                  isLogin ? 'bg-white shadow-sm' : 'text-[#5c728a]'
                }`}
                onClick={() => handleTab(true)}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 px-4 font-bold rounded-lg transition ${
                  !isLogin ? 'bg-white shadow-sm' : 'text-[#5c728a]'
                }`}
                onClick={() => handleTab(false)}
              >
                Sign Up
              </button>
            </div>

            {isLogin ? (
              <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
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
                <button type="submit" disabled={loginLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl">
                  {loginLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <p className="text-sm text-center">
                  Don&apos;t have an account?{' '}
                  <span onClick={() => handleTab(false)} className="text-indigo-600 cursor-pointer">
                    Sign Up
                  </span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleSignup} autoComplete="off" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <button type="submit" disabled={signupLoading} className="w-full py-3 bg-indigo-600 text-white rounded-xl">
                  {signupLoading ? 'Creating...' : 'Sign Up'}
                </button>
                <p className="text-sm text-center">
                  Already have an account?{' '}
                  <span onClick={() => handleTab(true)} className="text-indigo-600 cursor-pointer">
                    Sign In
                  </span>
                </p>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-500 hover:underline">
                ⬅️ Back to home
              </Link>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
          .font-sora { font-family: 'Sora', sans-serif; }

          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.6s ease-out;
          }
        `}</style>
      </div>
    </RedirectWrapper>
  );
}
