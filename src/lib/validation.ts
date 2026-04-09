export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const PIZZA_REGEX = /p[i1!]zz[a@]/i;

export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: "Name is required" };
  if (trimmed.length > 30) return { valid: false, error: "Name must be 30 characters or less" };
  return { valid: true };
}

export function validatePrompt(prompt: string): ValidationResult {
  const trimmed = prompt.trim();
  if (!trimmed) return { valid: false, error: "Prompt is required" };
  if (trimmed.length > 200) return { valid: false, error: "Prompt must be 200 characters or less" };
  if (PIZZA_REGEX.test(trimmed)) return { valid: false, error: "Prompt cannot contain the word 'pizza' or variants!" };
  return { valid: true };
}

export function countWords(prompt: string): number {
  return prompt.trim().split(/\s+/).length;
}
