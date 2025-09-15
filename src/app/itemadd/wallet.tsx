"use client";

export async function connectWallet(): Promise<string | null> {
  if (!window?.aptos?.connect) return null;

  try {
    const response = await window.aptos.connect();
    const address = response.address;
    // store address in localStorage to survive page refresh
    localStorage.setItem("walletAddress", address);
    return address;
  } catch (err) {
    console.error("Wallet connection failed:", err);
    return null;
  }
}

export function disconnectWallet() {
  if (window?.aptos?.disconnect) {
    window.aptos.disconnect();
  }
  localStorage.removeItem("walletAddress");
}

export function getStoredWalletAddress(): string | null {
  return localStorage.getItem("walletAddress");
}
