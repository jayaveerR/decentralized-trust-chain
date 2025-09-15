"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

// Define the Order type for localStorage
interface Order {
  orderId: string; // User-entered
  itemName: string;
  itemType: string;
  walletAddress: string;
  soldBy: string;
  pickupDate: string;
  pickupTime: string;
}

// The existing Item interface from the component
interface Item {
  item_type: string;
  item_name: string;
  order_id: string; // User-entered
  pickup_date: string;
  pickup_time: string;
  wallet_address: string;
  sold_by: string;
}

// Types for Petra Wallet
interface AptosWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
  onAccountChange: (listener: (newAddress: { address: string }) => void) => void;
  onNetworkChange: (listener: (newNetwork: any) => void) => void;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
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
  const qrRef = useRef(null);

  useEffect(() => {
    checkConnection();
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
          // Fetch items using the connected wallet address
          fetchItems(account.address);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  // Function to fetch items from localStorage
  const fetchItems = (address: string) => {
    if (!address) return;
    
    setLoadingItems(true);
    setErrorMessage('');
    
    try {
      const storedOrders = localStorage.getItem('orders');
      if (storedOrders) {
        let allOrders: Order[] = [];
        try {
            const parsedOrders = JSON.parse(storedOrders);
            if (Array.isArray(parsedOrders)) {
                allOrders = parsedOrders;
            } else {
                console.warn("'orders' in localStorage is not an array, showing no orders.");
            }
        } catch (e) {
            console.error("Failed to parse 'orders' from localStorage, showing no orders.", e);
            setItems([]);
            setLoadingItems(false);
            return;
        }
        
        const userOrders = allOrders.filter(order => order.walletAddress === address);

        const formattedItems: Item[] = userOrders.map(order => ({
          item_type: order.itemType,
          item_name: order.itemName,
          order_id: order.orderId, // User-entered
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
      setErrorMessage('Failed to fetch items. Please try again.');
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
      // Fetch items using the connected wallet address
      fetchItems(response.address);

      window.aptos.onAccountChange((newAddress) => {
        setWalletAddress(newAddress.address);
        // Fetch items for the new wallet address
        fetchItems(newAddress.address);
      });

      window.aptos.onNetworkChange((newNetwork) => {
        console.log('Network changed:', newNetwork);
        // Refetch items when network changes
        if (isConnected && walletAddress) {
          fetchItems(walletAddress);
        }
      });
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

  // Function to clear all data from localStorage
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all saved orders? This action cannot be undone.')) {
      localStorage.removeItem('orders');
      setItems([]); // Clear items from the state to update the UI
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
      const svgElement = qrRef.current as unknown as SVGSVGElement;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const img = new Image();
      img.onload = function() {
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
      const svgElement = qrRef.current as unknown as SVGSVGElement;
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
      orderId: item.order_id, // User-entered
      soldBy: item.sold_by,
      pickupDate: item.pickup_date,
      pickupTime: item.pickup_time,
      wallet: item.wallet_address,
      verification: `https://trustchain.verify/item/${item.order_id}`
    });
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold">BlockVerify</span>
          </div>

          <nav className="hidden md:flex space-x-6">
            {["Home", "Products", "My Orders", "Verify", "Settings"].map((item) => (
              <button
                key={item}
                className={`font-medium ${item === "My Orders" ? "text-orange-600" : "text-gray-600 hover:text-gray-900"}`}
                onClick={() => {
                  if (item === "Home") router.push("/");
                  else if (item === "Verify") router.push("/verify");
                  else if (item === "Products") router.push("/products");
                  else if (item === "Settings") router.push("/settings");
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center">
            {isConnected ? (
              <div className="flex items-center">
                <span className="mr-4 text-sm bg-orange-50 text-orange-700 py-1 px-3 rounded-full">
                  {shortenAddress(walletAddress)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-10">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">My Orders</h1>
                <p className="text-gray-600">
                    {isConnected 
                    ? `Items associated with your wallet: ${shortenAddress(walletAddress)}` 
                    : "Connect your wallet to view your orders"}
                </p>
            </div>
            {/* Added Clear Data button */}
            {isConnected && (
                <button
                    onClick={handleClearData}
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap"
                >
                    Clear Data
                </button>
            )}
        </div>

        {!isConnected ? (
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your Petra wallet to view items associated with your wallet address.
            </p>

            {connectionStatus === 'error' && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}

            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-300 disabled:bg-orange-400"
            >
              {isLoading ? "Connecting..." : "Connect Petra Wallet"}
            </button>
          </div>
        ) : (
          <>
            {connectionStatus === 'success' && items.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-center">
                ✅ Wallet connected successfully. Showing items for: {shortenAddress(walletAddress)}
              </div>
            )}
            
            {loadingItems ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
                <p>Loading your orders from local storage...</p>
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
                <h2 className="text-2xl font-bold mb-4">Error Loading Orders</h2>
                <p className="text-gray-600 mb-6">{errorMessage}</p>
                <button
                  onClick={() => fetchItems(walletAddress)}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
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
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">No Orders Found</h2>
                <p className="text-gray-600">No orders found for this wallet.</p>
              </div>
            ) : (
              <div className="py-8">
                <h2 className="text-2xl font-bold mb-6">Your Orders ({items.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="bg-white-500 text-black p-4 border-b border-gray-200">
                        <h3 className="text-xl font-bold truncate">{item.item_name}</h3>
                        <p className="text-black-100 text-sm capitalize">{item.item_type}</p>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Order ID</p>
                            <p className="font-medium truncate">{item.order_id}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Pickup Date</p>
                              <p className="font-medium">{item.pickup_date}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pickup Time</p>
                              <p className="font-medium">{item.pickup_time}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Sold By</p>
                            <p className="font-medium truncate">{item.sold_by}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Wallet Address</p>
                            <p className="font-medium text-sm truncate">{item.wallet_address}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => showQRCode(item)}
                          className="w-full mt-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">QR Code for {selectedItem.item_name}</h2>
            <div className="flex justify-center mb-4">
              <QRCodeSVG
                ref={qrRef}
                value={getQRCodeData(selectedItem)} 
                size={200}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Scan this QR code to verify the product authenticity
            </p>
            <div className="flex space-x-3">
              <button
                onClick={downloadQRCode}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Download QR
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrders;