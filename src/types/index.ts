// Content Types
export const ContentType = {
  STORY: 'Story',
  POEM: 'Poetry',
  QUOTE: 'Quote'
} as const;

export type ContentTypeValue = typeof ContentType[keyof typeof ContentType];

export interface ContentItem {
  id: string;
  type: ContentTypeValue;
  title?: string;
  body: string;
  excerpt?: string;
  date?: string;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  authorName: string;
  authorBio: string;
  authorRoles: string[];
}

export interface ContentMeta {
  contentOrder: string[];
}

// GitHub API Types
export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string;
  encoding?: string;
}

export interface GitHubCommit {
  sha: string;
  node_id: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
}
