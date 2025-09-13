"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

interface Item {
  item_type: string;
  item_name: string;
  order_id: string;
  pickup_date: string;
  pickup_time: string;
  wallet_address: string;
  sold_by: string;
}



const MyOrders = () => {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const qrRef = useRef(null);

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.aptos) {
      try {
        const connected = await window.aptos.isConnected();
        if (connected) {
          const account = await window.aptos.account();
          setIsConnected(true);
          setWalletAddress(account.address);
          setConnectionStatus('success');
          fetchItems(account.address);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const clearData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("myOrders");
      setItems([]);
      setShowClearConfirm(false);
    }
  };

  const fetchItems = (address: string) => {
    if (!address) return;

    setLoadingItems(true);
    setErrorMessage('');

    try {
      const allOrdersText = localStorage.getItem("myOrders");
      if (allOrdersText) {
        const allOrders = JSON.parse(allOrdersText);
        const userOrders = allOrders.filter(
          (order: any) => order.walletAddress === address
        );

        const formattedItems: Item[] = userOrders.map((order: any) => ({
          item_type: order.itemType,
          item_name: order.itemName,
          order_id: order.orderId,
          pickup_date: order.pickupDate,
          pickup_time: order.pickupTime,
          wallet_address: order.walletAddress,
          sold_by: order.soldBy,
        }));
        setItems(formattedItems);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching items from localStorage:', err);
      setErrorMessage('Failed to fetch items from local storage.');
    } finally {
      setLoadingItems(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.aptos) {
      setConnectionStatus('error');
      setErrorMessage('Petra wallet not found. Please install it first.');
      return;
    }

    setIsLoading(true);
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      const response = await window.aptos.connect();
      setIsConnected(true);
      setWalletAddress(response.address);
      setConnectionStatus('success');
      fetchItems(response.address);

      if (window.aptos.onAccountChange) {
        window.aptos.onAccountChange((newAddress) => {
          setWalletAddress(newAddress.address);
          fetchItems(newAddress.address);
        });
      }

      if (window.aptos.onNetworkChange) {
        window.aptos.onNetworkChange((newNetwork) => {
          console.log('Network changed:', newNetwork);
          if (isConnected && walletAddress) {
            fetchItems(walletAddress);
          }
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (typeof window !== 'undefined' && window.aptos) {
      try {
        await window.aptos.disconnect();
        setIsConnected(false);
        setWalletAddress('');
        setConnectionStatus('idle');
        setItems([]);
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    } else {
      setIsConnected(false);
      setWalletAddress('');
      setConnectionStatus('idle');
      setItems([]);
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const showQRCode = (item: Item) => {
    setSelectedItem(item);
    setShowQRModal(true);
  };

  const downloadQRCode = () => {
    if (!selectedItem || !qrRef.current) return;

    try {
      const svgElement = qrRef.current as any;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `blockverify-qr-${selectedItem.order_id}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          URL.revokeObjectURL(svgUrl);
        }
      };

      img.src = svgUrl;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      const svgElement = qrRef.current as any;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `blockverify-qr-${selectedItem.order_id}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getQRCodeData = (item: Item | null) => {
    if (!item) return '';

    return JSON.stringify({
      type: 'Trust-Chain Item',
      item: item.item_name,
      itemType: item.item_type,
      orderId: item.order_id,
      soldBy: item.sold_by,
      pickupDate: item.pickup_date,
      pickupTime: item.pickup_time,
      wallet: item.wallet_address,
      verification: `https://trustchain.verify/item/${item.order_id}`
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => router.push("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900">BlockVerify</span>
          </div>

          <nav className="hidden md:flex space-x-8">
            {["Home", "Products", "My Orders", "Verify", "Settings"].map((item) => (
              <button
                key={item}
                className={`font-medium transition-colors duration-200 py-2 px-1 border-b-2 ${item === "My Orders"
                    ? "text-orange-600 border-orange-600"
                    : "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                  }`}
                onClick={() => {
                  if (item === "Home") router.push("/");
                  if (item === "Verify") router.push("/verify");
                }}
              >
                {item}
              </button>
            ))}
          </nav>

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
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200 shadow-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
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
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">My Orders</h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            {isConnected
              ? `Items associated with your wallet: ${shortenAddress(walletAddress)}`
              : "Connect your wallet to view your orders"}
          </p>
        </div>

        {!isConnected ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center transition-all hover:shadow-xl">
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
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Petra wallet to view items associated with your wallet address.
            </p>

            {connectionStatus === 'error' && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                {errorMessage}
              </div>
            )}

            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-75 flex items-center justify-center font-medium shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            {connectionStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg text-center border border-green-200 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                </svg>
                Wallet connected successfully. Showing items for: {shortenAddress(walletAddress)}
              </div>
            )}

            {loadingItems ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                <p className="text-gray-700">Loading your orders...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Error Loading Orders</h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() => fetchItems(walletAddress)}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900">No Orders Found</h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">We couldn&apos;t find any orders associated with your wallet address.</p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="py-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Your Orders ({items.length})</h2>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => fetchItems(walletAddress)}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                      </svg>
                      Refresh
                    </button>

                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="flex items-center text-sm text-red-600 hover:text-red-800"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Data
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="bg-gradient-to-r from-white to-white-800 text-black p-5 border-b border-gray-200">
                        <h3 className="text-xl font-bold truncate">{item.item_name}</h3>
                        <p className="text-black text-sm capitalize mt-1">{item.item_type}</p>
                      </div>
                      <div className="p-5">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Order ID</p>
                            <p className="font-medium truncate text-gray-900 mt-1">{item.order_id}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pickup Date</p>
                              <p className="font-medium text-gray-900 mt-1">{item.pickup_date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pickup Time</p>
                              <p className="font-medium text-gray-900 mt-1">{item.pickup_time}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Sold By</p>
                            <p className="font-medium truncate text-gray-900 mt-1">{item.sold_by}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Wallet Address</p>
                            <p className="font-medium text-sm truncate text-gray-900 mt-1">{item.wallet_address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => showQRCode(item)}
                          className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center font-medium shadow-md hover:shadow-lg"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                            />
                          </svg>
                          Show QR Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* QR Code Modal */}
      {showQRModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scaleIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">QR Code for {selectedItem.item_name}</h2>
            <div className="flex justify-center mb-5 p-5 bg-white rounded-lg border border-gray-200">
              <QRCodeSVG
                ref={qrRef}
                value={getQRCodeData(selectedItem)}
                size={220}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="text-sm text-gray-600 mb-6 text-center px-4">
              Scan this QR code to verify the product authenticity and view order details
            </p>
            <div className="flex space-x-4">
              <button
                onClick={downloadQRCode}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center font-medium shadow-md hover:shadow-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download QR
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scaleIn">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 text-center">Clear All Data?</h2>
            <div className="w-16 h-16 mx-auto mb-5 bg-red-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-6 text-center">
              This will permanently delete all your order data. This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={clearData}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg"
              >
                Yes, Clear Data
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MyOrders;