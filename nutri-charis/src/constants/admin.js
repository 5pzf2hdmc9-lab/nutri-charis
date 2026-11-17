
// ============================================================================
// ΑΥΣΤΗΡΗ ΛΙΣΤΑ ADMIN
// ============================================================================
export const STRICT_ADMIN_EMAILS = [
  'chadisfotoudi@gmail.com'
];

export const ADMIN_EMAIL_ENV =
  typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_EMAIL
    ? process.env.REACT_APP_ADMIN_EMAIL.trim().toLowerCase()
    : '';
