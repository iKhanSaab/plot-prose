export type TagColor = 'rose' | 'sage' | 'amber' | 'lavender';

export interface Tag {
  id: string;
  label: string;
  color: TagColor;
}

export interface Pin {
  id: string;
  x: number;
  y: number;
  title: string;
  content: string;
  tags: Tag[];
  connections: string[]; // other pin IDs
}

export interface WhiteboardSheet {
  id: string;
  name: string;
  pins: Pin[];
}

export interface Draft {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  drafts: Draft[];
  activeDraftId: string;
  order: number;
}

export interface Book {
  id: string;
  title: string;
  whiteboards: WhiteboardSheet[];
  chapters: Chapter[];
}

export type ViewMode = 'whiteboard' | 'chapter';

export interface AppState {
  book: Book;
  activeView: ViewMode;
  activeWhiteboardId: string | null;
  activeChapterId: string | null;
  isEditorFocusMode: boolean;
}
