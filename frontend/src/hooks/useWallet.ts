import { useState, useEffect, useCallback } from 'react';
import { Window as KeplrWindow } from '@keplr-wallet/types';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { coin } from '@cosmjs/stargate';
import { GasPrice } from '@cosmjs/stargate';
import { currentNetwork } from '../config';
import { create } from 'zustand';

declare global {
  interface Window extends KeplrWindow {}
}

interface WalletState {
  address: string | null;
  client: SigningCosmWasmClient | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  client: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {
    set({ isConnecting: true });
    try {
      if (!window.keplr) {
        alert('Please install Keplr extension');
        throw new Error('Keplr extension not found');
      }
      
      // Suggest chain to Keplr
      await window.keplr.experimentalSuggestChain(currentNetwork.chainConfig);
      
      // Enable the chain
      await window.keplr.enable(currentNetwork.chainConfig.chainId);
      
      // Get the signer
      const offlineSigner = window.keplr.getOfflineSigner(currentNetwork.chainConfig.chainId);
      
      // Get user address
      const accounts = await offlineSigner.getAccounts();
      const address = accounts[0].address;
      
      // Create signing client
      const client = await SigningCosmWasmClient.connectWithSigner(
        currentNetwork.chainConfig.rpc,
        offlineSigner,
        { 
          gasPrice: GasPrice.fromString(currentNetwork.gasPrice) 
        }
      );
      
      set({ 
        address, 
        client, 
        isConnected: true,
        isConnecting: false
      });
    } catch (error) {
      console.error('Connection error:', error);
      set({ isConnecting: false });
    }
  },
  disconnect: () => {
    set({ 
      address: null, 
      client: null,
      isConnected: false 
    });
  },
}));

export const useWallet = () => {
  const { 
    address,
    client,
    isConnected,
    isConnecting,
    connect,
    disconnect
  } = useWalletStore();

  // Automatically try to reconnect if window.keplr exists
  useEffect(() => {
    if (window.keplr && !isConnected && !isConnecting) {
      connect();
    }
  }, [isConnected, isConnecting, connect]);

  // Contract interaction helpers
  const executeContract = useCallback(async (
    msg: any,
    funds: { amount: string; denom: string }[] = []
  ) => {
    if (!client || !address) throw new Error('Wallet not connected');
    
    return await client.execute(
      address,
      currentNetwork.contractAddress,
      msg,
      'auto',
      undefined,
      funds.map(f => coin(f.amount, f.denom))
    );
  }, [client, address]);

  const queryContract = useCallback(async (msg: any) => {
    if (!client) throw new Error('Wallet not connected');
    
    return await client.queryContractSmart(
      currentNetwork.contractAddress,
      msg
    );
  }, [client]);

  return {
    address,
    client,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    executeContract,
    queryContract
  };
};