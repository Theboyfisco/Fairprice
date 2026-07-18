"use client";

import { useAnchor } from "@/components/providers/WalletProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";
import { useState } from "react";

export function useGoallineProgram() {
  const { program, programId, connection } = useAnchor();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);

  // Derive Mint PDA
  const getMintPda = () => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("usdc-mint")],
      programId
    );
    return pda;
  };

  // Derive User ATA
  const getUserAta = () => {
    if (!publicKey) return null;
    return getAssociatedTokenAddressSync(
      getMintPda(),
      publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
  };

  // Derive Market PDA
  const getMarketPda = (fixtureId: number, marketType: number) => {
    const fixtureIdBn = new anchor.BN(fixtureId);
    const [pda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        fixtureIdBn.toArrayLike(Buffer, "le", 8),
        Buffer.from([marketType]),
      ],
      programId
    );
    return pda;
  };

  // Derive Vault PDA
  const getVaultPda = (marketPda: PublicKey) => {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), marketPda.toBuffer()],
      programId
    );
    return pda;
  };

  // Derive Bet PDA
  const getBetPda = (marketPda: PublicKey) => {
    if (!publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), marketPda.toBuffer(), publicKey.toBuffer()],
      programId
    );
    return pda;
  };

  // 1. Request test USDC from the program faucet
  const requestFaucet = async () => {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const mintPda = getMintPda();
      const userAta = getUserAta()!;

      const mintInfo = await connection.getAccountInfo(mintPda);
      if (!mintInfo) {
        const txInit = await program.methods
          .initializeMint()
          .accounts({
            mint: mintPda,
            authority: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await connection.confirmTransaction(txInit, "confirmed");
      }
      
      const tx = await program.methods
        .requestFaucet()
        .accounts({
          mint: mintPda,
          userTokenAccount: userAta,
          user: publicKey,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      return tx;
    } finally {
      setLoading(false);
    }
  };

  // 2. Create Market
  const createMarket = async (fixtureId: number, marketType: number, closesAtUnix: number) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const marketPda = getMarketPda(fixtureId, marketType);
      const vaultPda = getVaultPda(marketPda);
      const mintPda = getMintPda();

      const mintInfo = await connection.getAccountInfo(mintPda);
      if (!mintInfo) {
        const txInit = await program.methods
          .initializeMint()
          .accounts({
            mint: mintPda,
            authority: publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await connection.confirmTransaction(txInit, "confirmed");
      }

      const tx = await program.methods
        .createMarket(new anchor.BN(fixtureId), marketType, new anchor.BN(closesAtUnix))
        .accounts({
          market: marketPda,
          vault: vaultPda,
          mint: mintPda,
          authority: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      return { tx, marketPda };
    } finally {
      setLoading(false);
    }
  };

  // 3. Place Bet
  const placeBet = async (marketPda: PublicKey, amountUsdc: number, prediction: boolean) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const amountRaw = new anchor.BN(Math.round(amountUsdc * 1_000_000)); // 6 decimals
      const betPda = getBetPda(marketPda)!;
      const mintPda = getMintPda();
      const userAta = getUserAta()!;
      const vaultPda = getVaultPda(marketPda);

      const tx = await program.methods
        .placeBet(amountRaw, prediction)
        .accounts({
          market: marketPda,
          bet: betPda,
          mint: mintPda,
          bettorTokenAccount: userAta,
          vault: vaultPda,
          bettor: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      return tx;
    } finally {
      setLoading(false);
    }
  };

  // 4. Settle Market using cryptographic proof
  const settleMarket = async (marketPda: PublicKey, validationData: any) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      // Find the daily scores roots PDA
      const targetTs = validationData.summary.updateStats.minTimestamp;
      // Convert ms to days
      const epochDay = Math.floor(targetTs / (24 * 60 * 60 * 1000));
      const txlineProgramId = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");

      const [dailyScoresPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("daily_scores_roots"),
          new anchor.BN(epochDay).toArrayLike(Buffer, "le", 2),
        ],
        txlineProgramId
      );

      // Helper to serialize hashes properly
      const toBytes32 = (val: string) => Array.from(Buffer.from(val, "base64"));
      const toProofNodes = (nodes: any[]) => nodes.map(n => ({
        hash: toBytes32(n.hash),
        isRightSibling: n.isRightSibling,
      }));

      // Structure arguments for Rust
      const fixtureSummary = {
        fixtureId: new anchor.BN(validationData.summary.fixtureId),
        updateStats: {
          updateCount: validationData.summary.updateStats.updateCount,
          minTimestamp: new anchor.BN(validationData.summary.updateStats.minTimestamp),
          maxTimestamp: new anchor.BN(validationData.summary.updateStats.maxTimestamp),
        },
        eventsSubTreeRoot: toBytes32(validationData.summary.eventStatsSubTreeRoot),
      };

      const fixtureProof = toProofNodes(validationData.subTreeProof);
      const mainTreeProof = toProofNodes(validationData.mainTreeProof);

      const statA = {
        statToProve: validationData.statToProve,
        eventStatRoot: toBytes32(validationData.eventStatRoot),
        statProof: toProofNodes(validationData.statProof),
      };

      // We implement a single-stat comparison predicate for our market (e.g. total goals > threshold)
      const predicate = {
        threshold: validationData.predicateThreshold || 0,
        comparison: { greaterThan: {} }, // Match Result home goals > 0
      };

      // Call settle_market on our program
      const tx = await program.methods
        .settleMarket(
          new anchor.BN(targetTs),
          fixtureSummary,
          fixtureProof,
          mainTreeProof,
          predicate,
          statA,
          null, // No second stat
          null  // No operator
        )
        .accounts({
          market: marketPda,
          dailyScoresMerkleRoots: dailyScoresPda,
          txlineProgram: txlineProgramId,
          authority: publicKey,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      return tx;
    } finally {
      setLoading(false);
    }
  };

  // 5. Claim Winnings
  const claimWinnings = async (marketPda: PublicKey) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");
    setLoading(true);
    try {
      const betPda = getBetPda(marketPda)!;
      const mintPda = getMintPda();
      const userAta = getUserAta()!;
      const vaultPda = getVaultPda(marketPda);

      const tx = await program.methods
        .claimWinnings()
        .accounts({
          market: marketPda,
          bet: betPda,
          mint: mintPda,
          bettorTokenAccount: userAta,
          vault: vaultPda,
          bettor: publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      await connection.confirmTransaction(tx, "confirmed");
      return tx;
    } finally {
      setLoading(false);
    }
  };

  // 6. Fetch market state from chain
  const fetchMarket = async (marketPda: PublicKey) => {
    if (!program) return null;
    try {
      return await (program.account as any).market.fetch(marketPda);
    } catch {
      return null;
    }
  };

  // 7. Fetch bet state from chain
  const fetchBet = async (marketPda: PublicKey) => {
    if (!program || !publicKey) return null;
    try {
      const betPda = getBetPda(marketPda)!;
      return await (program.account as any).bet.fetch(betPda);
    } catch {
      return null;
    }
  };

  return {
    loading,
    requestFaucet,
    createMarket,
    placeBet,
    settleMarket,
    claimWinnings,
    fetchMarket,
    fetchBet,
    getMarketPda,
    getVaultPda,
    getBetPda,
    getMintPda,
    getUserAta,
  };
}
