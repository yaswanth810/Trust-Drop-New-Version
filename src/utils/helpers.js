/**
 * Shorten an Ethereum/Polygon address
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format USDC value from raw BigInt (6 decimals)
 * 1 USDC = 1_000_000
 */
export function formatUSDC(rawValue) {
  if (!rawValue) return '0.00';
  try {
    const num = Number(rawValue) / 1_000_000;
    return num.toFixed(2);
  } catch {
    return '0.00';
  }
}

/**
 * Format USDC with symbol
 */
export function formatUSDCWithSymbol(rawValue) {
  return `${formatUSDC(rawValue)} USDC`;
}

// Keep legacy name as alias for backward compatibility across components
export const formatEth = formatUSDC;
export const formatEthWithSymbol = formatUSDCWithSymbol;

/**
 * Parse USDC amount string to raw units (6 decimals)
 * "10.5" -> 10500000n
 */
export function parseUSDC(amount) {
  if (!amount || amount === '') return BigInt(0);
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return BigInt(0);
  return BigInt(Math.round(num * 1_000_000));
}

/**
 * Format a Unix timestamp to readable date
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'No deadline';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a Unix timestamp to relative time
 */
export function timeAgo(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(timestamp);
}

/**
 * Calculate percentage from USDC BigInt values
 */
export function calculatePercentage(raised, total) {
  if (!total) return 0;
  try {
    const raisedNum = Number(raised) / 1_000_000;
    const totalNum = Number(total) / 1_000_000;
    if (totalNum === 0) return 0;
    return Math.min(Math.round((raisedNum / totalNum) * 100), 100);
  } catch {
    return 0;
  }
}

/**
 * Get milestone status label and style
 */
export function getMilestoneStatus(milestone) {
  if (milestone.fundsReleased) {
    return { label: 'Funds Released', className: 'badge-released' };
  }
  if (milestone.isApproved) {
    return { label: 'Approved', className: 'badge-approved' };
  }
  if (milestone.isRejected) {
    return { label: 'Rejected', className: 'badge-rejected' };
  }
  if (milestone.ipfsHash && milestone.ipfsHash.length > 0) {
    return { label: 'Proof Submitted', className: 'badge-submitted' };
  }
  return { label: 'Pending', className: 'badge-pending' };
}

/**
 * Get explorer URL for a transaction (Polygonscan)
 */
export function getEtherscanUrl(txHash) {
  const baseUrl = import.meta.env.VITE_EXPLORER_URL || 'https://amoy.polygonscan.com/tx/';
  return `${baseUrl}${txHash}`;
}

/**
 * Get explorer URL for an address (Polygonscan)
 */
export function getEtherscanAddressUrl(address) {
  const baseUrl = import.meta.env.VITE_EXPLORER_ADDRESS_URL || 'https://amoy.polygonscan.com/address/';
  return `${baseUrl}${address}`;
}

/**
 * Validate USDC amount string
 */
export function isValidEthAmount(amount) {
  if (!amount || amount === '') return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

// Alias
export const isValidUSDCAmount = isValidEthAmount;

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ============ INR Conversion ============

const INR_CACHE_KEY = 'trustdrop_usdc_inr_rate';
const INR_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch USDC to INR rate from CoinGecko (cached 5 min)
 */
export async function fetchINRRate() {
  try {
    const cached = localStorage.getItem(INR_CACHE_KEY);
    if (cached) {
      const { rate, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < INR_CACHE_TTL) {
        return rate;
      }
    }

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=inr'
    );
    const data = await res.json();
    const rate = data?.['usd-coin']?.inr || 83.5; // fallback

    localStorage.setItem(INR_CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
    return rate;
  } catch {
    return 83.5; // fallback INR rate
  }
}

/**
 * Format USDC amount with INR equivalent
 * Returns: "10.00 USDC (≈ ₹835)"
 */
export function formatWithINR(usdcRaw, inrRate) {
  const usdc = Number(usdcRaw) / 1_000_000;
  const usdcStr = usdc.toFixed(2);
  if (!inrRate || usdc === 0) return `${usdcStr} USDC`;
  const inr = Math.round(usdc * inrRate);
  return `${usdcStr} USDC (≈ ₹${inr.toLocaleString('en-IN')})`;
}
