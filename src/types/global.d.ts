interface AptosWallet {
  connect: () => Promise<{ address: string }>;
  disconnect: () => Promise<void>;
  isConnected: () => Promise<boolean>;
  account: () => Promise<{ address: string }>;
  onAccountChange?: (listener: (newAddress: { address: string }) => void) => void;
  onNetworkChange?: (listener: (newNetwork: any) => void) => void;
}

declare global {
  interface Window {
    aptos?: AptosWallet;
  }
}

// To make this file a module
export {};
