const core = require('@actions/core');

const fs = require('fs');
const path = require('path');

async function readDirectoryDeep(dirPath) {
  const items = await fs.readdirSync(dirPath);

  items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
          readDirectoryDeep(fullPath);
      } else {
          updatedFileDeep(fullPath);
      }
  });
}

// Read the file
async function updatedFileDeep(filePath) {
  let data = await fs.readFileSync(filePath, 'utf8'); 
  let matches = data.match(/.*=.*d3.*(\n.*?)*(?=var|$)/g);
  if (matches != null && matches.length > 0) {
    matches.forEach(match => {
      if (match !=null) {
        data = data.replace(match, '');
      }
    });
    // Write the file back
    if (data != null && data != '' && data != undefined) {
      await fs.writeFileSync(filePath, data);
    }
  }
};

async function readDirectory(dirPath) {
  const items = await fs.readdirSync(dirPath);

  items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
          readDirectory(fullPath);
      } else {
          updatedFile(fullPath);
      }
  });
}

async function updatedFile(filePath) {
  let data = await fs.readFileSync(filePath, 'utf8'); 
  // Replace the words
  data = data.replace(/require\("d3-scale"\)/g, "import('d3-scale')");
  data = data.replace(/require\("d3-shape"\)/g, "import('d3-shape')");
  data = data.replace(/require\("d3-array"\)/g, "import('d3-array')");
  data = data.replace(/require\("d3-selection"\)/g, "import('d3-selection')");
  data = data.replace(/require\("d3-format"\)/g, "import('d3-format')");
  data = data.replace(/require\("d3-axis"\)/g, "import('d3-axis')");
  data = data.replace(/require\("d3-time"\)/g, "import('d3-time')");
  data = data.replace(/require\("d3-time-format"\)/g, "import('d3-time-format')");
  // Write the file back
  if (data != null && data != '' && data != undefined) {
    await fs.writeFileSync(filePath, data);
  }
};

function setupIndexFile(indexFilePath, fileName) {
    fs.readFile(indexFilePath, 'utf8', (err, data) => {
        if (!err) {
            // Replace the words
            let result = data.replace(/.*exportStar.*/g, '');            
            // Write the file back
            fs.writeFile(indexFilePath, result, 'utf8', err => {
                if (err) {
                    console.error(`Error writing file to disk: ${err}`);
                }
            });
        }
    });
}

const testSetupRewire = () => {
  readDirectory('tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/');
  readDirectoryDeep('tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/components/');
  const chart = require('tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/components/AreaChart/AreaChart.base.js');
  core.setOutput("chart", chart.toString());
  const indexFilePath = 'tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/index.js';
  setupIndexFile(indexFilePath, null);
};

testSetupRewire();
module.exports=testSetupRewire;
