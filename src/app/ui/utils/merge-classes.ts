import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function mergeClasses(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transform(value: unknown): boolean {
  return value === '' || (!!value && value !== 'false');
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
