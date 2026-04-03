import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import TrustDropABI from '../abi/TrustDrop.json';
import TrustScoreABI from '../abi/TrustScore.json';
import TrustDropNFTABI from '../abi/TrustDropNFT.json';
import { getUSDCBalance } from '../utils/contract';

const Web3Context = createContext(null);

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const TRUSTSCORE_ADDRESS = import.meta.env.VITE_TRUSTSCORE_ADDRESS;
const NFT_ADDRESS = import.meta.env.VITE_NFT_ADDRESS;
const CHAIN_ID = import.meta.env.VITE_CHAIN_ID || '80002';
const CHAIN_ID_HEX = '0x' + parseInt(CHAIN_ID).toString(16); // 0x13882
const CHAIN_NAME = import.meta.env.VITE_CHAIN_NAME || 'Polygon Amoy';
const POLYGON_RPC = import.meta.env.VITE_POLYGON_RPC || 'https://rpc-amoy.polygon.technology';
const EXPLORER_URL = import.meta.env.VITE_EXPLORER_ADDRESS_URL || 'https://amoy.polygonscan.com';

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [trustScoreContract, setTrustScoreContract] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [networkName, setNetworkName] = useState('');
  const [balance, setBalance] = useState('0');         // Native MATIC balance
  const [usdcBalance, setUsdcBalance] = useState('0'); // USDC balance (human-readable)
  const [loading, setLoading] = useState(false);
  const [pendingProofCount, setPendingProofCount] = useState(0);

  const initializeContracts = useCallback(async (signerInstance) => {
    let mainContract = null;

    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      mainContract = new ethers.Contract(CONTRACT_ADDRESS, TrustDropABI.abi, signerInstance);
      setContract(mainContract);
    }

    if (TRUSTSCORE_ADDRESS && TRUSTSCORE_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      try {
        const tsContract = new ethers.Contract(TRUSTSCORE_ADDRESS, TrustScoreABI.abi, signerInstance);
        setTrustScoreContract(tsContract);
      } catch (e) {
        console.warn('TrustScore contract init failed:', e);
      }
    }

    if (NFT_ADDRESS && NFT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      try {
        const nft = new ethers.Contract(NFT_ADDRESS, TrustDropNFTABI.abi, signerInstance);
        setNftContract(nft);
      } catch (e) {
        console.warn('NFT contract init failed:', e);
      }
    }

    // Listen for ProofSubmitted events for validator notification badge
    if (mainContract) {
      try {
        const provider = mainContract.runner?.provider;
        if (provider) {
          const currentBlock = await provider.getBlockNumber();
          const fromBlock = Math.max(0, currentBlock - 2000);
          const filter = mainContract.filters.ProofSubmitted?.();
          if (filter) {
            const logs = await mainContract.queryFilter(filter, fromBlock, currentBlock);
            let pending = 0;
            for (const log of logs) {
              try {
                const campaignId = Number(log.args?.campaignId || log.args?.[0]);
                const milestoneIndex = Number(log.args?.milestoneIndex || log.args?.[1]);
                const milestone = await mainContract.getMilestone(campaignId, milestoneIndex);
                if (milestone[2] && !milestone[4] && !milestone[7]) {
                  pending++;
                }
              } catch (e) { /* skip */ }
            }
            setPendingProofCount(pending);
          }
        }

        mainContract.on('ProofSubmitted', () => {
          setPendingProofCount((prev) => prev + 1);
        });
        mainContract.on('MilestoneApproved', () => {
          setPendingProofCount((prev) => Math.max(0, prev - 1));
        });
      } catch (e) {
        console.warn('Event listener setup failed:', e);
      }
    }
  }, []);

  const updateBalance = useCallback(async (providerInstance, signerInstance, address) => {
    try {
      // Native MATIC balance
      const bal = await providerInstance.getBalance(address);
      setBalance(ethers.formatEther(bal));

      // USDC balance
      const usdcBal = await getUSDCBalance(signerInstance, address);
      setUsdcBalance((Number(usdcBal) / 1_000_000).toFixed(2));
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use TrustDrop!');
      return;
    }

    try {
      setLoading(true);

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Switch to Polygon Amoy
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_ID_HEX,
              chainName: CHAIN_NAME,
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: [POLYGON_RPC],
              blockExplorerUrls: [EXPLORER_URL],
            }],
          });
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await browserProvider.getSigner();
      const address = accounts[0];

      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(address);
      setIsConnected(true);
      setNetworkName(CHAIN_NAME);

      await updateBalance(browserProvider, signerInstance, address);
      await initializeContracts(signerInstance);
    } catch (err) {
      console.error('Error connecting wallet:', err);
    } finally {
      setLoading(false);
    }
  }, [initializeContracts, updateBalance]);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAccount(null);
        setIsConnected(false);
        setContract(null);
        setTrustScoreContract(null);
        setNftContract(null);
        setPendingProofCount(0);
        setUsdcBalance('0');
      } else {
        setAccount(accounts[0]);
        if (provider && signer) {
          updateBalance(provider, signer, accounts[0]);
        }
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
      if (accounts.length > 0) {
        connectWallet();
      }
    });

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const value = {
    account,
    provider,
    signer,
    contract,
    trustScoreContract,
    nftContract,
    connectWallet,
    isConnected,
    networkName,
    balance,         // MATIC balance
    usdcBalance,     // USDC balance (human-readable string)
    loading,
    pendingProofCount,
    contractAddress: CONTRACT_ADDRESS,
    trustScoreAddress: TRUSTSCORE_ADDRESS,
    nftAddress: NFT_ADDRESS,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

export default Web3Context;
