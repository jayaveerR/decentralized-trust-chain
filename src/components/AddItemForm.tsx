"use client";
import React, { useState } from "react";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { AptosClient } from "aptos";

const client = new AptosClient("https://fullnode.testnet.aptoslabs.com/v1");
const moduleAddress = "0xc9d300dfef9ec68f48c519ed3d2e95141f180ec8b2eea83d1ccd4dc98c667284";

interface FormData {
  itemType: string;
  itemName: string;
  walletAddress: string;
  soldBy: string;
  orderId: string;
  pickupDate: string;
  pickupTime: string;
}

interface AddItemFormProps {
  onSuccess?: (data: FormData) => void;
  onError?: (error: string) => void;
}

const AddItemForm: React.FC<AddItemFormProps> = ({ onSuccess, onError }) => {
  const [formData, setFormData] = useState<FormData>({
    itemType: "",
    itemName: "",
    walletAddress: "",
    soldBy: "",
    orderId: "",
    pickupDate: "",
    pickupTime: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({
    type: null,
    text: ""
  });

  const { signAndSubmitTransaction, connected } = useWallet();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }

    setLoading(true);
    setMessage({ type: null, text: "" });

    try {
      // Create the transaction with correct argument order
      const transaction: InputTransactionData = {
        data: {
          function: `${moduleAddress}::ItemRegistry::add_item`,
          typeArguments: [],
          functionArguments: [
            formData.itemType,
            formData.itemName,
            formData.walletAddress,
            formData.soldBy,
            formData.orderId,
            formData.pickupDate,
            formData.pickupTime,
          ],
        }
      };

      const response = await signAndSubmitTransaction(transaction);
      await client.waitForTransaction(response.hash);

      setMessage({ 
        type: 'success', 
        text: `Item successfully added to blockchain! Transaction: ${response.hash}` 
      });
      
      // Reset form
      setFormData({
        itemType: "",
        itemName: "",
        walletAddress: "",
        soldBy: "",
        orderId: "",
        pickupDate: "",
        pickupTime: "",
      });

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(formData);
      }

    } catch (error) {
      console.error("Blockchain error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to add item to blockchain";
      setMessage({ type: 'error', text: errorMessage });
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Add Item to Blockchain</h2>
      
      {/* Status Messages */}
      {message.type && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Wallet Connection Status */}
      {!connected && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          Please connect your wallet to add items to the blockchain.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Item Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Type *
          </label>
          <select
            name="itemType"
            value={formData.itemType}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>

        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            name="itemName"
            value={formData.itemName}
            onChange={handleChange}
            placeholder="e.g., Formal Shirt, Blue Jeans"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Wallet Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Address *
          </label>
          <input
            type="text"
            name="walletAddress"
            value={formData.walletAddress}
            onChange={handleChange}
            placeholder="0x..."
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sold By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sold By *
          </label>
          <input
            type="text"
            name="soldBy"
            value={formData.soldBy}
            onChange={handleChange}
            placeholder="Seller name or store"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Order ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Order ID *
          </label>
          <input
            type="text"
            name="orderId"
            value={formData.orderId}
            onChange={handleChange}
            placeholder="Order identification number"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Pickup Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Date *
            </label>
            <input
              type="date"
              name="pickupDate"
              value={formData.pickupDate}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pickup Time *
            </label>
            <input
              type="time"
              name="pickupTime"
              value={formData.pickupTime}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !connected}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
            loading || !connected
              ? 'bg-gray-400 cursor-not-allowed text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Adding to Blockchain...
            </div>
          ) : (
            'Add Item to Blockchain'
          )}
        </button>
      </form>
    </div>
  );
};

export default AddItemForm;
