import { Book } from '@/types/book';
import { createStarterBook } from './starterBook';

export const defaultBook: Book = createStarterBook({ id: 'book-1' });
