export function formatPhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  // Remove leading 1 if present (for US numbers)
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  // Only format if 10 digits
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  // If already in E.164 or not 10/11 digits, return as is
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (digits.length > 0 && phone.startsWith('+')) {
    return phone;
  }
  return '';
}
