// ===== PASSWORD RULES =====
// Pure validation logic, kept free of DOM concerns so it can be unit tested.
// Mirrors the requirements the vanilla app documented.

export interface PasswordRule {
  id: string;
  message: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'minLength', message: 'At least 8 characters', test: p => p.length >= 8 },
  { id: 'hasUppercase', message: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { id: 'hasLowercase', message: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { id: 'hasNumber', message: 'One number', test: p => /\d/.test(p) },
  { id: 'hasSpecial', message: 'One special character', test: p => /[!@#$%^&*(),.?":{}|<>]/.test(p) }
];

export interface PasswordRuleResult {
  id: string;
  message: string;
  valid: boolean;
}

export function validatePassword(password: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map(({ id, message, test }) => ({ id, message, valid: test(password) }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every(rule => rule.test(password));
}
