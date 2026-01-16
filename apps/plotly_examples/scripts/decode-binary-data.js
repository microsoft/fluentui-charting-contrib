/**
 * Binary Data Decoder for Plotly JSON Schemas
 *
 * This script decodes base64-encoded binary data (dtype/bdata) in Plotly schemas.
 * Ported from: /packages/charts/chart-utilities/src/DecodeBase64Data.ts
 *
 * Usage:
 *   node decode-binary-data.js <input-file> [output-file]
 *   node decode-binary-data.js --batch <input-dir> <output-dir>
 */

const fs = require('fs');
const path = require('path');

// Add padding to base64 string if needed
function addBase64Padding(s) {
  const paddingNeeded = (4 - (s.length % 4)) % 4;
  return s + '='.repeat(paddingNeeded);
}

// Check if a string is valid base64
function isBase64(s) {
  if (typeof s !== 'string') {
    return false;
  }

  let padded = s;
  if (s.length % 4 !== 0) {
    padded = addBase64Padding(s);
  }

  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(padded)) {
    return false;
  }

  try {
    Buffer.from(padded, 'base64');
    return true;
  } catch {
    return false;
  }
}

// Decode base64 string to typed array based on dtype
function decodeBase64(value, dtype) {
  value = addBase64Padding(value);

  try {
    const buffer = Buffer.from(value, 'base64');
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    switch (dtype) {
      case 'f8':
        return Array.from(new Float64Array(arrayBuffer));
      case 'i8':
        return Array.from(new Int32Array(arrayBuffer));
      case 'u8':
        return Array.from(new Uint32Array(arrayBuffer));
      case 'i4':
        return Array.from(new Int32Array(arrayBuffer));
      case 'i2':
        return Array.from(new Int16Array(arrayBuffer));
      case 'i1':
        return Array.from(new Int8Array(arrayBuffer));
      default:
        return buffer.toString('utf-8');
    }
  } catch (error) {
    throw new Error(`Failed to decode base64 value: ${error.message}`);
  }
}

// Reshape flat array into multi-dimensional array
function reshapeArray(data, shape) {
  if (shape.length === 1) {
    return data;
  }
  if (shape.length === 2) {
    const [rows, cols] = shape;
    const result = [];
    for (let r = 0; r < rows; r++) {
      result.push(data.slice(r * cols, (r + 1) * cols));
    }
    return result;
  }
  // For higher dimensions, recursively reshape
  const [dim, ...rest] = shape;
  const step = data.length / dim;
  const result = [];
  for (let i = 0; i < dim; i++) {
    result.push(reshapeArray(data.slice(i * step, (i + 1) * step), rest));
  }
  return result;
}

// Check if value is array or typed array
function isArrayOrTypedArray(value) {
  return Array.isArray(value) || ArrayBuffer.isView(value);
}

// Recursively decode bdata in object
function decodeBdataInDict(node) {
  // Primitive → return as-is
  if (node === null || typeof node !== 'object') {
    return node;
  }

  // Array → map recursively
  if (Array.isArray(node)) {
    return node.map(item => decodeBdataInDict(item));
  }

  // Object that directly contains bdata
  if ('bdata' in node && typeof node.bdata === 'string' && isBase64(node.bdata)) {
    const dtype = node.dtype || 'utf-8';
    const decodedBdata = decodeBase64(node.bdata, dtype);
    let shape = node.shape;

    // Parse shape if it is a string
    if (typeof shape === 'string') {
      let parsedShape;
      try {
        parsedShape = JSON.parse(shape);
        if (!isArrayOrTypedArray(parsedShape)) {
          parsedShape = undefined;
        }
      } catch {
        const parts = shape.split(',').map(s => Number(s.trim()));
        if (parts.every(n => !isNaN(n))) {
          parsedShape = parts;
        }
      }
      shape = parsedShape;
    }

    // If shape exists, reshape the decoded bdata
    if (shape && isArrayOrTypedArray(shape)) {
      return reshapeArray(decodedBdata, shape);
    }

    return decodedBdata;
  }

  // Otherwise recursively decode nested keys
  const out = {};
  for (const key of Object.keys(node)) {
    out[key] = decodeBdataInDict(node[key]);
  }

  return out;
}

