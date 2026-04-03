import { ethers } from 'ethers';

const ORACLE_ADDRESS = import.meta.env.VITE_ORACLE_ADDRESS;

// Minimal ABI for MarketRateOracle
const ORACLE_ABI = [
  'function checkPrice(string memory category, uint256 totalClaimed, uint256 quantity) external view returns (uint8)',
  'function getRate(string memory category) external view returns (uint256 minRate, uint256 maxRate, bool exists)',
];

const ITEM_CATEGORIES = [
  { value: 'Food kit', label: 'Food / Ration Kit' },
  { value: 'Medicine kit', label: 'Medical / Medicine Kit' },
  { value: 'Notebook set', label: 'Education / Notebook Set' },
  { value: 'Transport km', label: 'Transport (per km)' },
  { value: 'Water can', label: 'Water / Sanitation' },
  { value: 'Infrastructure', label: 'Infrastructure / Construction' },
  { value: 'Other', label: 'Other' },
];

const PRICE_CHECK_LABELS = {
  0: { label: 'NORMAL', color: 'green', icon: '✓', message: 'Price within market range' },
  1: { label: 'WARNING', color: 'yellow', icon: '⚠', message: 'Price 15% above typical market rate. Add justification below.' },
  2: { label: 'FLAGGED', color: 'red', icon: '🚨', message: 'Price significantly above market rate. Validators will be alerted. Add detailed justification.' },
};

/**
 * Get an oracle contract instance (read-only via RPC)
 */
function getOracleContract() {
  if (!ORACLE_ADDRESS || ORACLE_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return null;
  }
  const rpc = import.meta.env.VITE_POLYGON_RPC || 'https://rpc-amoy.polygon.technology';
  const provider = new ethers.JsonRpcProvider(rpc);
  return new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, provider);
}

/**
 * Check price against oracle
 * @param {string} category - Item category
 * @param {number} totalUSDC - Total amount in USDC (human readable, e.g. 500)
 * @param {number} quantity - Number of items
 * @returns {Object} { check: 0|1|2, label, color, icon, message }
 */
export async function checkPriceOracle(category, totalUSDC, quantity) {
  try {
    const oracle = getOracleContract();
    if (!oracle || !category || !quantity || quantity <= 0 || !totalUSDC) {
      return { check: 0, ...PRICE_CHECK_LABELS[0] };
    }

    // Convert human USDC to 6 decimals
    const totalClaimed = Math.round(totalUSDC * 1_000_000);
    const result = await oracle.checkPrice(category, totalClaimed, quantity);
    const checkVal = Number(result);
    return { check: checkVal, ...PRICE_CHECK_LABELS[checkVal] || PRICE_CHECK_LABELS[0] };
  } catch (err) {
    console.warn('Oracle price check failed (fallback to NORMAL):', err.message);
    return { check: 0, ...PRICE_CHECK_LABELS[0] };
  }
}

/**
 * Get market rate for a category
 */
export async function getMarketRate(category) {
  try {
    const oracle = getOracleContract();
    if (!oracle) return null;
    const [min, max, exists] = await oracle.getRate(category);
    if (!exists) return null;
    return { min: Number(min) / 1_000_000, max: Number(max) / 1_000_000 };
  } catch { return null; }
}

// ============ GST Verification ============

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Demo valid GST numbers (real companies for hackathon demo)
const DEMO_GSTINS = {
  '27AAPFU0939F1ZV': 'Uber India Systems Pvt Ltd',
  '07AAGCM6644J1ZN': 'Microsoft Corporation (India) Pvt Ltd',
  '29AABCT3518Q1ZP': 'Tata Consultancy Services Ltd',
  '33AABCR8588A1ZR': 'HCL Technologies Ltd',
  '27AAACL6547M1Z3': 'Wipro Limited',
};

/**
 * Validate GST number format
 * @param {string} gstin
 * @returns {boolean}
 */
export function isValidGSTFormat(gstin) {
  if (!gstin) return false;
  return GST_REGEX.test(gstin.toUpperCase().replace(/\s/g, ''));
}

/**
 * Format GST for display (add space every 5 chars)
 */
export function formatGSTDisplay(gstin) {
  const clean = gstin.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
  return clean.replace(/(.{5})/g, '$1 ').trim();
}

/**
 * Verify GST number - tries API, falls back to demo list
 * @param {string} gstin
 * @returns {Object} { valid: boolean, status: 'verified'|'invalid_format'|'unavailable'|'demo', businessName: string }
 */
export async function verifyGST(gstin) {
  const clean = (gstin || '').toUpperCase().replace(/\s/g, '');

  // Format check
  if (!isValidGSTFormat(clean)) {
    return { valid: false, status: 'invalid_format', businessName: '' };
  }

  // Demo fallback — check known GSTINs
  if (DEMO_GSTINS[clean]) {
    return { valid: true, status: 'demo', businessName: DEMO_GSTINS[clean] };
  }

  // Try API Setu (may fail if not registered)
  try {
    const res = await fetch(`https://apisetu.gov.in/gstn/v3/taxpayers/${clean}`, {
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.tradeNam || data?.lgnm) {
        return { valid: true, status: 'verified', businessName: data.tradeNam || data.lgnm };
      }
    }
  } catch (err) {
    console.warn('GST API unavailable:', err.message);
  }

  // Graceful fallback — format valid but can't verify
  return { valid: true, status: 'unavailable', businessName: '' };
}

export { ITEM_CATEGORIES, PRICE_CHECK_LABELS };
