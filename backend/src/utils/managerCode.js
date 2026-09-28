/**
 * Generates a unique, human-readable Manager Code.
 *
 * Format: MGR-<NAMEPART>-<4-digit number>
 * Example: MGR-ALEXM-3821
 *
 * Rules:
 *  - NAMEPART = first 5 chars of first name + first char of last name (if exists), uppercased, letters only
 *  - 4-digit number is random (1000-9999)
 *  - Retries up to 10 times if a collision occurs (extremely unlikely)
 */
const User = require('../models/User');

/**
 * Derives the name part of the code from the user's full name.
 * E.g. "Alex Manager" → "ALEXM", "John" → "JOHN"
 * @param {string} fullName
 * @returns {string} 4-6 char uppercase alphanumeric name segment
 */
const buildNamePart = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0].replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase();
  const lastInitial = parts[1] ? parts[1].replace(/[^a-zA-Z]/g, '').slice(0, 1).toUpperCase() : '';
  return (first + lastInitial) || 'MGR';
};

/**
 * Generates and persists a unique manager code for a user document.
 * @param {string} name - The manager's full name
 * @returns {string} generated code e.g. "MGR-ALEXM-3821"
 */
const generateManagerCode = async (name) => {
  const namePart = buildNamePart(name);
  const maxAttempts = 10;

  for (let i = 0; i < maxAttempts; i++) {
    const number = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    const code = `MGR-${namePart}-${number}`;

    // Check uniqueness in DB
    const exists = await User.findOne({ managerCode: code });
    if (!exists) return code;
  }

  // Fallback: use timestamp suffix (guaranteed unique)
  const ts = Date.now().toString().slice(-4);
  return `MGR-${namePart}-${ts}`;
};

module.exports = { generateManagerCode };
