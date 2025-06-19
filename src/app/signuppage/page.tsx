'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient'; // singleton import

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
        aria-label={placeholder}
        title={placeholder}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#5c728a] hover:text-[#101418] transition-colors"
        onClick={() => setShow((v: boolean) => !v)}
        title={show ? "Hide password" : "Show password"}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? (
          <span role="img" aria-label="Hide password">🙈</span>
        ) : (
          <span role="img" aria-label="Show password">👁️</span>
        )}
      </button>
    </div>
  );
}

const features = [
  'Organize course materials',
  'Track progress',
  'Access anywhere',
];

function BrandingSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-400 items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center animate-fade-in-down">
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#ffe5db] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pop-in">
              <svg width={32} height={32} fill="currentColor" viewBox="0 0 256 256">
                <path d="M240,64V192a16,16,0,0,1-16,16H160a24,24,0,0,0-24,24,8,8,0,0,1-16,0,24,24,0,0,0-24-24H32a16,16,0,0,1-16-16V64A16,16,0,0,1,32,48H88a32,32,0,0,1,32,32v88a8,8,0,0,0,16,0V80a32,32,0,0,1,32-32h56A16,16,0,0,1,240,64Z" />
              </svg>
            </div>
            <h1 className="text-4xl font-extrabold mb-4 font-sora tracking-wide animate-fade-in-up animate-delay-100">Welcome to Stitch</h1>
            <p className="text-lg opacity-90 font-sora animate-fade-in-up animate-delay-200">
              Organize, track, and excel in your courses with our intuitive platform.
            </p>
          </div>
          <ul className="space-y-4 text-left">
            {features.map((f, i) => (
              <li key={f} className={`flex items-center gap-3 animate-fade-in-up animate-delay-${3 + i}`}>
                <span className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0 text-xl">✔️</span>
                <span className="font-sora">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Animated gradient blur effect */}
      <span className="absolute w-96 h-96 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-purple-400 via-indigo-200 to-blue-200 opacity-30 blur-3xl rounded-full z-0"></span>
    </div>
  );
}

