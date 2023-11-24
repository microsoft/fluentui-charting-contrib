/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 70:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(768);
const github = __nccwpck_require__(438);
const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);

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

// Read and update the file
async function updatedFileDeep(filePath) {
  let data = await fs.readFileSync(filePath, 'utf8'); 
  // Remove all occurances and expressions using d3 variables
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
                    core.setOutput("Error",  `Error writing file to disk: ${err}`);
                }
            });
        }
    });
}

const testSetupRewire = () => {
  readDirectory('/home/runner/work/fluentui-charting-contrib/fluentui-charting-contrib/tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/');
  readDirectoryDeep('/home/runner/work/fluentui-charting-contrib/fluentui-charting-contrib/tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/components/');
  const indexFilePath = '/home/runner/work/fluentui-charting-contrib/fluentui-charting-contrib/tools/UnitTestApp/node_modules/@fluentui/react-charting/lib-commonjs/index.js';
  setupIndexFile(indexFilePath, null);
};

testSetupRewire();
module.exports=testSetupRewire;


/***/ }),

/***/ 768:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 438:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(70);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;