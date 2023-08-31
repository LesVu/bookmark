'use-strict';

import './popup.css';
import { extractBookmark, sortBookmark } from './bookmark';

const button = document.getElementById('toggleGen');
const gen = document.getElementById('gen');
const input = document.getElementById('file');
const preview = document.getElementById('preview');
const submit = document.getElementById('submit');
const sort = document.getElementById('sort');

button.addEventListener('click', () => {
  gen.classList.toggle('hidden');
  if (gen.classList.contains('hidden')) {
    button.innerHTML = 'Show Generator';
  } else button.innerHTML = 'Hide Generator';
});

input.addEventListener('change', () => {
  while (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }
  const curFiles = input.files;
  if (curFiles.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'No files currently selected for upload';
    preview.appendChild(para);
  } else {
    for (const file of curFiles) {
      const para = document.createElement('p');
      para.textContent = `File name ${file.name}, file size ${returnFileSize(
        file.size
      )}.`;
      preview.appendChild(para);
    }
  }
});

submit.addEventListener('click', async () => {
  const curFiles = input.files;
  if (curFiles.length === 0) {
    const para = document.createElement('p');
    para.textContent = 'Error:No files currently selected for upload';
    preview.appendChild(para);
  } else {
    const file = input.files[0];
    async function parseHTMLFile(file) {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = (event) =>
          resolve(sortBookmark(extractBookmark(event.target.result)));
        fileReader.onerror = (error) => reject(error);
        fileReader.readAsText(file);
      });
    }
    let objectJson = await parseHTMLFile(file);
  }
});

sort.addEventListener('click', () => {
  if (confirm('Sort Bookmarks?')) {
    chrome.bookmarks.getTree((result) => {
      console.log(result);
      sortBookmark(result);
    });
  } else {
    return;
  }
});

function returnFileSize(number) {
  if (number < 1024) {
    return `${number} bytes`;
  } else if (number >= 1024 && number < 1048576) {
    return `${(number / 1024).toFixed(1)} KB`;
  } else if (number >= 1048576) {
    return `${(number / 1048576).toFixed(1)} MB`;
  }
}
