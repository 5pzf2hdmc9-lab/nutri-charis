
// Break-glass emails only. Do not hardcode a personal address in the client bundle.
// Dietitian authorization is the `dietitians` row (RLS), not this list.
export const STRICT_ADMIN_EMAILS = [];

export const ADMIN_EMAIL_ENV =
  typeof process !== 'undefined' && process.env && process.env.REACT_APP_ADMIN_EMAIL
    ? process.env.REACT_APP_ADMIN_EMAIL.trim().toLowerCase()
    : '';
