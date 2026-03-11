/*
FILE PURPOSE:
This file contains small shared utility helpers used across the UI.

ROLE IN THE APP:
It mainly normalizes Tailwind class composition so components can merge conditional classes safely.

USED BY:
- many components in src/components and src/components/ui

EXPORTS:
- cn: helper that combines clsx with tailwind-merge
*/

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// This helper solves a common Tailwind problem:
// multiple conditional class strings can conflict with each other.
// clsx builds the class string, and twMerge removes conflicting Tailwind classes.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
