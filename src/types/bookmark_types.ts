export interface Bookmark_Item {
  href: string;
  name: string;
}

export interface Config {
  exclude: {
    website: string[];
  };
  website: {
    folder_size: string;
    folder_exclude_size: string;
  };
}
