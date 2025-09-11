"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

const Error = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-50 p-8 rounded-lg shadow-lg text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Transaction Failed</h1>
        <p className="text-gray-600 mb-8">Error: Blockchain store failed. Please try again.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/itemadd')}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
          >
            Try Again
          </button>
          <button 
            onClick={() => router.push('/')}
            className="w-full py-3 bg-transparent border border-black text-black rounded-lg hover:bg-gray-100 transition-colors duration-300"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Error;