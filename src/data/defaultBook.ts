/*
FILE PURPOSE:
This file defines the fallback default book used when the app starts with no saved library.

ROLE IN THE APP:
It provides the initial project shown to first-time users and acts as a safe default when persistence has no stored data.

USED BY:
- LibraryContext.tsx uses this when no saved library can be loaded
- starterBook.ts provides the actual factory logic behind this constant

EXPORTS:
- defaultBook: a starter Book object used as the initial fallback state
*/

import { Book } from '@/types/book';
import { createStarterBook } from './starterBook';

export const defaultBook: Book = createStarterBook({ id: 'book-1' });
