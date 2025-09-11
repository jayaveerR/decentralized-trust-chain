"use client";
import React from "react";
import AddItemForm from "../../components/AddItemForm";
import { useRouter } from "next/navigation";

const ExamplePage = () => {
  const router = useRouter();

  const handleSuccess = (data: any) => {
    console.log("Item added successfully:", data);
    // Store data for success page
    localStorage.setItem('itemData', JSON.stringify(data));
    router.push("/successful");
  };

  const handleError = (error: string) => {
    console.error("Error adding item:", error);
    router.push("/error");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Add Item to Blockchain
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Use this form to add items to your Aptos Move contract. Make sure your wallet is connected before submitting.
          </p>
        </div>
        
        <AddItemForm 
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default ExamplePage;
