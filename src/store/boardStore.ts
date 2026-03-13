import { create } from 'zustand';

export interface Pin {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
  width: number;
  height: number;
  tagIds: string[];
  attachmentUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Link {
  id: string;
  sourcePinId: string;
  targetPinId: string;
  createdAt: number;
}

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

interface BoardState {
  pins: Pin[];
  tags: Tag[];
  links: Link[];
  viewport: ViewportState;
  selectedPinIds: string[];
  linkingFromPinId: string | null;
  boardName: string;
  addPin: (x: number, y: number) => void;
  updatePin: (id: string, updates: Partial<Pin>) => void;
  deletePin: (id: string) => void;
  movePin: (id: string, x: number, y: number) => void;
  resizePin: (id: string, width: number, height: number) => void;
  selectPin: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  addTag: (name: string, color: string) => void;
  deleteTag: (id: string) => void;
  assignTag: (pinId: string, tagId: string) => void;
  unassignTag: (pinId: string, tagId: string) => void;
  startLinking: (pinId: string) => void;
  completeLinking: (targetPinId: string) => void;
  cancelLinking: () => void;
  deleteLink: (id: string) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setBoardName: (name: string) => void;
  setAttachment: (pinId: string, url: string) => void;
  removeAttachment: (pinId: string) => void;
  save: () => void;
  load: () => void;
}

const uid = () => crypto.randomUUID();
const STORAGE_KEY = 'novel-plot-board';

export const useBoardStore = create<BoardState>((set, get) => ({
  pins: [],
  tags: [],
  links: [],
  viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
  selectedPinIds: [],
  linkingFromPinId: null,
  boardName: 'My Plot Board',

  addPin: (x, y) => {
    const pin: Pin = {
      id: uid(),
      title: 'New Pin',
      body: '',
      x,
      y,
      width: 220,
      height: 160,
      tagIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({ pins: [...state.pins, pin], selectedPinIds: [pin.id] }));
    get().save();
  },

  updatePin: (id, updates) => {
    set((state) => ({
      pins: state.pins.map((pin) => (pin.id === id ? { ...pin, ...updates, updatedAt: Date.now() } : pin)),
    }));
    get().save();
  },

  deletePin: (id) => {
    set((state) => ({
      pins: state.pins.filter((pin) => pin.id !== id),
      links: state.links.filter((link) => link.sourcePinId !== id && link.targetPinId !== id),
      selectedPinIds: state.selectedPinIds.filter((selectedPinId) => selectedPinId !== id),
    }));
    get().save();
  },

  movePin: (id, x, y) => {
    set((state) => ({
      pins: state.pins.map((pin) => (pin.id === id ? { ...pin, x, y, updatedAt: Date.now() } : pin)),
    }));
    get().save();
  },

  resizePin: (id, width, height) => {
    const nextWidth = Math.max(160, Math.min(640, width));
    const nextHeight = Math.max(120, Math.min(480, height));

    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === id ? { ...pin, width: nextWidth, height: nextHeight, updatedAt: Date.now() } : pin
      ),
    }));
    get().save();
  },

  selectPin: (id, multi) => {
    set((state) => {
      if (!multi) {
        return { selectedPinIds: [id] };
      }

      const alreadySelected = state.selectedPinIds.includes(id);
      return {
        selectedPinIds: alreadySelected
          ? state.selectedPinIds.filter((selectedId) => selectedId !== id)
          : [...state.selectedPinIds, id],
      };
    });
  },

  clearSelection: () => set({ selectedPinIds: [] }),

  addTag: (name, color) => {
    set((state) => ({ tags: [...state.tags, { id: uid(), name, color }] }));
    get().save();
  },

  deleteTag: (id) => {
    set((state) => ({
      tags: state.tags.filter((tag) => tag.id !== id),
      pins: state.pins.map((pin) => ({ ...pin, tagIds: pin.tagIds.filter((tagId) => tagId !== id) })),
    }));
    get().save();
  },

  assignTag: (pinId, tagId) => {
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === pinId && !pin.tagIds.includes(tagId) ? { ...pin, tagIds: [...pin.tagIds, tagId] } : pin
      ),
    }));
    get().save();
  },

  unassignTag: (pinId, tagId) => {
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === pinId ? { ...pin, tagIds: pin.tagIds.filter((currentTagId) => currentTagId !== tagId) } : pin
      ),
    }));
    get().save();
  },

  startLinking: (pinId) => set({ linkingFromPinId: pinId }),

  completeLinking: (targetPinId) => {
    const { linkingFromPinId, links } = get();

    if (!linkingFromPinId || linkingFromPinId === targetPinId) {
      set({ linkingFromPinId: null });
      return;
    }

    const exists = links.some(
      (link) =>
        (link.sourcePinId === linkingFromPinId && link.targetPinId === targetPinId) ||
        (link.sourcePinId === targetPinId && link.targetPinId === linkingFromPinId)
    );

    if (exists) {
      set({ linkingFromPinId: null });
      return;
    }

    set((state) => ({
      links: [
        ...state.links,
        { id: uid(), sourcePinId: linkingFromPinId, targetPinId, createdAt: Date.now() },
      ],
      linkingFromPinId: null,
    }));
    get().save();
  },

  cancelLinking: () => set({ linkingFromPinId: null }),

  deleteLink: (id) => {
    set((state) => ({ links: state.links.filter((link) => link.id !== id) }));
    get().save();
  },

  setViewport: (viewport) => {
    set((state) => ({ viewport: { ...state.viewport, ...viewport } }));
  },

  setBoardName: (name) => {
    set({ boardName: name });
    get().save();
  },

  setAttachment: (pinId, url) => {
    set((state) => ({
      pins: state.pins.map((pin) => (pin.id === pinId ? { ...pin, attachmentUrl: url, updatedAt: Date.now() } : pin)),
    }));
    get().save();
  },

  removeAttachment: (pinId) => {
    set((state) => ({
      pins: state.pins.map((pin) =>
        pin.id === pinId ? { ...pin, attachmentUrl: undefined, updatedAt: Date.now() } : pin
      ),
    }));
    get().save();
  },

  save: () => {
    const { pins, tags, links, viewport, boardName } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pins, tags, links, viewport, boardName }));
  },

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const data = JSON.parse(raw);
      set({
        pins: data.pins || [],
        tags: data.tags || [],
        links: data.links || [],
        viewport: data.viewport || { offsetX: 0, offsetY: 0, zoom: 1 },
        boardName: data.boardName || 'My Plot Board',
      });
    } catch {
      // Ignore invalid saved data.
    }
  },
}));
