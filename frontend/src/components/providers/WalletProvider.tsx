"use client";

import React, { createContext, useContext, useMemo, type FC } from "react";
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useAnchorWallet,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as SolanaWalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { GOALLINE_IDL } from "@/lib/goalline-idl";

// Cast to any to satisfy React 18 JSX element type constraints
const ConnectionProvider = SolanaConnectionProvider as unknown as FC<{ endpoint: string; children: React.ReactNode }>;
const WalletProvider = SolanaWalletProvider as unknown as FC<{ wallets: any[]; autoConnect?: boolean; children: React.ReactNode }>;
const WalletModalProvider = SolanaWalletModalProvider as unknown as FC<{ children: React.ReactNode }>;

// Import styles
import "@solana/wallet-adapter-react-ui/styles.css";

// Define Anchor Context type
interface AnchorContextType {
  connection: Connection;
  program: Program | null;
  programId: PublicKey;
}

const AnchorContext = createContext<AnchorContextType | null>(null);

export function useAnchor() {
  const context = useContext(AnchorContext);
  if (!context) {
    throw new Error("useAnchor must be used within an AnchorContextProvider");
  }
  return context;
}

function AnchorContextProvider({ children }: { children: React.ReactNode }) {
  const wallet = useAnchorWallet();
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
  const programIdString = process.env.NEXT_PUBLIC_PROGRAM_ID || "GL1neprog1111111111111111111111111111111111";

  const connection = useMemo(() => new Connection(endpoint, "confirmed"), [endpoint]);
  const programId = useMemo(() => new PublicKey(programIdString), [programIdString]);

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    // Set program address dynamically
    const idlCopy = { ...GOALLINE_IDL, address: programIdString };
    return new Program(idlCopy as any, provider);
  }, [connection, wallet, programIdString]);

  return (
    <AnchorContext.Provider value={{ connection, program, programId }}>
      {children}
    </AnchorContext.Provider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AnchorContextProvider>{children}</AnchorContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
