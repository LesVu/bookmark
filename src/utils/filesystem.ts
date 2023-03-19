import fs from 'fs';
import path from 'path';

export function readFile(
  fileName: fs.PathOrFileDescriptor
): string | object | undefined {
  if (!fs.existsSync(path.resolve(fileName as string))) {
    if (!fs.existsSync(path.resolve('./static'))) {
      console.log(`Mkdir static`);
      fs.mkdirSync(path.resolve('./static'), {
        recursive: true,
      });
    }
    throw new Error(
      'File not exist. Place your bookmarks.html into static folder.'
    );
  }
  let extension = fileName.toString().match(/\.([^\./\?]+)($|\?)/);
  try {
    let buffer = fs.readFileSync(fileName, { encoding: 'utf8' });
    if (!extension) {
      throw new Error('File name problem.');
    }
    if (extension[1] == 'json') {
      return JSON.parse(buffer.toString()) as object;
    }
    return buffer;
  } catch (err) {
    console.log(err);
    return;
  }
}

export function writeFile(
  fileName: fs.PathOrFileDescriptor,
  buffer: object[] | string
) {
  let output: string;

  if (!fs.existsSync(path.resolve('./static'))) {
    console.log(`Mkdir static`);
    fs.mkdirSync(path.resolve('./static'), {
      recursive: true,
    });
  }

  try {
    if (typeof buffer === 'object') {
      output = JSON.stringify(buffer, null, 2);
    } else {
      output = buffer;
    }
    fs.writeFileSync(fileName, output);
    console.log(`Successfully write to ${fileName}`);
  } catch (err) {
    console.error(err);
  }
}
