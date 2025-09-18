"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AptosClient } from "aptos";
import { QRCodeSVG } from "qrcode.react";

// Your deployed contract address & module name
const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const client = new AptosClient(NODE_URL);
const MODULE_ADDRESS = "0x1d2059e79204cd083acde00913ab3bc0849cd987b01f2b2f337b6143527525d8";
const MODULE_NAME = "ItemRegistry";

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

interface Item {
  item_type: string;
  item_name: string;
  order_id: string;
  pickup_date: string;
  pickup_time: string;
  wallet_address: string;
  sold_by: string;
  transaction_hash: string;
}

const MyOrders = () => {
  const router = useRouter();
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [fetching, setFetching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchMyOrders();
    } else {
      setItems([]);
    }
  }, [walletAddress]);

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.aptos) {
      try {
        const connected = await window.aptos.isConnected();
        if (connected) {
          const account = await window.aptos.account();
          setWalletAddress(account.address);
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.aptos) {
      try {
        setLoading(true);
        const { address } = await window.aptos.connect();
        setWalletAddress(address);
        setIsConnected(true);

        window.aptos.onAccountChange((newAddress) => {
          setWalletAddress(newAddress.address);
        });

        window.aptos.onNetworkChange((newNetwork) => {
          console.log("Network changed:", newNetwork);
        });
      } catch (err) {
        console.error("Wallet connection failed:", err);
        alert("Failed to connect wallet. Please approve in Petra Wallet.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Petra wallet not found. Please install it first.");
      window.open("https://petra.app/", "_blank");
    }
  };

  const disconnectWallet = async () => {
    if (typeof window !== "undefined" && window.aptos) {
      try {
        await window.aptos.disconnect();
        setWalletAddress("");
        setIsConnected(false);
        setItems([]);
      } catch (err) {
        console.error("Wallet disconnection failed:", err);
      }
    }
  };

  const fetchMyOrders = async () => {
    if (!walletAddress) return;

    setFetching(true);
    try {
      // Try to fetch from blockchain first
      try {
        const response: any = await client.view({
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_items`,
          type_arguments: [],
          arguments: [walletAddress],
        });

        if (response && response[0] && Array.isArray(response[0])) {
          const parsed: Item[] = response[0].map((item: any) => ({
            item_type: item.item_type || "",
            item_name: item.item_name || "",
            order_id: item.order_id || "",
            pickup_date: item.pickup_date || "",
            pickup_time: item.pickup_time || "",
            wallet_address: item.wallet_address || "",
            sold_by: item.sold_by || "",
            transaction_hash: item.transaction_hash || "",
          }));

          const filteredItems = parsed.filter(
            (item) => item.wallet_address.toLowerCase() === walletAddress.toLowerCase(),
          );

          setItems(filteredItems);
          return;
        }
      } catch (blockchainError) {
        console.log("Could not fetch from blockchain, trying localStorage:", blockchainError);
      }

      // Fallback to localStorage if blockchain fetch fails
      const localOrders = JSON.parse(localStorage.getItem("myOrders") || "[]");

      const filteredLocalOrders = localOrders.filter(
        (order: any) => order.walletAddress && order.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
      );

      const formattedOrders: Item[] = filteredLocalOrders.map((order: any) => ({
        item_type: order.itemType || "",
        item_name: order.itemName || "",
        order_id: order.orderId || "",
        pickup_date: order.pickupDate || "",
        pickup_time: order.pickupTime || "",
        wallet_address: order.walletAddress || "",
        sold_by: order.soldBy || "",
        transaction_hash: order.transactionHash || "",
      }));

      setItems(formattedOrders);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setItems([]);
    } finally {
      setFetching(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current || !selectedItem) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.drawImage(img, 0, 0);

        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `BlockVerify-QR-${selectedItem.order_id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const viewQRCode = (item: Item) => {
    setSelectedItem(item);
    setShowQRModal(true);
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const shortenHash = (hash: string) => {
    if (!hash) return "";
    if (hash.length <= 12) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-4)}`;
  };

  const viewOnExplorer = (hash: string) => {
    window.open(`https://explorer.aptoslabs.com/txn/${hash}?network=testnet`, "_blank");
  };

  const generateQRCodeData = (item: Item) => {
    return JSON.stringify({
      type: "Trust-Chain Item",
      item: item.item_name,
      itemType: item.item_type,
      orderId: item.order_id,
      soldBy: item.sold_by,
      pickupDate: item.pickup_date,
      pickupTime: item.pickup_time,
      wallet: item.wallet_address,
    transaction_hash: item.transaction_hash,
    
    });
  };

  // ✅ Clear Data function (permanent clear)
  const clearData = () => {
    localStorage.removeItem("myOrders"); // clear from localStorage
    setItems([]); // clear UI
    alert("All stored orders have been permanently cleared.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              BlockVerify
            </span>
          </div>

          <nav className="hidden md:flex space-x-6">
            {["Home", "Admin", "MyOrders", "Verify", "Learn"].map((item) => (
              <button
                key={item}
                className={`font-medium transition-all duration-200 ${
                  item === "MyOrders" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => {
                  if (item === "Home") router.push("/");
                  else if (item === "Admin") router.push("/admin");
                  else if (item === "MyOrders") router.push("/myorders");
                  else if (item === "Verify") router.push("/verify");
                  else if (item === "Learn") window.open("https://learn.blockverify.com", "_blank");
                }}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full pl-4 pr-2 py-1 shadow-inner">
                <span className="text-sm font-medium">{shortenAddress(walletAddress)}</span>
                <button
                  onClick={disconnectWallet}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors duration-200"
                  title="Disconnect Wallet"
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </>
                ) : (
                  "Connect Wallet"
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Orders List */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            My Orders
          </h2>
          <div className="clear-data">
            <button onClick={clearData} className="text-sm text-gray-600 hover:text-black border border-gray-300 hover:border-black px-3 py-1 rounded-lg transition-all duration-200 hover:bg-red-600  hover:text-white">
              Clear Data
            </button>
          </div>

          <button
            onClick={fetchMyOrders}
            disabled={fetching || !isConnected}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {fetching ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Refresh Orders <br />
              </>
            )}
          </button>
        </div>

        {!isConnected ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6 max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Connect Your Wallet</h3>
            <p className="mt-2 text-gray-600 mb-4">Connect your wallet to view your orders</p>
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Connect Wallet
            </button>
          </div>
        ) : fetching ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6 max-w-md mx-auto">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600 mt-4">Loading your orders...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm p-6 max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Orders Found</h3>
            <p className="mt-2 text-gray-600 mb-4">No orders found for your wallet address.</p>
            <p className="text-gray-500 text-sm">
              Make sure you're connected with the same wallet you used to create orders.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-1 gap-6">
            {items.map((item, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-lg transition-all duration-300 shadow-md animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6 text-blue-600"
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
                      <div>
                        <h3 className="font-bold text-xl capitalize text-gray-900">{item.item_name}</h3>
                        <p className="text-sm text-gray-500 capitalize">{item.item_type}</p>
                      </div>
                    </div>
                  </div>
                  <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-medium px-3 py-1.5 rounded-full">
                    Order #{item.order_id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Left side details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sold By</p>
                      <p className="font-medium text-gray-900">{item.sold_by}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Pickup Date & Time
                      </p>
                      <p className="font-medium text-gray-900">
                        {item.pickup_date} at {item.pickup_time}
                      </p>
                    </div>
                  </div>

                  {/* Right side details */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Wallet Address
                      </p>
                      <p className="font-medium text-sm text-gray-900 font-mono">
                        {shortenAddress(item.wallet_address)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Transaction Hash
                      </p>
                      <div className="flex items-center">
                        <p className="font-medium text-sm text-gray-900 font-mono mr-2">
                          {shortenHash(item.transaction_hash)}
                        </p>
                        {item.transaction_hash && item.transaction_hash !== "pending" && (
                          <button
                            onClick={() => viewOnExplorer(item.transaction_hash)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                            title="View on Explorer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-6">
                  {item.transaction_hash && item.transaction_hash !== "pending" && (
                    <button
                      onClick={() => viewQRCode(item)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z"
                          clipRule="evenodd"
                        />
                        <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM16 17a1 1 0 100-2h-3a1 1 0 100 2h3z" />
                      </svg>
                      View QR Code
                    </button>
                  )}

                  {item.transaction_hash && item.transaction_hash !== "pending" && (
                    <a
                      href={`https://explorer.aptoslabs.com/txn/${item.transaction_hash}?network=testnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View on Explorer
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* QR Code Modal */}
      {showQRModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">QR Code for Order #{selectedItem.order_id}</h3>
              <button onClick={() => setShowQRModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div ref={qrRef} className="p-4 bg-white rounded-lg border border-gray-200 mb-4">
                <QRCodeSVG value={generateQRCodeData(selectedItem)} size={256} level="H" includeMargin={true} />
              </div>

              <p className="text-sm text-gray-600 mb-4 text-center">
                This QR code contains all the details of your order. It can be scanned to verify the authenticity of
                your purchase.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={downloadQRCode}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Download QR Code
                </button>

                <button
                  onClick={() => setShowQRModal(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default MyOrders;
