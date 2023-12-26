const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const core = require('@actions/core');

function getPWD(callback) {
  try {
    const osType = core.getInput('osType');
    console.log(`The value of osType is: ${osType}`);

    if (osType === 'windows-latest') {
      exec('cd', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        // Remove the trailing newline character
        const pwd = stdout.trim();
        // Call the callback function with the result
        callback(pwd);
      });
      return;
    } else if (osType === 'ubuntu-latest' || osType === 'macos-latest') {
      exec('echo $PWD', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        // Remove the trailing newline character
        const pwd = stdout.trim();
        // Call the callback function with the result
        callback(pwd);
      });
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

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

const changeFunctionVisibility = async () => {
  getPWD((pwd) => {
    console.log(`The pwd is: ${pwd}`);
    readDirectory(`${pwd}/repo1/packages/react-charting/src/components/`);
  });
}

changeFunctionVisibility();
