import React from "react";
import Image from "next/image";

const features = [
  "Organize course materials",
  "Track progress",
  "Access anywhere",
];

export default function BrandingSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 via-purple-600 to-blue-400 items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
        <div className="max-w-md text-center fadeIn">
          <div className="mb-8">
            <div className="w-16 h-16 bg-[#ffe5db] rounded-full flex items-center justify-center mx-auto mb-4">
              <Image src="/stitch-mark.png" alt="" width={44} height={44} className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Welcome to Stitch</h1>
            <p className="text-lg opacity-90">
              Organize, track, and excel in your courses with our intuitive platform.
            </p>
          </div>
          <ul className="space-y-4 text-left">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <span className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">✔️</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
