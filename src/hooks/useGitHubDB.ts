import { useState, useEffect, useCallback } from 'react';
import { ContentType } from '@/types';
import type { ContentItem, SiteSettings, ContentMeta, GitHubFile } from '@/types';

// GitHub Configuration
// These will be set via environment variables on Netlify
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || ''; // format: owner/repo
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';
const CONTENT_PATH = import.meta.env.VITE_CONTENT_PATH || 'content';

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

interface UseGitHubDBReturn {
  items: ContentItem[];
  settings: SiteSettings;
  isLoading: boolean;
  error: string | null;
  isGitHubConfigured: boolean;
  saveItem: (item: ContentItem) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  saveSettings: (settings: SiteSettings) => Promise<boolean>;
  saveMeta: (meta: ContentMeta) => Promise<boolean>;
  refetch: () => Promise<void>;
}

// Helper to generate filename from content
const generateFilename = (item: ContentItem): string => {
  const suffix = item.type === ContentType.STORY ? 'story' : 
                 item.type === ContentType.POEM ? 'poem' : 'quote';
  
  if (item.type === ContentType.QUOTE) {
    return `${suffix}-${item.id}.json`;
  }
  
  // For stories and poems, create a slug from title
  const slug = item.title 
    ? item.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 30)
    : item.id;
  
  return `${suffix}-${slug}.json`;
};

// GitHub API helper
const githubApi = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    throw new Error('GitHub not configured');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  return response.json();
};

// Get file content from GitHub
const getFileContent = async (path: string): Promise<any> => {
  try {
    const file = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`);
    if (file.content) {
      const decoded = atob(file.content.replace(/\s/g, ''));
      return { content: JSON.parse(decoded), sha: file.sha };
    }
    return null;
  } catch (e) {
    console.warn(`Could not load ${path}:`, e);
    return null;
  }
};

// Create or update file on GitHub
const saveFileToGitHub = async (path: string, content: any, sha?: string): Promise<boolean> => {
  try {
    const message = sha ? `Update ${path}` : `Create ${path}`;
    const body = {
      message,
      content: btoa(JSON.stringify(content, null, 2)),
      branch: GITHUB_BRANCH,
      ...(sha && { sha }),
    };

    await githubApi(`/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return true;
  } catch (e) {
    console.error(`Failed to save ${path}:`, e);
    return false;
  }
};

