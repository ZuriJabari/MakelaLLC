export const isValidUgandaPhone = (phone: string): boolean => {
  // Uganda phone number format: +256 7XX XXXXXX or +256 4XX XXXXXX
  const ugandaPhoneRegex = /^\+256[74][0-9]{8}$/;
  return ugandaPhoneRegex.test(phone.replace(/\s/g, '')); // Remove spaces before testing
};

export const formatUgandaPhone = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add +256 prefix if not present
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('256')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+256' + cleaned.slice(1);
    } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('4'))) {
      cleaned = '+256' + cleaned;
    }
  }
  
  return cleaned;
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Validate Ugandan phone numbers (both MTN and Airtel)
  const phoneRegex = /^(256|0)(7[0-8][0-9])[0-9]{6}$/;
  return phoneRegex.test(phoneNumber);
};

export const validateAmount = (amount: string): boolean => {
  const numericAmount = parseFloat(amount);
  return !isNaN(numericAmount) && numericAmount >= 500; // Minimum amount is 500 UGX
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add 256 prefix if not present
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('256')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '+256' + cleaned.slice(1);
    } else {
      cleaned = '+256' + cleaned;
    }
  }
  
  return cleaned;
}; 