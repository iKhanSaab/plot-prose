import { Book } from '@/types/book';

export const defaultBook: Book = {
  id: 'book-1',
  title: 'My Novel',
  folders: [
    {
      id: 'folder-1',
      name: 'Act I',
      whiteboardIds: ['wb-1'],
      chapterIds: ['ch-1', 'ch-2'],
      order: 1,
    },
  ],
  whiteboards: [
    {
      id: 'wb-1',
      name: 'Plot Structure',
      pins: [
        {
          id: 'pin-1',
          x: 120,
          y: 100,
          title: 'Act I - Setup',
          content: 'Introduce the protagonist and the ordinary world. Establish stakes.',
          tags: [{ id: 't1', label: 'Plot', color: 'amber' }],
          connections: ['pin-2'],
        },
        {
          id: 'pin-2',
          x: 420,
          y: 100,
          title: 'Inciting Incident',
          content: 'The event that disrupts the ordinary world and sets the story in motion.',
          tags: [
            { id: 't2', label: 'Plot', color: 'amber' },
            { id: 't3', label: 'Key Scene', color: 'rose' },
          ],
          connections: ['pin-1', 'pin-3'],
        },
        {
          id: 'pin-3',
          x: 720,
          y: 100,
          title: 'Act II - Confrontation',
          content: 'Rising action, obstacles, and character development.',
          tags: [{ id: 't4', label: 'Plot', color: 'amber' }],
          connections: ['pin-2', 'pin-4'],
        },
        {
          id: 'pin-4',
          x: 420,
          y: 320,
          title: 'Midpoint Twist',
          content: 'A major revelation or reversal that changes everything.',
          tags: [
            { id: 't5', label: 'Twist', color: 'lavender' },
            { id: 't6', label: 'Key Scene', color: 'rose' },
          ],
          connections: ['pin-3', 'pin-5'],
        },
        {
          id: 'pin-5',
          x: 720,
          y: 320,
          title: 'Act III - Resolution',
          content: 'Climax and resolution. All threads come together.',
          tags: [{ id: 't7', label: 'Plot', color: 'amber' }],
          connections: ['pin-4'],
        },
      ],
    },
    {
      id: 'wb-2',
      name: 'Characters',
      pins: [
        {
          id: 'pin-c1',
          x: 150,
          y: 120,
          title: 'Protagonist',
          content: 'Name, motivation, flaw, arc.',
          tags: [{ id: 'tc1', label: 'Character', color: 'sage' }],
          connections: ['pin-c2'],
        },
        {
          id: 'pin-c2',
          x: 450,
          y: 120,
          title: 'Antagonist',
          content: 'Name, motivation, threat level.',
          tags: [
            { id: 'tc2', label: 'Character', color: 'sage' },
            { id: 'tc3', label: 'Villain', color: 'rose' },
          ],
          connections: ['pin-c1'],
        },
      ],
    },
  ],
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter 1: The Beginning',
      order: 1,
      activeDraftId: 'draft-1a',
      drafts: [
        {
          id: 'draft-1a',
          name: 'First Draft',
          content:
            'The morning light crept through the curtains like an uninvited guest, casting long amber stripes across the wooden floor. She lay still, listening to the house breathe - the tick of the radiator, the groan of old pipes, the silence between.\n\nToday would be different. She could feel it the way sailors feel a storm before the clouds arrive: a pressure in the chest, a restlessness in the bones.\n\nShe swung her legs over the side of the bed and stood. The floorboards protested beneath her weight. Through the window, the town stretched out below - rooftops, chimney smoke, the distant glint of the river. Ordinary. Unchanged. But something in the air whispered otherwise.',
          createdAt: '2026-02-15T10:00:00Z',
          updatedAt: '2026-02-15T14:30:00Z',
        },
      ],
    },
    {
      id: 'ch-2',
      title: 'Chapter 2: The Discovery',
      order: 2,
      activeDraftId: 'draft-2a',
      drafts: [
        {
          id: 'draft-2a',
          name: 'First Draft',
          content:
            "The letter arrived without a return address. Just her name, written in a hand she didn't recognize - elegant, deliberate, the ink slightly smudged as if the writer had been in a hurry.\n\nShe turned it over twice before opening it.",
          createdAt: '2026-02-16T09:00:00Z',
          updatedAt: '2026-02-16T11:00:00Z',
        },
      ],
    },
    {
      id: 'ch-3',
      title: 'Chapter 3: The Journey',
      order: 3,
      activeDraftId: 'draft-3a',
      drafts: [
        {
          id: 'draft-3a',
          name: 'First Draft',
          content: '',
          createdAt: '2026-02-17T08:00:00Z',
          updatedAt: '2026-02-17T08:00:00Z',
        },
      ],
    },
  ],
};
