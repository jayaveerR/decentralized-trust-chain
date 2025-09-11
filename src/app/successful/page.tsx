"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const Successful = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    // Get data from localStorage
    if (typeof window !== 'undefined') {
      const data = JSON.parse(localStorage.getItem('itemData') || '{}');
      setFormData(data);
    }
  }, []);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    // Get SVG element
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    // Create image to convert SVG to canvas
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to PNG and download
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `trustchain-${formData.orderId || 'item'}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      URL.revokeObjectURL(svgUrl);
    };
    
    img.src = svgUrl;
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create QR code data that will be scannable and show details
  const qrCodeData = JSON.stringify({
    type: 'Trust-Chain Item',
    item: formData.itemName,
    itemType: formData.itemType,
    orderId: formData.orderId,
    soldBy: formData.soldBy,
    pickupDate: formData.pickupDate,
    pickupTime: formData.pickupTime,
    wallet: formData.walletAddress,
    verification: `https://trustchain.verify/item/${formData.orderId}`
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-800 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-green-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Successfully Added to Blockchain!
          </h1>
          
          <p className="text-gray-600">
            Your item has been securely stored on the Trust-Chain
          </p>
        </div>
        
        <div className="border border-gray-200 rounded-xl p-6 mb-8 bg-gradient-to-br from-gray-50 to-white">
          <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 text-blue-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            Item Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Item Type", value: formData.itemType || 'Shirt', icon: "🛍️" },
              { label: "Item Name", value: formData.itemName || 'Formal Shirt', icon: "🏷️" },
              { label: "Order ID", value: formData.orderId || 'ORD-12345', icon: "📋" },
              { label: "Sold By", value: formData.soldBy || 'Fashion Store', icon: "👤" },
              { label: "Pickup Date", value: formData.pickupDate || '2023-12-15', icon: "📅" },
              { label: "Pickup Time", value: formData.pickupTime || '14:00', icon: "⏰" },
            ].map((item, index) => (
              <div key={index} className="flex flex-col">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </div>
                <p className="font-medium text-gray-900">{item.value}</p>
              </div>
            ))}
            
            <div className="flex flex-col">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <span className="mr-2">👛</span>
                Wallet Address
              </div>
              <div className="flex items-center">
                <p className="font-medium text-gray-900 text-sm mr-2">
                  {formData.walletAddress ? 
                    `${formData.walletAddress.substring(0, 6)}...${formData.walletAddress.substring(formData.walletAddress.length - 4)}` : 
                    '0x1234...5678'
                  }
                </p>
                <button 
                  onClick={() => copyToClipboard(formData.walletAddress)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center">
            <div className="border-4 border-blue-100 rounded-xl p-4 bg-white shadow-md">
              <QRCodeSVG
                ref={qrRef}
                value={qrCodeData}
                size={150}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">Scan to verify authenticity</p>
          </div>
          
          <div className="space-y-4 w-full md:w-auto">
            <button 
              onClick={downloadQRCode}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code
            </button>
            
            <button 
              onClick={() => router.push('/')}
              className="w-full md:w-auto px-6 py-3 bg-transparent border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default Successful;