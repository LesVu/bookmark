import fs from 'fs';
import TOML from '@ltd/j-toml';
import { Config } from '../types/bookmark_types';

export function sortByKey<T, K extends keyof T>(array: T[], key: K): T[] {
  return array.sort(function (a, b) {
    var x = a[key];
    var y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}

export function readConfig() {
  try {
    let config_buffer = fs.readFileSync('./config.toml', {
      encoding: 'utf8',
    });
    let config: Config = TOML.parse(config_buffer);
    return config;
  } catch (err) {
    console.log('No config available using default config');
    const default_config_buffer = `[exclude]
# Website to not sort
website = []

[website]
# How many in a folder before increment
folder_size = 50

# Minimum number to not sort
folder_exclude_size = 10`;
    fs.writeFileSync('./config.toml', default_config_buffer);
    let default_config: Config = TOML.parse(default_config_buffer);
    return default_config;
  }
}
