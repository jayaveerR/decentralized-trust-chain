"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import Login from "@/components/Login";
import Image from 'next/image';
import Link from 'next/link';
import heroImage from '@/assets/hero-ecommerce.jpg';
import { WalletSelector } from "@/components/WalletSelector";
import React, { useState } from 'react';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState("home");

  

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6">
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

        <div className="flex space-x-8">
          {["Home", "Admin", "Learn"].map((tab) => (
            <button
              key={tab}
              className={`relative py-2 ${
                activeTab === tab.toLowerCase() ? "font-bold" : ""
              } group`}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-black transform origin-left transition-transform duration-300 ${
                  activeTab === tab.toLowerCase()
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              ></span>
            </button>
          ))}
          <Link href="/myorders">
            <button
              key="MyOrders"
              className={`relative py-2 ${
                activeTab === "myorders" ? "font-bold" : ""
              } group`}
              onClick={() => setActiveTab("myorders")}
            >
              MyOrders
              <span
                className={`absolute bottom-0 left-0 w-full h-0.5 bg-black transform origin-left transition-transform duration-300 ${
                  activeTab === "myorders"
                    ? "scale-x-100"
                    : "scale-x-0 group-hover:scale-x-100"
                }`}
              ></span>
            </button>
          </Link>
        </div>

        <div className="flex items-center">
          <span className="mr-4">
                          <WalletSelector />

          </span>
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Text Section */}
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-5xl font-bold mb-6">
              Decentralized Return & Refund
            </h1>
            <p className="text-lg mb-8">
              Blockchain-powered solution for fraud-proof returns and refunds in
              e-commerce
            </p>

            <div className="flex space-x-4">
             <Link href='/itemadd'>
              <button 
                className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
              >
                Add Items
              </button>
              </Link>
              <Link href='/verify'>
              <button 
              className="px-6 py-3 bg-transparent border border-black text-black rounded-lg hover:bg-gray-100 transition-colors duration-300">
                Verify Product
              </button>
              </Link>
            </div>
          </div>

          {/* Image Section */}
          <div className="md:w-1/2 flex justify-center">
            <Image
              src={heroImage}
              alt="E-commerce blockchain"
              className="w-180 h-96 object-cover rounded-xl shadow-lg"
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Fraud-Proof Protection</h3>
            <p className="text-gray-600">
              Eliminate fake returns and refund scams with blockchain
              verification
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 14v6m-3-3h6M6 10h2a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2zm10-4a2 2 0 11-4 0 2 2 0 014 0zM4 6a2 2 0 100 4h16a2 2 0 100-4H4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Cross-Platform</h3>
            <p className="text-gray-600">
              Works across all e-commerce platforms, not just one company
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">QR Verification</h3>
            <p className="text-gray-600">
              Each product has a unique QR code for verification at every stage
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <p>© 2023 BlockVerify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  const { connected } = useWallet();

  return (
    <div>
      {connected ? (
        <HomePage />
      ) : (
        <div className="min-h-screen w-full">
          <Login />
        </div>
      )}
    </div>
  );
}

export default App;
