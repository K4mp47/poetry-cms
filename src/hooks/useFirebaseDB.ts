import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { ContentType } from '@/types';
import type { ContentItem, SiteSettings, ContentMeta } from '@/types';

// Default content to fall back to if fetch fails
const DEFAULT_CONTENT: ContentItem[] = [
  {
    id: '1',
    type: ContentType.QUOTE,
    body: "If you look at what you have in life, you'll always have more. If you look at what you don't have in life, you'll never have enough.",
  },
  {
    id: '2',
    type: ContentType.STORY,
    title: 'This Beginning May Have Always Meant This End',
    excerpt: 'Coming from a place where we meandered mornings and met quail, scrub jay, mockingbird...',
    body: 'Coming from a place where we meandered mornings and met quail, scrub jay, mockingbird, i knew coyote, like everyone else...',
    date: 'Oct 24, 2023'
  }
];

const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: 'Digital Silence',
  siteDescription: 'A collection of stories, poetry, and moments crafted in the void.',
  authorName: 'Jacopo',
  authorBio: 'Obsessed with the silence between words and the shadows cast by the noon sun.',
  authorRoles: ['Author', 'Curator', 'Dreamer']
};

interface UseFirebaseDBReturn {
  items: ContentItem[];
  settings: SiteSettings;
  isLoading: boolean;
  error: string | null;
  isFirebaseConfigured: boolean;
  saveItem: (item: ContentItem) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  saveSettings: (settings: SiteSettings) => Promise<boolean>;
  saveMeta: (meta: ContentMeta) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useFirebaseDB(): UseFirebaseDBReturn {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isFirebaseConfigured) {
        // Load settings
        const settingsDoc = await getDoc(doc(db, 'config', 'settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data() as SiteSettings;
          setSettings({
            ...data,
            authorRoles: Array.isArray(data.authorRoles) ? data.authorRoles : []
          });
        }

        // Load items
        const contentSnap = await getDocs(collection(db, 'content'));
        const loadedContent: ContentItem[] = [];
        contentSnap.forEach((doc) => {
          loadedContent.push({ ...doc.data(), id: doc.id } as ContentItem);
        });

        // Load meta for ordering
        const metaDoc = await getDoc(doc(db, 'config', 'meta'));
        const contentOrder: string[] = metaDoc.exists() ? (metaDoc.data() as ContentMeta).contentOrder : [];

        // Sort by content order
        if (contentOrder.length > 0) {
          const orderMap = new Map(contentOrder.map((id, index) => [id, index]));
          loadedContent.sort((a, b) => {
            const orderA = orderMap.get(a.id) ?? Infinity;
            const orderB = orderMap.get(b.id) ?? Infinity;
            return (orderA as number) - (orderB as number);
          });
        }

        if (loadedContent.length > 0) {
          setItems(loadedContent);
          setIsLoading(false);
          return;
        }
      }

      // Fallback: Load from static files or localStorage
      const savedContent = localStorage.getItem('cms_content');
      const savedSettings = localStorage.getItem('cms_settings');

      if (savedContent) {
        setItems(JSON.parse(savedContent));
        if (savedSettings) setSettings(JSON.parse(savedSettings));
        setIsLoading(false);
        return;
      }

      // Load from static files
      const settingsRes = await fetch('/content/settings.json');
      if (settingsRes.ok) {
        const staticSettings = await settingsRes.json();
        setSettings(staticSettings);
      }

      const contentFiles = [
        'quote-1.json', 'quote-2.json', 'quote-3.json', 'quote-4.json',
        'story-this-beginning.json', 'story-fragments.json', 'story-silent-architect.json',
        'story-train-nowhere.json', 'story-old-clock.json', 'story-last-bookstore.json',
        'poem-first-snow.json', 'poem-jagged-winter.json', 'poem-neon-rain.json',
        'poem-paper-planes.json', 'poem-roots.json'
      ];

      const loadedContent: ContentItem[] = [];
      for (const file of contentFiles) {
        try {
          const res = await fetch(`/content/${file}`);
          if (res.ok) {
            const item = await res.json();
            loadedContent.push(item);
          }
        } catch (e) {
          console.warn(`Could not load ${file}, ${e}`);
        }
      }

      const finalContent = loadedContent.length > 0 ? loadedContent : DEFAULT_CONTENT;
      setItems(finalContent);
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content');
      setItems(DEFAULT_CONTENT);
      setIsLoading(false);
    }
  }, [isFirebaseConfigured]);

  useEffect(() => {
    // If not using Firebase, just fetch once (loads from static files)
    if (!isFirebaseConfigured) {
      const timer = setTimeout(() => {
        fetchContent();
      }, 0);
      return () => clearTimeout(timer);
    }

    // If using Firebase, wait for auth state to be initialized
    // This ensures we have the correct security context for reading
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchContent();
      } else {
        // Authenticate anonymously to allow reading content if rules require auth
        signInAnonymously(auth).catch((err) => {
          console.error("Failed to sign in anonymously:", err);
          // Try fetching anyway in case rules allow public read
          fetchContent();
        });
      }
    });
    return () => unsubscribe();
  }, [fetchContent, isFirebaseConfigured]);

  const saveItem = useCallback(async (item: ContentItem): Promise<boolean> => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.map(i => i.id === item.id ? item : i);
      return [item, ...prev];
    });

    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'content', item.id), item);
        
        // Update meta order if new
        try {
          const metaDoc = await getDoc(doc(db, 'config', 'meta'));
          const currentOrder: string[] = metaDoc.exists() ? (metaDoc.data() as ContentMeta).contentOrder : [];
          
          if (!currentOrder.includes(item.id)) {
            const newOrder = [item.id, ...currentOrder];
            await setDoc(doc(db, 'config', 'meta'), { contentOrder: newOrder });
          }
        } catch (metaError) {
          console.warn('Failed to update meta order, but item was saved:', metaError);
        }
        return true;
      } catch (e) {
        console.error('Firebase save error (check for ad-blockers if "blocked by client"):', e);
        return false;
      }
    }
    return true;
  }, [isFirebaseConfigured]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setItems(prev => prev.filter(i => i.id !== id));

    if (isFirebaseConfigured) {
      try {
        await deleteDoc(doc(db, 'content', id));
        
        // Update meta order
        const metaDoc = await getDoc(doc(db, 'config', 'meta'));
        if (metaDoc.exists()) {
          const currentOrder = (metaDoc.data() as ContentMeta).contentOrder;
          const newOrder = currentOrder.filter(itemId => itemId !== id);
          await setDoc(doc(db, 'config', 'meta'), { contentOrder: newOrder });
        }
        return true;
      } catch (e) {
        console.error('Firebase delete error:', e);
        return false;
      }
    }
    return true;
  }, [isFirebaseConfigured]);

  const saveSettings = useCallback(async (newSettings: SiteSettings): Promise<boolean> => {
    setSettings(newSettings);
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'config', 'settings'), newSettings);
        return true;
      } catch (e) {
        console.error('Firebase settings save error:', e);
        return false;
      }
    }
    return true;
  }, [isFirebaseConfigured]);

  const saveMeta = useCallback(async (meta: ContentMeta): Promise<boolean> => {
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'config', 'meta'), meta);
        return true;
      } catch (e) {
        console.error('Firebase meta save error:', e);
        return false;
      }
    }
    return true;
  }, [isFirebaseConfigured]);

  return {
    items,
    settings,
    isLoading,
    error,
    isFirebaseConfigured,
    saveItem,
    deleteItem,
    saveSettings,
    saveMeta,
    refetch: fetchContent
  };
}
