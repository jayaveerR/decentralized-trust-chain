"use client";
// components/Verify.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ScannedData {
  itemType: string;
  itemName: string;
  walletAddress: string;
  orderId: string;
  soldBy: string;
  pickupDate: string;
  pickupTime: string;
}

const Verify = () => {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [verificationResult, setVerificationResult] = useState<null | boolean>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);

  const handleScan = () => {
    setIsScanning(true);
    
    // Simulate scanning process
    setTimeout(() => {
      setIsScanning(false);
      
      // Simulate random success/failure
      const success = Math.random() > 0.3;
      setVerificationResult(success);
      
      if (success) {
        setScannedData({
          itemType: 'shirt',
          itemName: 'Formal Shirt',
          walletAddress: '0x1234...5678',
          orderId: 'ORD-12345',
          soldBy: 'Fashion Store',
          pickupDate: '2023-12-15',
          pickupTime: '14:00'
        });
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center">
          <svg className="w-10 h-10 mr-2" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="10" width="80" height="80" rx="5" stroke="black" strokeWidth="5" />
            <path d="M30 50L45 65L70 35" stroke="black" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xl font-bold">BlockVerify</span>
        </div>
        
        <div className="flex space-x-8">
          {['Home', 'Admin', 'MyOrders', 'Learn'].map((tab) => (
            <button
              key={tab}
              className={`relative py-2 ${tab === 'Home' ? 'font-bold' : ''} group`}
              onClick={() => tab === 'Home' && router.push('/')}
            >
              {tab}
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-black transform origin-left transition-transform duration-300 ${tab === 'Home' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center">
          <span className="mr-4">0x1234...5678</span>
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Verify Product Authenticity</h1>
          <p className="text-gray-600 text-center mb-10">Scan the QR code to verify product details and authenticity on the blockchain</p>
          
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {isScanning ? (
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Scanning...</p>
                  </div>
                ) : verificationResult === null ? (
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-gray-500">Click scan to verify QR code</p>
                  </div>
                ) : verificationResult ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-600 font-bold">Verification Successful!</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-red-600 font-bold">Verification Failed!</p>
                  </div>
                )}
              </div>
              
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-400 rounded-full animate-ping"></div>
              <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="text-center">
            {verificationResult === null && (
              <button 
                onClick={handleScan}
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
              >
                Scan QR Code
              </button>
            )}
            
            {verificationResult !== null && (
              <button 
                onClick={() => {
                  setVerificationResult(null);
                  setScannedData(null);
                }}
                className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
              >
                Scan Another Code
              </button>
            )}
          </div>
          
          {scannedData && verificationResult && (
            <div className="mt-10 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Item Type</p>
                  <p className="font-medium">{scannedData.itemType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Item Name</p>
                  <p className="font-medium">{scannedData.itemName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Wallet Address</p>
                  <p className="font-medium">{scannedData.walletAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">{scannedData.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sold By</p>
                  <p className="font-medium">{scannedData.soldBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pickup Date & Time</p>
                  <p className="font-medium">{scannedData.pickupDate} at {scannedData.pickupTime}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-green-600">This product has been verified on the blockchain</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Verify;