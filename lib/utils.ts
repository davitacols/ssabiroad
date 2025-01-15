import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  try {
    return twMerge(clsx(...inputs));
  } catch (error) {
    console.error("Error in cn function:", error, { inputs });
    throw error; // Re-throw the error after logging
  }
}
