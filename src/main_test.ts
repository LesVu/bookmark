import { expect } from 'jsr:@std/expect';
import { extractBookmarks, sortBookmarks, getWebsite } from './utils/bookmark.ts';
import { Bookmark, Bookmarks } from './types/bookmark_types.ts';

Deno.test('should extract bookmarks from HTML string', () => {
  const html = '<DL><DT><A HREF="https://example.com" ADD_DATE="1681709291">Example</A></DT></DL>';
  const result = extractBookmarks(html);
  expect(result).toEqual([{ href: 'https://example.com', name: 'Example' }]);
});

Deno.test('should remove duplicate bookmarks by default', () => {
  const html =
    '<DL><DT><A HREF="https://example.com" ADD_DATE="1681709291">Example</A></DT><DT><A HREF="https://example.com" ADD_DATE="1681709291">Example</A></DT></DL>';
  const result = extractBookmarks(html);
  expect(result).toEqual([{ href: 'https://example.com', name: 'Example' }]);
});

Deno.test('should not remove duplicate bookmarks if `duplicate` is set to `true`', () => {
  const html =
    '<DL><DT><A HREF="https://example.com" ADD_DATE="1681709291">Example</A></DT><DT><A HREF="https://example.com" ADD_DATE="1681709291">Example</A></DT></DL>';
  const result = extractBookmarks(html, true);
  expect(result).toEqual([
    { href: 'https://example.com', name: 'Example' },
    { href: 'https://example.com', name: 'Example' },
  ]);
});

Deno.test('should return an empty array if no bookmarks are found', () => {
  const html = '<DL></DL>';
  const result = extractBookmarks(html);
  expect(result).toEqual([]);
});

Deno.test('should return an empty list when input is empty', () => {
  const bookmarks: Bookmark[] = [];
  const result = sortBookmarks(bookmarks);
  expect(result).toEqual([{ website: 'none', children: [] }]);
});

Deno.test('should return a list with "none" folder when bookmarks have no website', () => {
  const bookmarks: Bookmark[] = [{ href: '', name: '' }];
  const result = sortBookmarks(bookmarks);
  expect(result).toEqual([{ website: 'none', children: [] }]);
});

Deno.test('should exclude websites in exclude list', () => {
  const bookmarks: Bookmark[] = [
    {
      href: 'https://example.com',
      name: '',
    },
    {
      href: 'https://example2.com',
      name: '',
    },
  ];
  const config = {
    exclude: { website: ['example'] },
    website: { folderSize: '0', folderExcludeSize: '0', nh_tags: [] },
  };
  const result = sortBookmarks(bookmarks, config);
  expect(result).toEqual([
    {
      website: 'example2',
      children: [{ href: 'https://example2.com', name: '' }],
    },
    {
      children: [
        {
          href: 'https://example.com',
          name: '',
        },
      ],
      website: 'none',
    },
  ]);
});

Deno.test('should chunk bookmarks by folder size', () => {
  const bookmarks: Bookmark[] = [
    {
      href: 'https://example.com',
      name: '',
    },
    {
      href: 'https://example.com',
      name: '',
    },
    {
      href: 'https://example.com',
      name: '',
    },
  ];
  const config = {
    exclude: { website: [] },
    website: { folderSize: '2', folderExcludeSize: '0', nh_tags: [] },
  };
  const result = sortBookmarks(bookmarks, config);
  expect(result).toEqual([
    {
      children: [
        {
          children: [
            {
              href: 'https://example.com',
              name: '',
            },
            {
              href: 'https://example.com',
              name: '',
            },
          ],
          website: 'example 0',
        },
        {
          children: [
            {
              href: 'https://example.com',
              name: '',
            },
          ],
          website: 'example 1',
        },
      ],
      website: 'example',
    },
    {
      children: [],
      website: 'none',
    },
  ]);
});

Deno.test('should return website name with top-level domain', () => {
  const url = 'https://example.com';
  expect(getWebsite(url)).toBe('example');
});

Deno.test('should return undefined with URL not having top-level domain', () => {
  const url = 'https://example';
  expect(getWebsite(url)).toBe('example');
});

Deno.test('should remove protocol from URL', () => {
  const url = 'http://example.com';
  expect(getWebsite(url)).toBe('example');
});

Deno.test('should return website name without protocol', () => {
  const url = 'example.com';
  expect(getWebsite(url)).toBe('example');
});

Deno.test('should remove subdomain from URL', () => {
  const url = 'https://sub.example.com';
  expect(getWebsite(url)).toBe('example');
});

Deno.test('should ignore path in URL', () => {
  const url = 'https://example.com/path/to/resource';
  expect(getWebsite(url)).toBe('example');
});