// Delete file from GitHub
const deleteFileFromGitHub = async (path: string, sha: string): Promise<boolean> => {
  try {
    await githubApi(`/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message: `Delete ${path}`,
        sha,
        branch: GITHUB_BRANCH,
      }),
    });
    return true;
  } catch (e) {
    console.error(`Failed to delete ${path}:`, e);
    return false;
  }
};

// List files in directory
const listFiles = async (path: string): Promise<GitHubFile[]> => {
  try {
    const files = await githubApi(`/contents/${path}?ref=${GITHUB_BRANCH}`);
    return Array.isArray(files) ? files : [];
  } catch (e) {
    console.warn(`Could not list files in ${path}:`, e);
    return [];
  }
};

export function useGitHubDB(): UseGitHubDBReturn {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isGitHubConfigured = Boolean(GITHUB_TOKEN && GITHUB_REPO);

  // Load content from GitHub or local files
  const fetchContent = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check for saved content in localStorage first (for offline mode)
      const savedContent = localStorage.getItem('cms_content');
      const savedSettings = localStorage.getItem('cms_settings');

      // Try to load from GitHub if configured
      if (isGitHubConfigured) {
        try {
          // Load settings
          const settingsData = await getFileContent(`${CONTENT_PATH}/settings.json`);
          if (settingsData?.content) {
            setSettings(settingsData.content);
            localStorage.setItem('cms_settings', JSON.stringify(settingsData.content));
          } else if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }

          // Load meta
          const metaData = await getFileContent(`${CONTENT_PATH}/meta.json`);
          const contentOrder: string[] = metaData?.content?.contentOrder || [];

          // List all content files
          const files = await listFiles(CONTENT_PATH);
          const contentFiles = files.filter((f: GitHubFile) => 
            f.name.endsWith('.json') && 
            f.name !== 'settings.json' && 
            f.name !== 'meta.json'
          );

          // Load each content file
          const loadedContent: ContentItem[] = [];
          for (const file of contentFiles) {
            const data = await getFileContent(file.path);
            if (data?.content) {
              loadedContent.push(data.content as ContentItem);
            }
          }

          // Sort by content order
          if (contentOrder.length > 0) {
            const orderMap = new Map(contentOrder.map((id: string, index: number) => [id, index]));
            loadedContent.sort((a: ContentItem, b: ContentItem) => {
              const orderA = orderMap.get(a.id) ?? Infinity;
              const orderB = orderMap.get(b.id) ?? Infinity;
              return (orderA as number) - (orderB as number);
            });
          }

          if (loadedContent.length > 0) {
            setItems(loadedContent);
            localStorage.setItem('cms_content', JSON.stringify(loadedContent));
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.warn('GitHub fetch failed, falling back to local files:', e);
        }
      }

      // Fallback: Load from local JSON files (static hosting)
      if (savedContent) {
        try {
          const parsed = JSON.parse(savedContent);
          setItems(parsed);
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
          setIsLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse saved content, loading from files');
        }
      }

      // Load from static files
      let siteSettings = DEFAULT_SETTINGS;
      try {
        const settingsRes = await fetch(`/content/settings.json`);
        if (settingsRes.ok) {
          siteSettings = await settingsRes.json() as SiteSettings;
          setSettings(siteSettings);
        }
      } catch (e) {
        console.warn('Could not load settings, using defaults');
      }

      // Load meta
      let contentOrder: string[] = [];
      try {
        const metaRes = await fetch('/content/meta.json');
        if (metaRes.ok) {
          const meta: ContentMeta = await metaRes.json() as ContentMeta;
          contentOrder = meta.contentOrder || [];
        }
      } catch (e) {
        console.warn('Could not load content order');
      }

      // Load all content files
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
            const item = await res.json() as ContentItem;
            loadedContent.push(item);
          }
        } catch (e) {
          console.warn(`Could not load ${file}`);
        }
      }

      // Sort by content order
      if (contentOrder.length > 0) {
        const orderMap = new Map(contentOrder.map((id, index) => [id, index]));
        loadedContent.sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? Infinity;
          const orderB = orderMap.get(b.id) ?? Infinity;
          return (orderA as number) - (orderB as number);
        });
      }

      const finalContent = loadedContent.length > 0 ? loadedContent : DEFAULT_CONTENT;
      setItems(finalContent);
      
      // Save to localStorage for persistence
      localStorage.setItem('cms_content', JSON.stringify(finalContent));
      localStorage.setItem('cms_settings', JSON.stringify(siteSettings));
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content');
      setItems(DEFAULT_CONTENT);
    } finally {
      setIsLoading(false);
    }
  }, [isGitHubConfigured]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Save item to GitHub (create or update)
  const saveItem = useCallback(async (item: ContentItem): Promise<boolean> => {
    // Update local state first
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      let newItems: ContentItem[];
      if (exists) {
        newItems = prev.map(i => i.id === item.id ? item : i);
      } else {
        newItems = [item, ...prev];
      }
      localStorage.setItem('cms_content', JSON.stringify(newItems));
      return newItems;
    });

    // If GitHub is configured, save to repository
    if (isGitHubConfigured) {
      const filename = generateFilename(item);
      const path = `${CONTENT_PATH}/${filename}`;
      
      // Check if file exists to get SHA
      const existing = await getFileContent(path);
      const success = await saveFileToGitHub(path, item, existing?.sha);
      
      if (success) {
        // Update meta.json with new order
        const metaData = await getFileContent(`${CONTENT_PATH}/meta.json`);
        const currentOrder: string[] = metaData?.content?.contentOrder || [];
        
        if (!currentOrder.includes(item.id)) {
          const newOrder = [item.id, ...currentOrder.filter((id: string) => id !== item.id)];
          await saveFileToGitHub(`${CONTENT_PATH}/meta.json`, { contentOrder: newOrder }, metaData?.sha);
        }
      }
      
      return success;
    }

    return true; // Local-only mode always succeeds
  }, [isGitHubConfigured]);

  // Delete item from GitHub
  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    // Update local state first
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id);
      localStorage.setItem('cms_content', JSON.stringify(newItems));
      return newItems;
    });

    // If GitHub is configured, delete from repository
    if (isGitHubConfigured) {
      // Find the file by looking up all content files
      const files = await listFiles(CONTENT_PATH);
      const contentFiles = files.filter((f: GitHubFile) => 
        f.name.endsWith('.json') && 
        f.name !== 'settings.json' && 
        f.name !== 'meta.json'
      );

      for (const file of contentFiles) {
        const data = await getFileContent(file.path);
        if (data?.content?.id === id) {
          const success = await deleteFileFromGitHub(file.path, data.sha);
          
          if (success) {
            // Update meta.json
            const metaData = await getFileContent(`${CONTENT_PATH}/meta.json`);
            if (metaData?.content?.contentOrder) {
              const newOrder = metaData.content.contentOrder.filter((itemId: string) => itemId !== id);
              await saveFileToGitHub(`${CONTENT_PATH}/meta.json`, { contentOrder: newOrder }, metaData.sha);
            }
          }
          
          return success;
        }
      }
    }

    return true; // Local-only mode always succeeds
  }, [isGitHubConfigured]);

  // Save settings to GitHub
  const saveSettings = useCallback(async (newSettings: SiteSettings): Promise<boolean> => {
    setSettings(newSettings);
    localStorage.setItem('cms_settings', JSON.stringify(newSettings));

    if (isGitHubConfigured) {
      const existing = await getFileContent(`${CONTENT_PATH}/settings.json`);
      return await saveFileToGitHub(`${CONTENT_PATH}/settings.json`, newSettings, existing?.sha);
    }

    return true;
  }, [isGitHubConfigured]);

  // Save meta to GitHub
  const saveMeta = useCallback(async (meta: ContentMeta): Promise<boolean> => {
    if (isGitHubConfigured) {
      const existing = await getFileContent(`${CONTENT_PATH}/meta.json`);
      return await saveFileToGitHub(`${CONTENT_PATH}/meta.json`, meta, existing?.sha);
    }
    return true;
  }, [isGitHubConfigured]);

  return { 
    items, 
    settings, 
    isLoading, 
    error, 
    isGitHubConfigured,
    saveItem,
    deleteItem,
    saveSettings,
    saveMeta,
    refetch: fetchContent 
  };
}
