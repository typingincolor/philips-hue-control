const VALIDATION = {
  IP_REGEX: /^(\d{1,3}\.){3}\d{1,3}$/,
  IP_OCTET_MIN: 0,
  IP_OCTET_MAX: 255
};

/**
 * Validate an IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP address
 */
export const validateIp = (ip) => {
  if (!VALIDATION.IP_REGEX.test(ip)) return false;

  // Check each octet is 0-255
  const octets = ip.split('.');
  return octets.every(octet => {
    const num = parseInt(octet, 10);
    return num >= VALIDATION.IP_OCTET_MIN && num <= VALIDATION.IP_OCTET_MAX;
  });
};
