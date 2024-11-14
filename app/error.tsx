'use client';

export default function Error() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">500 - Server Error</h1>
        <p className="mt-2 text-gray-600">Something went wrong on our end.</p>
      </div>
    </div>
  );
} 