const fs = require('fs');

async function makePrivateFunctionsPublic(filePath) {
  let data = await fs.readFileSync(filePath, 'utf8');
  // Replace the words
  data = data.replace(/\bprivate\b/g, "public");
  // Write the file back
  if (data != null && data != '' && data != undefined) {
    await fs.writeFileSync(filePath, data);
  }
};

async function readDirectory(dirPath) {
  const items = await fs.readdirSync(dirPath);

  items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      if (fullPath.includes('.base.')) {
      const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            readDirectory(fullPath);
        } else {
          makePrivateFunctionsPublic(fullPath);
        }
      }
  });
}

readDirectory('../../repo1/packages/react-charting/src/components/')