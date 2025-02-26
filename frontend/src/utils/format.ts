import BigNumber from 'bignumber.js';

// Truncate wallet address
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

// Format token amount for display
export function formatTokenAmount(
  amount: string | number,
  decimals = 6,
  displayDecimals = 2
): string {
  const bn = new BigNumber(amount);
  const divisor = new BigNumber(10).pow(decimals);
  const formatted = bn.dividedBy(divisor).toFixed(displayDecimals);
  return formatted;
}

// Convert human readable amount to contract amount
export function toContractAmount(
  amount: string | number,
  decimals = 6
): string {
  const bn = new BigNumber(amount);
  const multiplier = new BigNumber(10).pow(decimals);
  return bn.multipliedBy(multiplier).toFixed(0);
}

// Extract denom from factory path
export function extractDenomFromPath(fullDenom: string): string {
  const parts = fullDenom.split('/');
  if (parts.length >= 3) {
    return parts[2];
  }
  return fullDenom;
}

// Format a denom for UI display
export function formatDenom(denom: string): string {
  // Extract subdenom from factory denom
  if (denom.startsWith('factory/')) {
    const parts = denom.split('/');
    if (parts.length >= 3) {
      denom = parts[2];
    }
  }
  
  // Handle ERC20 wrapped tokens
  if (denom.startsWith('crwn')) {
    return `${denom.substring(0, 8)}...${denom.substring(denom.length - 6)}`;
  }
  
  // Handle CW20 wrapped tokens
  if (denom.length > 12) {
    return `${denom.substring(0, 6)}...${denom.substring(denom.length - 6)}`;
  }
  
  return denom;
}

// Convert hex string to bytes
export function hexToBytes(hex: string): Uint8Array {
  hex = hex.startsWith('0x') ? hex.substring(2) : hex;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert bytes to base64
export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}