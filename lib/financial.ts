// Financial Rules Engine for Bochica Platform

// Platform fee percentage (2%)
export const PLATFORM_FEE = parseFloat(process.env.NEXT_PUBLIC_PLATFORM_FEE || '0.02');

// Loan interest rate (5%)
export const LOAN_INTEREST_RATE = parseFloat(process.env.NEXT_PUBLIC_LOAN_INTEREST_RATE || '0.05');

// Lockup periods in milliseconds
export const LOCKUP_PERIODS = {
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
} as const;

export type LockupPeriod = keyof typeof LOCKUP_PERIODS;

/**
 * Calculate platform fee
 * @param amount - Original amount
 * @returns Fee amount
 */
export const calculatePlatformFee = (amount: number): number => {
  return amount * PLATFORM_FEE;
};

/**
 * Calculate net amount after platform fee
 * @param amount - Original amount
 * @returns Net amount after deducting fee
 */
export const calculateNetAmount = (amount: number): number => {
  return amount - calculatePlatformFee(amount);
};

/**
 * Calculate total loan repayment (principal + interest)
 * @param principal - Loan amount
 * @returns Total repayment amount
 */
export const calculateLoanRepayment = (principal: number): number => {
  return principal * (1 + LOAN_INTEREST_RATE);
};

/**
 * Calculate interest amount on loan
 * @param principal - Loan amount
 * @returns Interest amount
 */
export const calculateInterest = (principal: number): number => {
  return principal * LOAN_INTEREST_RATE;
};

/**
 * Calculate lockup end date
 * @param period - Lockup period ('24h', '72h', '7d')
 * @param startDate - Start date (defaults to now)
 * @returns End date as ISO string
 */
export const calculateLockupEndDate = (
  period: LockupPeriod,
  startDate: Date = new Date()
): string => {
  const endDate = new Date(startDate.getTime() + LOCKUP_PERIODS[period]);
  return endDate.toISOString();
};

/**
 * Check if lockup period is active
 * @param lockupEndDate - Lockup end date ISO string
 * @returns True if still locked
 */
export const isLockupActive = (lockupEndDate: string | null | undefined): boolean => {
  if (!lockupEndDate) return false;
  return new Date(lockupEndDate) > new Date();
};

/**
 * Calculate remaining lockup time
 * @param lockupEndDate - Lockup end date ISO string
 * @returns Remaining time in milliseconds
 */
export const getRemainingLockupTime = (lockupEndDate: string): number => {
  const end = new Date(lockupEndDate);
  const now = new Date();
  return Math.max(0, end.getTime() - now.getTime());
};

/**
 * Format lockup time remaining as human readable
 * @param lockupEndDate - Lockup end date ISO string
 * @returns Formatted string (e.g., "23h 45m")
 */
export const formatLockupTimeRemaining = (lockupEndDate: string): string => {
  const remaining = getRemainingLockupTime(lockupEndDate);

  if (remaining === 0) return 'Unlocked';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
};

/**
 * Validate commitment amount
 * @param amount - Amount to validate
 * @param maxAmount - Maximum allowed amount
 * @returns Validation result
 */
export const validateCommitmentAmount = (
  amount: number,
  maxAmount: number
): { valid: boolean; error?: string } => {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount > maxAmount) {
    return { valid: false, error: `Amount cannot exceed ${maxAmount}` };
  }

  const fee = calculatePlatformFee(amount);
  if (fee < 0.01) {
    return { valid: false, error: 'Amount too small (minimum fee is 0.01)' };
  }

  return { valid: true };
};

/**
 * Validate borrow amount against available funds
 * @param amount - Amount to borrow
 * @param availableFunds - Available funds in project
 * @returns Validation result
 */
export const validateBorrowAmount = (
  amount: number,
  availableFunds: number
): { valid: boolean; error?: string } => {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount > availableFunds) {
    return { valid: false, error: `Only ${availableFunds} available to borrow` };
  }

  return { valid: true };
};

/**
 * Validate repayment amount
 * @param amount - Amount being repaid
 * @param requiredAmount - Total amount required
 * @returns Validation result
 */
export const validateRepaymentAmount = (
  amount: number,
  requiredAmount: number
): { valid: boolean; error?: string } => {
  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount < requiredAmount) {
    return { valid: false, error: `Full repayment of ${requiredAmount} required` };
  }

  return { valid: true };
};

/**
 * Format currency amount
 * @param amount - Amount to format
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, decimals: number = 2): string => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Calculate project funding percentage
 * @param currentFunding - Current amount funded
 * @param goalAmount - Goal amount
 * @returns Percentage (0-100)
 */
export const calculateFundingPercentage = (
  currentFunding: number,
  goalAmount: number
): number => {
  if (goalAmount === 0) return 0;
  return Math.min(100, (currentFunding / goalAmount) * 100);
};
