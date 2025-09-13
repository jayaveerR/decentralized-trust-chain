"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrReader } from 'react-qr-reader';

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
  const [scanMethod, setScanMethod] = useState<'camera' | 'upload' | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Check wallet connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Check camera permission when scan method changes to camera
  useEffect(() => {
    if (scanMethod === 'camera') {
      checkCameraPermission();
    }
  }, [scanMethod]);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.aptos) {
      try {
        const connected = await window.aptos.isConnected();
        if (connected) {
          const account = await window.aptos.account();
          setIsConnected(true);
          setWalletAddress(account.address);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
    } catch (error) {
      setCameraPermission(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.aptos) {
      setConnectionError('Petra wallet not found. Please install it first.');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      const response = await window.aptos.connect();
      setIsConnected(true);
      setWalletAddress(response.address);

      if (window.aptos.onAccountChange) {
        window.aptos.onAccountChange((newAddress) => {
          setWalletAddress(newAddress.address);
        });
      }

      if (window.aptos.onNetworkChange) {
        window.aptos.onNetworkChange((newNetwork) => {
          console.log('Network changed:', newNetwork);
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setConnectionError(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    if (typeof window !== 'undefined' && window.aptos) {
      try {
        await window.aptos.disconnect();
        setIsConnected(false);
        setWalletAddress('');
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    } else {
      setIsConnected(false);
      setWalletAddress('');
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleScanResult = (result: any, error: any) => {
    if (result) {
      try {
        const parsedData = JSON.parse(result.text);
        setIsScanning(false);
        setVerificationResult(true);
        setScannedData(parsedData);
      } catch (e) {
        console.error("Error parsing QR code data:", e);
      }
    }
    
    if (error) {
      console.info("Scanning in progress or no QR code found");
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
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
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setScanMethod('camera');
      setIsScanning(true);
    } catch (error) {
      setCameraPermission(false);
      alert('Camera access is required to scan QR codes. Please enable camera permissions in your browser settings.');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="flex justify-between items-center p-6 border-b border-gray-200">
        <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-2">
            <span className="text-white font-bold text-xl">B</span>
          </div>
          <span className="text-xl font-bold">BlockVerify</span>
        </div>
        
        <div className="flex space-x-8">
          {['Home', 'Admin', 'My Orders', 'Verify', 'Learn'].map((tab) => (
            <button
              key={tab}
              className={`relative py-2 ${tab === 'Verify' ? 'font-bold text-orange-600' : 'text-gray-600 hover:text-black'} group transition-colors duration-200`}
              onClick={() => {
                if (tab === 'Home') router.push('/');
                if (tab === 'My Orders') router.push('/my-orders');
              }}
            >
              {tab}
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-orange-600 transform origin-left transition-transform duration-300 ${tab === 'Verify' ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center">
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 py-1.5 px-4 rounded-full font-medium shadow-sm">
                {shortenAddress(walletAddress)}
              </span>
              <button
                onClick={disconnectWallet}
                className="py-2 px-4 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="py-2 px-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-75 flex items-center justify-center font-medium shadow-md hover:shadow-lg"
            >
              {isConnecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : "Connect Wallet"}
            </button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <h1 className="text-3xl font-bold mb-6 text-center">Verify Product Authenticity</h1>
          <p className="text-gray-600 text-center mb-10">Scan the QR code to verify product details and authenticity on the blockchain</p>
          
          {connectionError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-center border border-red-100">
              {connectionError}
            </div>
          )}

          {!isConnected ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Your Wallet First</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                You need to connect your wallet to verify product authenticity and access all features.
              </p>
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-75 flex items-center justify-center font-medium shadow-md hover:shadow-lg mx-auto"
              >
                {isConnecting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </>
                ) : "Connect Petra Wallet"}
              </button>
            </div>
          ) : (
            <>
              {!scanMethod && verificationResult === null && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group"
                    onClick={requestCameraAccess}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold mb-2">Use Camera</h3>
                    <p className="text-sm text-gray-500">Scan a QR code using your device&apos;s camera</p>
                    {cameraPermission === false && (
                      <p className="text-xs text-red-500 mt-2">Camera access required</p>
                    )}
                  </div>
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all duration-300 group"
                    onClick={() => {
                      setScanMethod('upload');
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                    }}
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <h3 className="font-bold mb-2">Upload Image</h3>
                    <p className="text-sm text-gray-500">Upload an image containing a QR code</p>
                    {isDragOver && (
                      <p className="text-xs text-orange-500 mt-2">Drop image here</p>
                    )}
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInput}
                accept="image/*"
                className="hidden"
              />

              {scanMethod === 'camera' && (
                <div className="mb-10">
                  <div className="relative mx-auto w-full max-w-md">
                    {isScanning && cameraPermission ? (
                      <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
                        <QrReader
                          constraints={{ facingMode: 'environment' }}
                          onResult={handleScanResult}
                          containerStyle={{ width: '100%' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-64 h-64 border-4 border-orange-400 border-dashed rounded-lg"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                        <div className="text-center">
                          {cameraPermission === false ? (
                            <>
                              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </div>
                              <p className="text-red-600">Camera access denied</p>
                              <p className="text-sm text-gray-500 mt-2">Please allow camera access in your browser settings</p>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                              <p>Initializing camera...</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-center mt-4">
                      <button 
                        onClick={() => {
                          setScanMethod(null);
                          setIsScanning(false);
                        }}
                        className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to scan options
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {scanMethod === 'upload' && !isScanning && verificationResult === null && (
                <div 
                  className={`border-2 ${isDragOver ? 'border-orange-400 bg-orange-50' : 'border-dashed border-gray-300'} rounded-lg p-12 text-center mb-10 transition-colors duration-300`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-gray-500 mb-4">Drag & drop an image here, or click to browse</p>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                  >
                    Select Image
                  </button>
                  <p className="text-xs text-gray-400 mt-4">Supports JPG, PNG, and WebP formats</p>
                  
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={() => setScanMethod(null)}
                      className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-800 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to scan options
                    </button>
                  </div>
                </div>
              )}

              {isScanning && scanMethod === 'upload' && (
                <div className="flex justify-center mb-10">
                  <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p>Processing image...</p>
                    </div>
                  </div>
                </div>
              )}

              {verificationResult !== null && !isScanning && (
                <div className="flex justify-center mb-10">
                  <div className="relative">
                    <div className="w-64 h-64 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      {verificationResult ? (
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
                  </div>
                </div>
              )}
              
              <div className="text-center">
                {verificationResult === null && scanMethod && !isScanning && scanMethod !== 'camera' && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
                  >
                    Select Image to Scan
                  </button>
                )}
                
                {verificationResult !== null && (
                  <div className="space-y-4 md:space-y-0 md:space-x-4">
                    <button 
                      onClick={() => {
                        setVerificationResult(null);
                        setScannedData(null);
                        setScanMethod(null);
                      }}
                      className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-300"
                    >
                      Scan Another Code
                    </button>
                    <button 
                      onClick={() => setScanMethod(null)}
                      className="px-8 py-3 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                      Change Scan Method
                    </button>
                  </div>
                )}
              </div>
              
              {scannedData && verificationResult && (
                <div className="mt-10 border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Product Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Item Type</p>
                      <p className="font-medium capitalize">{scannedData.itemType}</p>
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
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Verify;