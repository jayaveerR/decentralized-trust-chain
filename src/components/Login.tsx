"use client";
// components/Login.tsx
import React, { useState, useEffect } from "react";
import { WalletSelector } from "./WalletSelector";

const Login = () => {
  const [isHeadingVisible, setIsHeadingVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeadingVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <nav className="flex justify-between items-center p-6 absolute top-0 w-full">
        <div className="flex items-center">
          <svg
            className="w-10 h-10 mr-2"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="10"
              y="10"
              width="80"
              height="80"
              rx="5"
              stroke="black"
              strokeWidth="5"
            />
            <path
              d="M30 50L45 65L70 35"
              stroke="black"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-xl font-bold">BlockVerify</span>
        </div>
        <button
          className="px-6 py-2 bg-transparent border border-black text-black rounded-full hover:bg-black hover:text-white transition-colors duration-300"
        >
          Connect Wallet
        </button>
      </nav>

      <main className="flex-grow flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-orange-300 rounded-full filter blur-xl opacity-30"></div>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-orange-200 rounded-full filter blur-xl opacity-20"></div>

        <h1
          className={`text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6 transition-all duration-1000 ${
            isHeadingVisible
              ? "translate-y-0 opacity-100"
              : "-translate-y-10 opacity-0"
          }`}
        >
          Decentralized Return & Refund
          <br />
          <span className="text-orange-500">Mechanism Trust-Chain</span>
        </h1>

        <p className="text-sm md:text-base text-center mb-10 max-w-2xl">
          Trust-Chain returns: Fraud-Proof Buyer-Seller Protection
        </p>

        <div className="flex flex-col sm:flex-row gap-4 z-10">
          <WalletSelector />

          <button className="px-8 py-3 bg-transparent border border-black text-black rounded-full hover:bg-gray-100 transition-colors duration-300">
            Learn More
          </button>
        </div>

        <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-orange-100 rounded-full filter blur-2xl opacity-40"></div>
        <div className="absolute -bottom-40 left-10 w-40 h-40 bg-orange-200 rounded-full filter blur-2xl opacity-30"></div>
      </main>
    </div>
  );
};

export default Login;
