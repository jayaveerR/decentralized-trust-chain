"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";



const Successful = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    itemType: "",
    itemName: "",
    walletAddress: "",
    soldBy: "",
    orderId: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  // ✅ Load item data + store order
  useEffect(() => {
    checkWalletConnection();
    if (typeof window !== "undefined") {
      const data = JSON.parse(localStorage.getItem("itemData") || "{}");
      if (Object.keys(data).length > 0) {
        setFormData(data);
        storeOrderData(data);
      }
    }
    
    // Hide animation after 2 seconds
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Wallet check
  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.aptos) {
      try {
        const connected = await window.aptos.isConnected();
        if (connected) {
          const account = await window.aptos.account();
          setIsConnected(true);
          setWalletAddress(account.address);
        }
      } catch (error) {
        console.error("Wallet check failed:", error);
      }
    }
  };

  // ✅ Save order to localStorage
  const storeOrderData = (data: any) => {
    if (typeof window === "undefined" || !data.orderId) return;

    const existingOrders = JSON.parse(localStorage.getItem("myOrders") || "[]");
    
    const isDuplicate = existingOrders.some((order: any) => order.orderId === data.orderId);

    if (!isDuplicate) {
        const newOrder = {
          ...data,
          storedAt: new Date().toISOString(),
          walletConnected: isConnected,
          connectedWallet: walletAddress,
        };
        existingOrders.push(newOrder);
        localStorage.setItem("myOrders", JSON.stringify(existingOrders));
    }
  };

  // ✅ Copy order ID to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ✅ QR Code data
  const qrCodeData = JSON.stringify({
    type: "Trust-Chain Item",
    item: formData.itemName,
    itemType: formData.itemType,
    orderId: formData.orderId,
    soldBy: formData.soldBy,
    pickupDate: formData.pickupDate,
    pickupTime: formData.pickupTime,
    wallet: formData.walletAddress,
    verification: `https://trustchain.verify/item/${formData.orderId}`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 flex flex-col items-center justify-center p-4">
      {/* Success Animation */}
      {showAnimation && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="animate-scale">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-center text-lg font-medium text-gray-700">Processing your transaction...</p>
          </div>
        </div>
      )}
      
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
        {/* ✅ Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Successfully Added to Blockchain!
          </h1>
          <p className="text-gray-600">
            Your item has been securely stored on the Trust-Chain.
          </p>
        </div>

        {/* ✅ Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2 text-sm text-gray-500">
            <span>Order Created</span>
            <span>Blockchain Confirmed</span>
            <span>Completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full w-full"></div>
          </div>
        </div>

        {/* ✅ Item details */}
        <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-gradient-to-br from-gray-50 to-white">
          <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Item Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">🛍️ Type:</span>
              <span className="text-gray-700">{formData.itemType}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">🏷️ Name:</span>
              <span className="text-gray-700">{formData.itemName}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">📋 Order ID:</span>
              <div className="flex items-center">
                <span className="text-gray-700 font-mono mr-2">{formData.orderId}</span>
                <button 
                  onClick={copyToClipboard}
                  className="text-blue-500 hover:text-blue-700"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">👤 Sold By:</span>
              <span className="text-gray-700">{formData.soldBy}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">📅 Date:</span>
              <span className="text-gray-700">{formData.pickupDate}</span>
            </div>
            <div className="flex items-start">
              <span className="font-medium min-w-[100px]">⏰ Time:</span>
              <span className="text-gray-700">{formData.pickupTime}</span>
            </div>
          </div>
        </div>

        {/* ✅ QR + buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <div className="border-4 border-blue-100 rounded-xl p-4 bg-white shadow-md">
              <QRCodeSVG value={qrCodeData} size={150} level="H" />
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              Scan to verify authenticity
            </p>
            <button className="mt-2 text-blue-500 text-sm hover:text-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
          </div>

          <div className="space-y-4 w-full md:w-auto">
            <button
              onClick={() => router.push("/myorders")}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              View My Orders
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full md:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </button>
            <button className="w-full md:w-auto px-6 py-3 text-blue-500 rounded-lg hover:bg-blue-50 transition-all flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Receipt
            </button>
          </div>
        </div>

        {/* ✅ Help section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Need help? <a href="#" className="text-blue-500 ml-1 hover:text-blue-700">Contact support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Successful;