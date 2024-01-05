const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

function getNpmRoot(callback) {
  exec('npm root', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    // Remove the trailing newline character
    const npmRoot = stdout.trim();
    // Call the callback function with the result
    callback(npmRoot);
  });
}

// Usage example
getNpmRoot((npmRoot) => {
  console.log(`The npm root directory is: ${npmRoot}`);
  return npmRoot;
});

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
  core.setOutput('dirPath', dirPath);
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
                    core.setOutput("Error",  `Error writing file to disk: ${err}`);
                }
            });
        }
    });
}

const testSetupRewire = () => {
  const npmRoot = getNpmRoot();
  readDirectory(`${npmRoot}/@fluentui/react-charting/lib-commonjs/`);
  readDirectoryDeep(`${npmRoot}/@fluentui/react-charting/lib-commonjs/components/`);
  // const chart = require('~/fluentui-charting-contrib/tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/components/AreaChart/AreaChart.base.js');
  // core.setOutput("ModifiedChart", chart.toString());
  const indexFilePath = `${npmRoot}/@fluentui/react-charting/lib-commonjs/index.js`;
  setupIndexFile(indexFilePath, null);
  // const indexFileContents = require(indexFilePath);
  // core.setOutput("ModifiedIndex", indexFileContents.toString());
};

testSetupRewire();
module.exports=testSetupRewire;
