import { AptosClient } from "aptos";


const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
export const client = new AptosClient(NODE_URL);

// Connect Petra Wallet
export const connectPetraWallet = async (): Promise<string> => {
  const wallet = (window as any).aptos;
  if (!wallet) throw new Error("Petra Wallet not installed");
  await wallet.connect();
  const account = await wallet.account();
  return account.address;
};

// Send Payment
export const sendPayment = async (toAddress: string, amount: number) => {
  const wallet = (window as any).aptos;
  if (!wallet) throw new Error("Wallet not connected");

  // Convert INR → Octas (Assume 1 INR = 1 Octa for simplicity)
  const octas = BigInt(amount);

  const payload = {
    type: "entry_function_payload",
    function: "0x1::coin::transfer", // Standard coin transfer
    type_arguments: ["0x1::aptos_coin::AptosCoin"],
    arguments: [toAddress, octas.toString()],
  };

  try {
    const txnHash = await wallet.signAndSubmitTransaction(payload);
    await client.waitForTransaction(txnHash.hash);
    return txnHash.hash;
  } catch (err) {
    console.error(err);
    throw new Error("Payment Failed");
  }
};

// Mint NFT ticket
export const mintTicketNFT = async (_userAddress: string, movieId: number, seatIds: string[]) => {
  const wallet = (window as any).aptos;
  if (!wallet) throw new Error("Wallet not connected");

  const payload = {
    type: "entry_function_payload",
    function: "0x6976ec3aa37858aad990b899d5c17ad827b66cab91ccdb7256c12083313deb40::mougli_tickets::mint_ticket",
    type_arguments: [],
    arguments: ["0x7b2e3a37101c53ae6f73926e7f45b43e5070e9f81cf17ea8214c239a3a34b857", 1, seatIds],
  };

  try {
    const txnHash = await wallet.signAndSubmitTransaction(payload);
    await client.waitForTransaction(txnHash.hash);
    return txnHash.hash;
  } catch (err) {
    console.error(err);
    throw new Error("Ticket minting failed");
  }
};