export default function SignupPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showSignPwd, setShowSignPwd] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup state
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

  // Handle Login with Supabase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        setLoginError(error.message);
      } else {
        window.location.href = '/'; // Redirect to homepage after login
      }
    } catch {
      setLoginError('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Sign Up with Supabase
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError('');
    setSignupSuccess(false);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });
      if (error) {
        setSignupError(error.message);
      } else {
        setSignupSuccess(true);
      }
    } catch {
      setSignupError('Sign up failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100 font-sora">
      {/* Branding (left) */}
      <BrandingSection />
      {/* Forms (right) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 animate-fade-in-down">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-[#ffe5db] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-pop-in"></div>
            <h2 className="text-3xl font-extrabold text-[#101418] font-sora tracking-wide animate-fade-in-up animate-delay-100">Stitch</h2>
          </div>
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Authentication Tabs"
            className="flex mb-8 bg-[#eaedf1] rounded-xl p-1 shadow animate-fade-in-up animate-delay-200"
          >
            <button
              role="tab"
              aria-selected={isLogin ? "true" : "false"}
              tabIndex={isLogin ? 0 : -1}
              className={`flex-1 py-2 px-4 text-md font-bold rounded-lg transition-all font-sora ${isLogin ? 'bg-white text-[#101418] shadow-sm' : 'text-[#5c728a] hover:text-[#101418]'}`}
              onClick={() => handleTab(true)}
              type="button"
            >Sign In</button>
            <button
              role="tab"
              aria-selected={!isLogin ? "true" : "false"}
              tabIndex={!isLogin ? 0 : -1}
              className={`flex-1 py-2 px-4 text-md font-bold rounded-lg transition-all font-sora ${!isLogin ? 'bg-white text-[#101418] shadow-sm' : 'text-[#5c728a] hover:text-[#101418]'}`}
              onClick={() => handleTab(false)}
              type="button"
            >Sign Up</button>
          </div>
          {/* Forms */}
          <div>
            {/* Login Form */}
            {isLogin ? (
              <form className="space-y-4 animate-fade-in-up animate-delay-300" onSubmit={handleLogin} autoComplete="off">
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold text-[#101418] mb-2 font-sora animate-fade-in-up animate-delay-400">Welcome back</h3>
                  <p className="text-[#5c728a] text-md font-sora animate-fade-in-up animate-delay-500">Enter your credentials to access your account</p>
                </div>
                <div>
                  <label htmlFor="login-email" className="block text-md font-bold text-[#101418] mb-2 font-sora">Email</label>
                  <input
                    type="email"
                    id="login-email"
                    className={inputClasses}
                    placeholder="Enter your email"
                    required
                    title="Enter your email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-md font-bold text-[#101418] mb-2 font-sora">Password</label>
                  <PasswordInput
                    id="login-password"
                    placeholder="Enter your password"
                    show={showPwd}
                    setShow={setShowPwd}
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                  />
                </div>
                {loginError && <div className="text-red-600 text-sm font-sora animate-fade-in-up animate-delay-600">{loginError}</div>}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 text-indigo-500 border-[#d4dbe2] rounded focus:ring-indigo-500 focus:ring-2" />
                    <span className="ml-2 text-md text-[#5c728a] font-sora">Remember me</span>
                  </label>
                  <a href="#" className="text-md text-indigo-500 hover:text-indigo-700 font-bold font-sora">Forgot password?</a>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-bold font-sora shadow transition-all duration-200"
                  disabled={loginLoading}
                >
                  {loginLoading ? "Signing In..." : "Sign In"}
                </button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#d4dbe2]"></div></div>
                  <div className="relative flex justify-center text-md">
                    <span className="px-2 bg-white text-[#5c728a] font-sora">or continue with</span>
                  </div>
                </div>
                <button type="button" onClick={() => alert('Google sign in')} className="w-full flex items-center justify-center px-4 py-3 border border-[#d4dbe2] rounded-xl hover:bg-gray-50 font-sora font-bold">
                  <span className="mr-3">🌐</span>Continue with Google
                </button>
              </form>
            ) : (
              <form className="space-y-4 animate-fade-in-up animate-delay-300" onSubmit={handleSignup} autoComplete="off">
                <div className="mb-6">
                  <h3 className="text-2xl font-extrabold text-[#101418] mb-2 font-sora animate-fade-in-up animate-delay-400">Create account</h3>
                  <p className="text-[#5c728a] text-md font-sora animate-fade-in-up animate-delay-500">Start your learning journey today</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first-name" className="block text-md font-bold text-[#101418] mb-2 font-sora">First name</label>
                    <input
                      type="text"
                      id="first-name"
                      className={inputClasses}
                      placeholder="John"
                      required
                      title="Your first name"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-md font-bold text-[#101418] mb-2 font-sora">Last name</label>
                    <input
                      type="text"
                      id="last-name"
                      className={inputClasses}
                      placeholder="Doe"
                      required
                      title="Your last name"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="signup-email" className="block text-md font-bold text-[#101418] mb-2 font-sora">Email</label>
                  <input
                    type="email"
                    id="signup-email"
                    className={inputClasses}
                    placeholder="john@example.com"
                    required
                    title="Your email address"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="block text-md font-bold text-[#101418] mb-2 font-sora">Password</label>
                  <PasswordInput
                    id="signup-password"
                    placeholder="Create a strong password"
                    show={showSignPwd}
                    setShow={setShowSignPwd}
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                  />
                </div>
                {signupError && <div className="text-red-600 text-sm font-sora animate-fade-in-up animate-delay-600">{signupError}</div>}
                {signupSuccess && <div className="text-green-600 text-sm font-sora animate-fade-in-up animate-delay-600">Sign up successful! Please check your email to confirm your account.</div>}
                <div className="flex items-start">
                  <input type="checkbox" className="w-4 h-4 text-indigo-500 border-[#d4dbe2] rounded focus:ring-indigo-500 focus:ring-2 mt-1" required title="Accept Terms" />
                  <span className="ml-2 text-md text-[#5c728a] font-sora">
                    I agree to the{' '}
                    <a href="#" className="text-indigo-500 hover:text-indigo-700 font-bold font-sora">Terms of Service</a> and{' '}
                    <a href="#" className="text-indigo-500 hover:text-indigo-700 font-bold font-sora">Privacy Policy</a>
                  </span>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white py-3 px-4 rounded-xl font-bold font-sora shadow transition-all duration-200"
                  disabled={signupLoading}
                >
                  {signupLoading ? "Creating Account..." : "Create Account"}
                </button>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#d4dbe2]"></div></div>
                  <div className="relative flex justify-center text-md">
                    <span className="px-2 bg-white text-[#5c728a] font-sora">or continue with</span>
                  </div>
                </div>
                <button type="button" onClick={() => alert('Google sign up')} className="w-full flex items-center justify-center px-4 py-3 border border-[#d4dbe2] rounded-xl hover:bg-gray-50 font-sora font-bold">
                  <span className="mr-3">🌐</span>Continue with Google
                </button>
              </form>
            )}
          </div>
          {/* Back to homepage button */}
          <div className="mt-8 flex justify-center animate-fade-in-up animate-delay-700">
            <Link href="/">
              <button
                type="button"
                className="bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] font-bold px-6 py-2 rounded-xl shadow transition-colors font-sora"
              >
                ← Back to Homepage
              </button>
            </Link>
          </div>
        </div>
      </div>
      {/* Animations */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap');
        .font-sora { font-family: 'Sora', sans-serif; }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s cubic-bezier(0.4,0,0.2,1) both;}
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px);}
          to { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in-up { animation: fade-in-up 0.7s cubic-bezier(0.4,0,0.2,1) both;}
        @keyframes pop-in {
          0% { transform: scale(0.7);}
          70% { transform: scale(1.12);}
          100% { transform: scale(1);}
        }
        .animate-pop-in { animation: pop-in 0.6s cubic-bezier(0.4,0,0.2,1) both;}
        /* Animation delay utility classes */
        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        .animate-delay-400 { animation-delay: 0.4s; }
        .animate-delay-500 { animation-delay: 0.5s; }
        .animate-delay-600 { animation-delay: 0.6s; }
        .animate-delay-700 { animation-delay: 0.7s; }
      `}</style>
    </div>
  );
}