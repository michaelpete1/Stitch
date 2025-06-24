'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setNameInput(
        data.user?.user_metadata?.name ||
        data.user?.user_metadata?.full_name ||
        data.user?.email?.split('@')[0] ||
        ''
      );
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setNameInput(
        session?.user?.user_metadata?.name ||
        session?.user?.user_metadata?.full_name ||
        session?.user?.email?.split('@')[0] ||
        ''
      );
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const bio =
    user?.user_metadata?.bio ||
    'Student';

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=667eea&color=fff&size=128`;

  const email = user?.email || '';

  // Edit name handler
  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Update user_metadata.name
    const { error } = await supabase.auth.updateUser({
      data: { ...user?.user_metadata, name: nameInput }
    });

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update name: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Name updated!' });
      // Refetch user to update UI
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setEditing(false);
    }
    setSaving(false);
  }

  // Add this function for avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `public/${user.id}/avatar.${fileExt}`;
    // 1. Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    if (error) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
      setUploading(false);
      return;
    }
    // 2. Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;
    if (!publicUrl) {
      setMessage({ type: 'error', text: 'Could not get public URL!' });
      setUploading(false);
      return;
    }
    // 3. Update user profile
    const { error: updateError } = await supabase.auth.updateUser({
      data: { ...user.user_metadata, avatar_url: publicUrl }
    });
    setUploading(false);
    if (updateError) {
      setMessage({ type: 'error', text: 'Profile update failed: ' + updateError.message });
    } else {
      setMessage({ type: 'success', text: 'Profile photo updated!' });
      // Refetch user to update UI
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 bg-gradient-to-br from-indigo-100 via-blue-100 to-purple-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 mt-16 animate-fade-in-down">
        <div className="flex flex-col items-center">
          <div className="relative mb-4">
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-2 bg-indigo-200 blur-2xl opacity-60 rounded-full z-0"></span>
            <Image
              src={avatarUrl}
              alt={displayName + " avatar"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-[#dce7f3] object-cover shadow-lg relative z-10"
              priority
              unoptimized // For external URLs
            />
            <label htmlFor="avatar-upload" className="mt-2 px-4 py-1 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-semibold shadow cursor-pointer">
              {uploading ? 'Uploading...' : 'Change Photo'}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="sr-only"
                onChange={handleAvatarChange}
                aria-label="Upload profile photo"
                title="Upload profile photo"
              />
            </label>
          </div>
          {editing ? (
            <form onSubmit={handleSaveName} className="flex flex-col items-center w-full animate-fade-in-up animate-delay-100">
              <input
                className="text-2xl font-extrabold text-[#101418] tracking-tight mb-1 border rounded-lg px-3 py-2 w-full text-center"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                disabled={saving}
                maxLength={64}
                required
                aria-label="Name"
              />
              <div className="flex gap-2 w-full mt-2">
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-400 hover:from-indigo-600 hover:to-blue-500 text-white font-semibold shadow-md transition-all duration-300"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#101418] font-semibold shadow transition-colors"
                  type="button"
                  disabled={saving}
                  onClick={() => { setEditing(false); setNameInput(displayName); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-[#101418] tracking-tight mb-1 animate-fade-in-up animate-delay-100">{displayName}</h2>
              <button
                className="px-3 py-1 rounded text-xs bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] shadow animate-fade-in-up animate-delay-200"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit Name
              </button>
            </>
          )}
          <p className="text-[#667eea] text-sm mb-2 animate-fade-in-up animate-delay-200">{email}</p>
          <p className="text-[#101418] text-center mb-6 animate-fade-in-up animate-delay-300">{bio}</p>
          {message && (
            <div
              className={`mb-2 text-center w-full text-sm ${message.type === "error" ? "text-red-500" : "text-green-600"}`}
            >
              {message.text}
            </div>
          )}
          <Link href="/" className="mt-8 w-full flex items-center justify-center animate-fade-in-up animate-delay-500">
            <button
              className="px-6 py-2 rounded-lg bg-[#eaedf1] hover:bg-[#dce7f3] text-[#101418] font-semibold shadow transition-colors w-full"
              type="button"
            >
              ← Back to Homepage
            </button>
          </Link>
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
        .animate-delay-100 { animation-delay: 0.1s; }
        .animate-delay-200 { animation-delay: 0.2s; }
        .animate-delay-300 { animation-delay: 0.3s; }
        .animate-delay-400 { animation-delay: 0.4s; }
        .animate-delay-500 { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
}