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
