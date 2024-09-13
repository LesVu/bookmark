import fs from 'fs';
import path from 'path';

export function readFile<T>(fileName: fs.PathOrFileDescriptor): T | undefined {
  const filePath = path.resolve(fileName as string);

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileExtensionMatch = fileName.toString().match(/\.(.+?)($|\?)/);

  if (!fileExtensionMatch) {
    throw new Error(`File name problem: ${fileName}`);
  }

  const fileExtension = fileExtensionMatch[1];
  const fileBuffer = fs.readFileSync(fileName, { encoding: 'utf8' });

  if (fileExtension === 'json') {
    return JSON.parse(fileBuffer) as T;
  }

  return fileBuffer as unknown as T;
}

export function writeFile(fileName: fs.PathOrFileDescriptor, data: object[] | string): void {
  const output = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;

  const directory = path.dirname(fileName as string);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  try {
    fs.writeFileSync(fileName, output);
  } catch (error) {
    throw new Error(`Failed to write to ${fileName}: ${error.message}`);
  }
}
