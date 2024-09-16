import { parse } from '@ltd/j-toml';
export interface Bookmark {
  href: string;
  name: string;
}

export interface Bookmarks {
  website: string;
  children: Array<Bookmarks_Parts | Bookmark | Bookmarks>;
}

export interface Bookmarks_Parts {
  website: string;
  children: Bookmark[];
}

type Content = ReturnType<typeof parse>;

export interface Config extends Content {
  exclude: {
    website: string[];
  };
  website: {
    folderSize: string;
    folderExcludeSize: string;
    nh_tags: string[];
  };
}

export interface puppeteerOption {
  url: string;
  waiting_time?: number;
  user_agent?: string;
}

interface Tags {
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
