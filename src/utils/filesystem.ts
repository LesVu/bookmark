import fs from 'fs';

function readFile(fileName: fs.PathOrFileDescriptor) {
  fs.readFile(fileName, async (err, data) => {
    if (err) {
      throw new Error('FileSystem Problem');
    }
    if (fileName.toString()) {
    }
  });
}
