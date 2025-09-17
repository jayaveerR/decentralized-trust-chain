"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AptosClient } from "aptos";   // ✅ import AptosClient

// Your deployed contract address & module name
const NODE_URL = "https://fullnode.devnet.aptoslabs.com";
const client = new AptosClient(NODE_URL);
const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_ADDRESS_HERE";
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

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      fetchMyOrders();
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
    try {
      const response: any = await client.view({
        function: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_items`,
        type_arguments: [],
        arguments: [walletAddress],
      });

      // View response is usually a nested array — parse to Item[]
      const parsed: Item[] = response[0].map((item: any) => ({
        item_type: item.item_type,
        item_name: item.item_name,
        order_id: item.order_id,
        pickup_date: item.pickup_date,
        pickup_time: item.pickup_time,
        wallet_address: item.wallet_address,
        sold_by: item.sold_by,
        transaction_hash: item.transaction_hash,
      }));

      setItems(parsed);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 py-4 px-6 sticky top-0 z-10">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold">BlockVerify</span>
          </div>

          <nav className="hidden md:flex space-x-6">
            {["Home", "Products", "My Orders", "Verify", "Settings"].map(
              (item) => (
                <button
                  key={item}
                  className={`font-medium ${
                    item === "My Orders"
                      ? "text-orange-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => {
                    if (item === "Home") router.push("/");
                    else if (item === "Verify") router.push("/verify");
                    else if (item === "Products") router.push("/products");
                    else if (item === "Settings") router.push("/settings");
                    else if (item === "My Orders") router.push("/my-orders");
                  }}
                >
                  {item}
                </button>
              )
            )}
          </nav>

          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="flex items-center space-x-2 bg-gray-100 rounded-full pl-4 pr-2 py-1">
                <span className="text-sm font-medium">
                  {shortenAddress(walletAddress)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
                  title="Disconnect Wallet"
                  disabled={loading}
                >
                  X
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Orders List */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold mb-6">My Orders</h2>

        {items.length === 0 ? (
          <p className="text-gray-600">No orders found.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((item, index) => (
              <div
                key={index}
                className="border rounded-xl p-4 shadow-sm bg-gray-50"
              >
                <h3 className="font-bold text-lg">{item.item_name}</h3>
                <p className="text-sm text-gray-700">{item.item_type}</p>
                <p className="text-sm">Order ID: {item.order_id}</p>
                <p className="text-sm">Pickup: {item.pickup_date} @ {item.pickup_time}</p>
                <p className="text-sm">Sold By: {item.sold_by}</p>
                <p className="text-sm break-all">Txn Hash: {item.transaction_hash}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrders;
