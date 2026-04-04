import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(): string {
  // Generate a random 2-digit number (00-99)
  return Math.floor(Math.random() * 100).toString().padStart(2, '0');
}
