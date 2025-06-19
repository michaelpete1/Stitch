import React from "react";

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
              <svg width={32} height={32} fill="currentColor" viewBox="0 0 256 256">
                <path d="M240,64V192a16,16,0,0,1-16,16H160a24,24,0,0,0-24,24,8,8,0,0,1-16,0,24,24,0,0,0-24-24H32a16,16,0,0,1-16-16V64A16,16,0,0,1,32,48H88a32,32,0,0,1,32,32v88a8,8,0,0,0,16,0V80a32,32,0,0,1,32-32h56A16,16,0,0,1,240,64Z" />
              </svg>
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