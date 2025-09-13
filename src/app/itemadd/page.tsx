"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AptosClient } from "aptos";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");
const moduleAddress = "0xc9d300dfef9ec68f48c519ed3d2e95141f180ec8b2eea83d1ccd4dc98c667284";

const ItemAdd = () => {
  const [formData, setFormData] = useState({
    itemType: "",
    itemName: "",
    walletAddress: "",
    soldBy: "",
    orderId: "",
    pickupDate: "",
    pickupTime: "",
  });
  const [qrCodeVisible, setQrCodeVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [blockchainLoading, setBlockchainLoading] = useState(false);
  const { signAndSubmitTransaction, account, connect } = useWallet();
  const router = useRouter();

  // Auto-populate wallet address when account is available
  useEffect(() => {
    if (account?.address) {
      setFormData(prev => ({ ...prev, walletAddress: account.address.toString() }));
    }
  }, [account?.address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if wallet is connected
    if (!account?.address) {
      alert("Please connect your wallet first");
      return;
    }
    
    setSubmitting(true);
    
    // Simulate processing time
    setTimeout(() => {
      setQrCodeVisible(true);
      setSubmitting(false);
    }, 800);
  };

  const handleAddToBlockchain = async () => {
    if (!account?.address) {
      alert("Please connect your wallet first");
      return;
    }
    
    setBlockchainLoading(true);
    try {
      const addTransaction: InputTransactionData = {
        data: {
          function: `${moduleAddress}::ItemRegistry::add_item`,
          typeArguments: [],
          functionArguments: [
            formData.itemType,
            formData.itemName,
            formData.orderId,
            formData.pickupDate,
            formData.pickupTime,
            formData.walletAddress,
            formData.soldBy,
          ],
        },
      };
  
      const addResponse = await signAndSubmitTransaction(addTransaction);
      await client.waitForTransaction(addResponse.hash);
  
      localStorage.setItem("itemData", JSON.stringify(formData));
      alert("✅ Item successfully added to blockchain!");
      router.push("/successful");
    } catch (error) {
      console.error("Blockchain error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add item to blockchain";
      alert(`❌ Error: ${errorMessage}`);
      router.push("/error");
    } finally {
      setBlockchainLoading(false);
    }
  };

  const maskWalletAddress = (address: string | null | undefined) => {
    if (!address) return "";
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Function to download QR code as PNG
  const downloadQRCode = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `qrcode-${formData.orderId || 'item'}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold">BlockVerify</span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {["Home", "Admin", "MyOrders", "Learn"].map((item) => (
              <button
                key={item}
                className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item}
              </button>
            ))}
          </nav>
          
          <div className="flex items-center space-x-4">
            
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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold mb-2">Add Item to Trust-Chain</h1>
          <p className="text-gray-600">Register your product on the blockchain for authenticity tracking</p>
        </motion.div>

        {!account?.address && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center"
          >
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Wallet Not Connected</h3>
            <p className="text-yellow-700 mb-4">Please connect your wallet to add items to the blockchain</p>
            <WalletSelector />
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700">Item Type *</label>
                <select
                  name="itemType"
                  value={formData.itemType}
                  onChange={handleChange}
                  required
                  disabled={!account?.address}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <option value="">Select item type</option>
                  <option value="shirt">Shirt</option>
                  <option value="pant">Pant</option>
                  <option value="t-shirt">T-Shirt</option>
                  <option value="accessories">Accessories</option>
                  <option value="shorts">Shorts</option>
                  <option value="shoes">Shoes</option>
                  <option value="slippers">Slippers</option>
                </select>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700">Item Name *</label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="Formal Shirt, Jeans, etc."
                  required
                  disabled={!account?.address}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700">Wallet Address *</label>
                <div className="relative">
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    placeholder="0x..."
                    required
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!account?.address && (
                    <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-lg">
                      <span className="text-sm text-gray-500">Connect wallet to auto-fill</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700">Sold By *</label>
                <input
                  type="text"
                  name="soldBy"
                  value={formData.soldBy}
                  onChange={handleChange}
                  placeholder="Seller name"
                  required
                  disabled={!account?.address}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <label className="block text-sm font-medium mb-2 text-gray-700">Order ID *</label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleChange}
                  placeholder="Order identification number"
                  required
                  disabled={!account?.address}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <label className="block text-sm font-medium mb-2 text-gray-700">Pickup Date *</label>
                  <input
                    type="date"
                    name="pickupDate"
                    value={formData.pickupDate}
                    onChange={handleChange}
                    required
                    disabled={!account?.address}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <label className="block text-sm font-medium mb-2 text-gray-700">Pickup Time *</label>
                  <input
                    type="time"
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleChange}
                    required
                    disabled={!account?.address}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                </motion.div>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-center mt-10"
          >
            <button
              type="submit"
              disabled={submitting || !account?.address}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-300 disabled:opacity-70 flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Generate QR Code"
              )}
            </button>
          </motion.div>
        </form>

        <AnimatePresence>
          {qrCodeVisible && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Item QR Code</h2>
              
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex justify-center">
                  <div className="border-4 border-blue-100 rounded-lg p-4 flex items-center justify-center">
                    <QRCodeSVG
                      value={JSON.stringify(formData)}
                      size={200}
                      level="H"
                      includeMargin
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-4">Item Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Item Type</p>
                      <p className="font-medium capitalize">{formData.itemType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{formData.itemName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-medium">{formData.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Sold By</p>
                      <p className="font-medium">{formData.soldBy}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pickup</p>
                      <p className="font-medium">{formData.pickupDate} at {formData.pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Wallet Address</p>
                      <p className="font-medium text-xs">{maskWalletAddress(formData.walletAddress)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadQRCode}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium"
                    >
                      Download QR Code
                    </motion.button>
                    <motion.button
                      onClick={handleAddToBlockchain}
                      disabled={blockchainLoading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-orange-500 text-white rounded-lg font-medium disabled:bg-gray-400 flex items-center"
                    >
                      {blockchainLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding to Blockchain...
                        </>
                      ) : (
                        "Add to Blockchain"
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ItemAdd;