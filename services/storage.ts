
import { Book, ReadingProgress, TrainingSignal } from '../types';

const STORAGE_KEY_WISHLIST = 'atmosphera_wishlist';
const STORAGE_KEY_ACTIVE = 'atmosphera_active_read';
const STORAGE_KEY_PROGRESS = 'atmosphera_reading_progress';
const STORAGE_KEY_TRAINING = 'atmosphera_training_signals';

// Helper to generate IDs if missing
const ensureId = (book: Book): Book => {
  if (!book.id) {
    book.id = btoa(`${book.title}-${book.author}`).replace(/=/g, '');
  }
  return book;
};

export const getWishlist = (): Book[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_WISHLIST);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load wishlist", e);
    return [];
  }
};

export const isInWishlist = (book: Book): boolean => {
  const list = getWishlist();
  return list.some(b => b.title === book.title && b.author === book.author);
};

export const toggleWishlist = (book: Book): boolean => {
  const list = getWishlist();
  const index = list.findIndex(b => b.title === book.title && b.author === book.author);
  
  let isSaved = false;
  if (index >= 0) {
    list.splice(index, 1);
    isSaved = false;
  } else {
    list.push(ensureId(book));
    isSaved = true;
  }
  
  localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(list));
  window.dispatchEvent(new Event('wishlist-updated'));
  return isSaved;
};

// --- Active Reading & Progress ---

export const getActiveRead = (): Book | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ACTIVE);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const getReadingProgress = (): ReadingProgress | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const saveReadingProgress = (progress: ReadingProgress) => {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  window.dispatchEvent(new Event('progress-updated'));
};

export const setActiveRead = (book: Book | null) => {
  if (book) {
    const currentRead = getActiveRead();
    
    if (!currentRead || currentRead.title !== book.title) {
       const initialProgress: ReadingProgress = {
         bookTitle: book.title,
         currentPage: 0,
         totalPages: book.pageCount || 300, 
         percentage: 0,
         lastUpdated: new Date().toISOString()
       };
       localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(initialProgress));
    }
    
    localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(ensureId(book)));
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE);
  }
  window.dispatchEvent(new Event('active-read-updated'));
};

// Added training signal management functions to fix NeuralLab.tsx import errors
export const getTrainingSignals = (): TrainingSignal[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRAINING);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveTrainingSignal = (signal: TrainingSignal) => {
  const signals = getTrainingSignals();
  signals.push(signal);
  localStorage.setItem(STORAGE_KEY_TRAINING, JSON.stringify(signals));
  window.dispatchEvent(new Event('training-updated'));
};

export const clearTrainingData = () => {
  localStorage.removeItem(STORAGE_KEY_TRAINING);
  window.dispatchEvent(new Event('training-updated'));
};
