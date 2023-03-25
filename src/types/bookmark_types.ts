import { parse } from '@ltd/j-toml';
export interface Bookmark_Item {
  href: string;
  name: string;
}

export interface Bookmark {
  website: string;
  children: Array<
    | {
        website: string;
        children: Bookmark_Item[];
      }
    | Bookmark_Item
  >;
}

type Content = ReturnType<typeof parse>;

export interface Config extends Content {
  exclude?: {
    website: string[];
  };
  website?: {
    folder_size: string;
    folder_exclude_size: string;
  };
}

export interface puppeteerOption {
  url: string;
  waiting_time?: number;
  user_agent?: string;
}

export interface Tags {
  id: number;
  type: string;
  name: string;
  url: string;
  count: number;
}

interface Images {
  pages: Array<{ t: string; w: number; h: number }>;
  cover: { t: string; w: number; h: number };
  thumbnail: { t: string; w: number; h: number };
}

export interface APIBook {
  title: {
    english: string;
    japanese: string;
    pretty: string;
  };
  id: number | string;

  media_id: number | string;

  num_favorites: number | string;

  num_pages: number | string;

  scanlator: string;

  upload_date: number | string;

  images: Images;

  tags: Array<Tags>;
}
