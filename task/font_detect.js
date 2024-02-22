const fontkit = require('fontkit');
const fs = require('fs');

// 替换此路径为您的WOFF2文件的实际路径
const fontPath = './1d47201e3a69f8050a7f3f1300e11104.woff';

fs.readFile(fontPath, (err, buffer) => {
  if (err) {
    return console.error('Error reading font file:', err);
  }

  const font = fontkit.create(buffer);
  console.log('Font weight:', font['OS/2'].usWeightClass);
});
