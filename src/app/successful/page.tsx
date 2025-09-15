"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";

// Types for Petra Wallet
interface AptosWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
}

// Order interface
interface Order {
  itemType: string;
  itemName: string;
  walletAddress: string;
  soldBy: string;
  orderId: string;
  pickupDate: string;
  pickupTime: string;
}

const Successful: React.FC = () => {
  const router = useRouter();
  const qrRef = useRef<SVGSVGElement>(null);
  const [formData, setFormData] = useState<Order>({
    itemType: "",
    itemName: "",
    walletAddress: "",
    soldBy: "",
    orderId: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");

  // Fetch stored order & check wallet
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("itemData") || "{}");
    if (data) setFormData(data);
    saveOrderToLocalStorage(data);
    checkWalletConnection();
  }, []);

  // Save to localStorage preventing duplicate orderId
  const saveOrderToLocalStorage = (data: any) => {
    if (!data?.orderId) return;
    const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    const isDuplicate = existingOrders.some(
      (order: any) => order.orderId === data.orderId
    );
    if (!isDuplicate) {
      localStorage.setItem(
        "orders",
        JSON.stringify([...existingOrders, data])
      );
    }
  };

  const checkWalletConnection = async () => {
    if (window.aptos) {
      try {
        const connected = await window.aptos.isConnected();
        if (connected) {
          const account = await window.aptos.account();
          setIsConnected(true);
          setWalletAddress(account.address);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.aptos) return alert("Petra wallet not found!");
    try {
      const resp = await window.aptos.connect();
      setIsConnected(true);
      setWalletAddress(resp.address);
      const updatedData = { ...formData, walletAddress: resp.address };
      setFormData(updatedData);
      localStorage.setItem("itemData", JSON.stringify(updatedData));
    } catch (err: any) {
      console.error(err);
      alert("Wallet connection failed: " + (err.message || "Unknown"));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = pngUrl;
      link.download = `trustchain-${formData.orderId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

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
    <div className="w-full min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8 md:p-12 space-y-8"
      >
        {/* Success Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-green-500"
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Successfully Added!
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Your item has been securely registered on the Trust-Chain
          </p>
        </motion.div>

        {/* Wallet Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0"
        >
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-700">Wallet:</span>
            <span className="font-semibold text-blue-700">
              {isConnected
                ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(
                    walletAddress.length - 4
                  )}`
                : "Not Connected"}
            </span>
          </div>
          {!isConnected && (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </motion.div>

        {/* Item Details + QR */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Item Details */}
          <div className="bg-gray-50 p-6 rounded-2xl shadow-inner space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Item Details</h2>
            {[
              { label: "Item Type", value: formData.itemType },
              { label: "Item Name", value: formData.itemName },
              { label: "Order ID", value: formData.orderId },
              { label: "Sold By", value: formData.soldBy },
              { label: "Pickup Date", value: formData.pickupDate },
              { label: "Pickup Time", value: formData.pickupTime },
              { label: "Wallet", value: formData.walletAddress },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between text-gray-700 text-sm md:text-base">
                <span className="font-medium">{item.label}:</span>
                <span className="font-semibold">
                  {item.value
                    ? item.label === "Wallet"
                      ? `${item.value.substring(0, 6)}...${item.value.substring(
                          item.value.length - 4
                        )}`
                      : item.value
                    : "N/A"}
                </span>
              </div>
            ))}
            {formData.walletAddress && (
              <button
                onClick={() => copyToClipboard(formData.walletAddress)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Copy Wallet Address
              </button>
            )}
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl shadow-lg">
            <QRCodeSVG
              ref={qrRef}
              value={qrCodeData}
              size={200}
              level="H"
              includeMargin
            />
            <p className="mt-2 text-gray-500 text-sm">Scan to verify authenticity</p>
            <button
              onClick={downloadQRCode}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download QR Code
            </button>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col md:flex-row justify-center md:justify-end gap-4"
        >
          <button
            onClick={() => router.push("/myorders")}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            View My Orders
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </motion.div>

      {/* Copied Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg"
          >
            Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Successful;
