import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultBook } from '@/data/defaultBook';
import { exportNovelAsJSON, importNovelFromJSON } from '@/lib/exportImport';

describe('export/import validation', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('exports a valid book JSON payload', async () => {
    let exportedBlob: Blob | null = null;
    let downloadName = '';
    const click = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createElement = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          click,
          set href(_value: string) {},
          set download(value: string) { downloadName = value; },
        } as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tagName);
    });

    URL.createObjectURL = vi.fn((blob: Blob) => {
      exportedBlob = blob;
      return 'blob:mock';
    });

    exportNovelAsJSON(defaultBook);

    expect(click).toHaveBeenCalled();
    expect(exportedBlob).not.toBeNull();
    expect(exportedBlob).toBeInstanceOf(Blob);
    expect(downloadName).toContain('Untitled_Novel');

    createElement.mockRestore();
  });

  it('imports a valid backup and assigns a fresh book id', async () => {
    const backup = new File([JSON.stringify(defaultBook)], 'webory-backup.json', { type: 'application/json' });

    const imported = await importNovelFromJSON(backup);

    expect(imported.title).toBe(defaultBook.title);
    expect(imported.id).not.toBe(defaultBook.id);
    expect(imported.chapters).toHaveLength(defaultBook.chapters.length);
    expect(imported.folders).toEqual(defaultBook.folders);
  });

  it('rejects malformed backups', async () => {
    const invalidFile = new File([JSON.stringify({ id: 'broken', title: 'No chapters' })], 'broken.json', { type: 'application/json' });

    await expect(importNovelFromJSON(invalidFile)).rejects.toThrow('Invalid novel file. Expected a full Webory export.');
  });
});
