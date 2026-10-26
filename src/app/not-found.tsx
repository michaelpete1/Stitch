import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4 text-center">
      <h1 className="text-4xl font-bold text-indigo-700 mb-4">
        Page not found
      </h1>
      <p className="text-gray-600 mb-6">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-indigo-600 px-5 py-3 text-white font-medium shadow hover:bg-indigo-700"
      >
        Go home
      </Link>
    </div>
  );
}