// Decode all base64 fields in a Plotly schema
function decodeBase64Fields(plotlySchema) {
  const decoded = { ...plotlySchema };
  decoded.data = decodeBdataInDict(plotlySchema.data);
  if (plotlySchema.layout) {
    decoded.layout = decodeBdataInDict(plotlySchema.layout);
  }
  return decoded;
}

// Process a single file
function processFile(inputPath, outputPath) {
  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const schema = JSON.parse(content);
    const decoded = decodeBase64Fields(schema);

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(decoded, null, 2));
      console.log(`Decoded: ${inputPath} -> ${outputPath}`);
    }

    return decoded;
  } catch (error) {
    console.error(`Error processing ${inputPath}: ${error.message}`);
    return null;
  }
}

// Process all files in a directory
function processBatch(inputDir, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.json') && f.startsWith('data_'));

  let processed = 0;
  let skipped = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.json', '_decoded.json'));

    const result = processFile(inputPath, outputPath);
    if (result) {
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`\nBatch complete: ${processed} processed, ${skipped} skipped`);
}

// Check if file has binary data
function hasBinaryData(obj) {
  if (obj === null || typeof obj !== 'object') {
    return false;
  }
  if ('bdata' in obj && 'dtype' in obj) {
    return true;
  }
  if (Array.isArray(obj)) {
    return obj.some(item => hasBinaryData(item));
  }
  return Object.values(obj).some(value => hasBinaryData(value));
}

// Analyze a file and return info about it
function analyzeFile(inputPath) {
  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const schema = JSON.parse(content);

    const info = {
      file: path.basename(inputPath),
      hasBinary: hasBinaryData(schema),
      chartTypes: [],
      traceCount: 0
    };

    if (schema.data && Array.isArray(schema.data)) {
      info.traceCount = schema.data.length;
      info.chartTypes = [...new Set(schema.data.map(trace => trace.type || 'scatter'))];
    }

    return info;
  } catch (error) {
    return { file: path.basename(inputPath), error: error.message };
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Binary Data Decoder for Plotly JSON Schemas

Usage:
  node decode-binary-data.js <input-file>              - Decode and print to stdout
  node decode-binary-data.js <input-file> <output>     - Decode and save to file
  node decode-binary-data.js --batch <in-dir> <out-dir> - Batch process directory
  node decode-binary-data.js --analyze <input-file>    - Analyze file for binary data
  node decode-binary-data.js --analyze-dir <directory> - Analyze all files in directory
`);
  process.exit(0);
}

if (args[0] === '--batch' && args.length >= 3) {
  processBatch(args[1], args[2]);
} else if (args[0] === '--analyze' && args.length >= 2) {
  const info = analyzeFile(args[1]);
  console.log(JSON.stringify(info, null, 2));
} else if (args[0] === '--analyze-dir' && args.length >= 2) {
  const dir = args[1];
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith('data_'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/data_(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/data_(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  const results = {
    total: files.length,
    withBinary: 0,
    withoutBinary: 0,
    chartTypes: {},
    binaryFiles: [],
    nonBinaryFiles: []
  };

  for (const file of files) {
    const info = analyzeFile(path.join(dir, file));
    if (info.hasBinary) {
      results.withBinary++;
      results.binaryFiles.push(file);
    } else {
      results.withoutBinary++;
      results.nonBinaryFiles.push(file);
    }

    for (const type of (info.chartTypes || [])) {
      results.chartTypes[type] = (results.chartTypes[type] || 0) + 1;
    }
  }

  console.log(JSON.stringify(results, null, 2));
} else if (args.length >= 1) {
  const result = processFile(args[0], args[1]);
  if (result && !args[1]) {
    console.log(JSON.stringify(result, null, 2));
  }
}

// Export for use as module
module.exports = {
  decodeBase64Fields,
  decodeBdataInDict,
  hasBinaryData,
  analyzeFile
};
