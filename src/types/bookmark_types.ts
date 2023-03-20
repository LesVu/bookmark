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
