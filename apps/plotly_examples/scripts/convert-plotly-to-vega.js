/**
 * Plotly to Vega-Lite Converter
 *
 * Converts Plotly JSON schemas to Vega-Lite format.
 * Handles: line, area, bar, scatter, pie, heatmap, histogram
 *
 * Usage:
 *   node convert-plotly-to-vega.js <input-file> [output-file]
 *   node convert-plotly-to-vega.js --batch <input-dir> <output-dir> [--start N] [--end M]
 */

const fs = require('fs');
const path = require('path');
const { decodeBase64Fields, hasBinaryData } = require('./decode-binary-data.js');

// Unsupported chart types
const UNSUPPORTED_TYPES = [
  'scatter3d', 'surface', 'mesh3d',
  'scattergeo', 'choropleth', 'scattermapbox',
  'sankey', 'violin', 'carpet', 'contourcarpet',
  'parcoords', 'scatterternary', 'scattercarpet'
];

// Get title from layout
function getTitle(layout) {
  if (!layout) return null;
  if (typeof layout.title === 'string') return layout.title;
  if (layout.title && layout.title.text) return layout.title.text;
  return null;
}

// Get axis title
function getAxisTitle(layout, axis) {
  if (!layout || !layout[axis]) return null;
  const axisConfig = layout[axis];
  if (typeof axisConfig.title === 'string') return axisConfig.title;
  if (axisConfig.title && axisConfig.title.text) return axisConfig.title.text;
  return null;
}

// Transform Plotly x/y arrays to Vega-Lite data.values format
function transformData(traces) {
  const values = [];

  for (const trace of traces) {
    const seriesName = trace.name || 'Series';
    const x = trace.x || [];
    const y = trace.y || [];
    const labels = trace.labels || [];
    const vals = trace.values || [];

    if (trace.type === 'pie') {
      // Pie chart data
      for (let i = 0; i < labels.length; i++) {
        values.push({
          category: labels[i],
          value: vals[i] || 0
        });
      }
    } else if (x.length > 0 && y.length > 0) {
      // Standard x/y data
      const maxLen = Math.min(x.length, y.length);
      for (let i = 0; i < maxLen; i++) {
        values.push({
          x: x[i],
          y: y[i],
          series: seriesName
        });
      }
    }
  }

  return values;
}

// Determine Vega-Lite mark type from Plotly trace
function getMarkType(trace) {
  const type = trace.type || 'scatter';
  const mode = trace.mode || '';
  const fill = trace.fill || '';

  if (type === 'bar') return 'bar';
  if (type === 'pie') return 'arc';
  if (type === 'heatmap') return 'rect';
  if (type === 'histogram') return 'bar';
  if (type === 'box') return 'boxplot';
  if (type === 'scatter' || type === 'scattergl' || type === 'line') {
    if (fill === 'tozeroy' || fill === 'tonexty' || fill === 'toself') {
      return 'area';
    }
    if (mode.includes('markers') && !mode.includes('lines')) {
      return 'point';
    }
    return 'line';
  }
  if (type === 'scatterpolar' || type === 'scatterpolargl') {
    return 'arc'; // Will need special handling
  }
  if (type === 'barpolar') return 'arc';
  if (type === 'indicator') return 'arc';
  if (type === 'funnel' || type === 'funnelarea') return 'bar';
  if (type === 'table') return 'text';

  return 'line'; // Default
}

// Detect X axis type
function detectXType(values) {
  if (values.length === 0) return 'nominal';
  const firstX = values[0].x;
  if (typeof firstX === 'number') return 'quantitative';
  if (typeof firstX === 'string') {
    // Check if it looks like a date
    if (/^\d{4}-\d{2}-\d{2}/.test(firstX) || /^\d{4}$/.test(firstX)) {
      return 'temporal';
    }
    // Check if it's purely numeric string
    if (!isNaN(parseFloat(firstX))) return 'quantitative';
  }
  return 'nominal';
}

// Convert standard chart (line, bar, scatter, area)
function convertStandardChart(plotlySchema) {
  const traces = plotlySchema.data || [];
  const layout = plotlySchema.layout || {};

  // Check for unsupported types
  for (const trace of traces) {
    if (UNSUPPORTED_TYPES.includes(trace.type)) {
      return { error: `Unsupported chart type: ${trace.type}` };
    }
  }

  const values = transformData(traces);
  if (values.length === 0) {
    return { error: 'No data to convert' };
  }

  // Limit data size for large datasets
  let limitedValues = values;
  if (values.length > 500) {
    // Sample data or take first 500 points
    limitedValues = values.slice(0, 500);
  }

  const markType = getMarkType(traces[0]);
  const hasSeries = traces.length > 1;
  const xType = detectXType(limitedValues);

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 500,
    "height": 300,
    "data": { "values": limitedValues }
  };

  // Add title if present
  const title = getTitle(layout);
  if (title) vegaSpec.title = title;

  // Set mark
  if (markType === 'area') {
    vegaSpec.mark = { "type": "area", "line": true, "opacity": 0.7 };
  } else {
    vegaSpec.mark = markType;
  }

  // Build encoding
  const encoding = {
    "x": {
      "field": "x",
      "type": xType
    },
    "y": {
      "field": "y",
      "type": "quantitative"
    }
  };

  // Add axis titles
  const xTitle = getAxisTitle(layout, 'xaxis');
  const yTitle = getAxisTitle(layout, 'yaxis');
  if (xTitle) encoding.x.title = xTitle;
  if (yTitle) encoding.y.title = yTitle;

  // Add color encoding for multi-series
  if (hasSeries) {
    encoding.color = {
      "field": "series",
      "type": "nominal",
      "title": "Series"
    };
  }

  // Add tooltip
  encoding.tooltip = [
    { "field": "x", "title": xTitle || "X" },
    { "field": "y", "title": yTitle || "Y" }
  ];
  if (hasSeries) {
    encoding.tooltip.push({ "field": "series", "title": "Series" });
  }

  vegaSpec.encoding = encoding;

  return vegaSpec;
}

// Convert pie/donut chart
function convertPieChart(plotlySchema) {
  const traces = plotlySchema.data || [];
  const layout = plotlySchema.layout || {};
  const trace = traces[0];

  if (!trace || !trace.labels || !trace.values) {
    return { error: 'Invalid pie chart data' };
  }

  const values = [];
  for (let i = 0; i < trace.labels.length; i++) {
    values.push({
      category: trace.labels[i],
      value: trace.values[i] || 0
    });
  }

  // Limit to top 10 categories if too many
  let limitedValues = values;
  if (values.length > 12) {
    limitedValues = values.slice(0, 10);
    const otherSum = values.slice(10).reduce((sum, v) => sum + v.value, 0);
    if (otherSum > 0) {
      limitedValues.push({ category: "Other", value: otherSum });
    }
  }

  const isDonut = trace.hole && trace.hole > 0;
  const innerRadius = isDonut ? Math.round(trace.hole * 100) : 0;

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 400,
    "height": 400,
    "data": { "values": limitedValues },
    "mark": {
      "type": "arc",
      "innerRadius": innerRadius
    },
    "encoding": {
      "theta": {
        "field": "value",
        "type": "quantitative"
      },
      "color": {
        "field": "category",
        "type": "nominal",
        "title": "Category"
      },
      "tooltip": [
        { "field": "category", "title": "Category" },
        { "field": "value", "title": "Value" }
      ]
    }
  };

  const title = getTitle(layout);
  if (title) vegaSpec.title = title;

  return vegaSpec;
}

// Convert heatmap
function convertHeatmap(plotlySchema) {
  const traces = plotlySchema.data || [];
  const layout = plotlySchema.layout || {};
  const trace = traces[0];

  if (!trace || !trace.z) {
    return { error: 'Invalid heatmap data' };
  }

  const z = trace.z;
  const x = trace.x || [];
  const y = trace.y || [];

  const values = [];
  for (let i = 0; i < z.length; i++) {
    const row = z[i];
    if (!Array.isArray(row)) continue;
    for (let j = 0; j < row.length; j++) {
      values.push({
        x: x[j] !== undefined ? x[j] : j,
        y: y[i] !== undefined ? y[i] : i,
        value: row[j]
      });
    }
  }

  // Limit size
  let limitedValues = values;
  if (values.length > 1000) {
    limitedValues = values.slice(0, 1000);
  }

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 400,
    "height": 400,
    "data": { "values": limitedValues },
    "mark": "rect",
    "encoding": {
      "x": {
        "field": "x",
        "type": "ordinal"
      },
      "y": {
        "field": "y",
        "type": "ordinal"
      },
      "color": {
        "field": "value",
        "type": "quantitative",
        "scale": { "scheme": "blues" }
      },
      "tooltip": [
        { "field": "x", "title": "X" },
        { "field": "y", "title": "Y" },
        { "field": "value", "title": "Value" }
      ]
    }
  };

  const title = getTitle(layout);
  if (title) vegaSpec.title = title;

  return vegaSpec;
}

// Convert histogram
function convertHistogram(plotlySchema) {
  const traces = plotlySchema.data || [];
  const layout = plotlySchema.layout || {};
  const trace = traces[0];

  if (!trace || (!trace.x && !trace.y)) {
    return { error: 'Invalid histogram data' };
  }

  // Histograms can be on x or y
  const dataArray = trace.x || trace.y || [];
  const isHorizontal = !!trace.y && !trace.x;

  const values = dataArray.map(v => ({ value: v }));

  // Limit size
  let limitedValues = values;
  if (values.length > 1000) {
    limitedValues = values.slice(0, 1000);
  }

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 500,
    "height": 300,
    "data": { "values": limitedValues },
    "mark": "bar",
    "encoding": {
      "x": {
        "field": "value",
        "bin": true,
        "type": "quantitative"
      },
      "y": {
        "aggregate": "count",
        "type": "quantitative",
        "title": "Count"
      }
    }
  };

  const title = getTitle(layout);
  if (title) vegaSpec.title = title;

  return vegaSpec;
}

// Convert polar chart (scatterpolar)
function convertPolarChart(plotlySchema) {
  const traces = plotlySchema.data || [];
  const layout = plotlySchema.layout || {};

  const values = [];
  for (const trace of traces) {
    const r = trace.r || [];
    const theta = trace.theta || [];
    const seriesName = trace.name || 'Series';

    for (let i = 0; i < Math.min(r.length, theta.length); i++) {
      values.push({
        r: r[i],
        theta: theta[i],
        series: seriesName
      });
    }
  }

  if (values.length === 0) {
    return { error: 'No polar data to convert' };
  }

  // Limit size
  let limitedValues = values;
  if (values.length > 500) {
    limitedValues = values.slice(0, 500);
  }

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "width": 400,
    "height": 400,
    "data": { "values": limitedValues },
    "mark": { "type": "arc", "innerRadius": 0 },
    "encoding": {
      "theta": {
        "field": "theta",
        "type": "quantitative",
        "scale": { "domain": [0, 360] }
      },
      "radius": {
        "field": "r",
        "type": "quantitative"
      },
      "color": {
        "field": "series",
        "type": "nominal"
      },
      "tooltip": [
        { "field": "theta", "title": "Angle" },
        { "field": "r", "title": "Radius" },
        { "field": "series", "title": "Series" }
      ]
    }
  };

  const title = getTitle(layout);
  if (title) vegaSpec.title = title;

  return vegaSpec;
}

// Main conversion function
function convertPlotlyToVega(plotlySchema) {
  // Decode binary data if present
  if (hasBinaryData(plotlySchema)) {
    plotlySchema = decodeBase64Fields(plotlySchema);
  }

  const traces = plotlySchema.data || [];
  if (traces.length === 0) {
    return { error: 'No traces in schema' };
  }

  const primaryType = traces[0].type || 'scatter';

  // Check for annotation-only (empty data)
  const hasData = traces.some(t =>
    (t.x && t.x.length > 0) ||
    (t.y && t.y.length > 0) ||
    (t.values && t.values.length > 0) ||
    (t.z && t.z.length > 0) ||
    (t.r && t.r.length > 0)
  );

  if (!hasData) {
    return { error: 'Annotation-only chart (no data)' };
  }

  // Route to appropriate converter
  if (primaryType === 'pie') {
    return convertPieChart(plotlySchema);
  }
  if (primaryType === 'heatmap') {
    return convertHeatmap(plotlySchema);
  }
  if (primaryType === 'histogram' || primaryType === 'histogram2d') {
    return convertHistogram(plotlySchema);
  }
  if (primaryType === 'scatterpolar' || primaryType === 'scatterpolargl' || primaryType === 'barpolar') {
    return convertPolarChart(plotlySchema);
  }
  if (UNSUPPORTED_TYPES.includes(primaryType)) {
    return { error: `Unsupported chart type: ${primaryType}` };
  }

  return convertStandardChart(plotlySchema);
}

// Process a single file
function processFile(inputPath, outputPath) {
  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const schema = JSON.parse(content);
    const result = convertPlotlyToVega(schema);

    if (result.error) {
      console.log(`SKIP ${path.basename(inputPath)}: ${result.error}`);
      return { success: false, error: result.error };
    }

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log(`OK   ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
    }

    return { success: true, result };
  } catch (error) {
    console.error(`ERR  ${path.basename(inputPath)}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Batch process files
function processBatch(inputDir, outputDir, startNum = 1, endNum = 9999) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.json') && f.startsWith('data_'))
    .filter(f => {
      const num = parseInt(f.match(/data_(\d+)/)?.[1] || '0');
      return num >= startNum && num <= endNum;
    })
    .sort((a, b) => {
      const numA = parseInt(a.match(/data_(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/data_(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  let converted = 0;
  let skipped = 0;
  let errors = 0;
  const skipReasons = {};

  console.log(`Processing ${files.length} files from ${startNum} to ${endNum}...\n`);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = file.replace('.json', '_vega.json');
    const outputPath = path.join(outputDir, outputName);

    // Skip if already converted
    if (fs.existsSync(outputPath)) {
      console.log(`EXIST ${file}`);
      converted++;
      continue;
    }

    const result = processFile(inputPath, outputPath);
    if (result.success) {
      converted++;
    } else {
      if (result.error.includes('Unsupported') || result.error.includes('Annotation')) {
        skipped++;
        skipReasons[result.error] = (skipReasons[result.error] || 0) + 1;
      } else {
        errors++;
      }
    }
  }

  console.log(`\n========== SUMMARY ==========`);
  console.log(`Converted: ${converted}`);
  console.log(`Skipped:   ${skipped}`);
  console.log(`Errors:    ${errors}`);
  console.log(`\nSkip reasons:`);
  for (const [reason, count] of Object.entries(skipReasons)) {
    console.log(`  ${reason}: ${count}`);
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
Plotly to Vega-Lite Converter

Usage:
  node convert-plotly-to-vega.js <input-file>                    - Convert and print to stdout
  node convert-plotly-to-vega.js <input-file> <output-file>      - Convert and save
  node convert-plotly-to-vega.js --batch <in-dir> <out-dir>      - Batch convert all
  node convert-plotly-to-vega.js --batch <in-dir> <out-dir> --start 333 --end 400
`);
  process.exit(0);
}

if (args[0] === '--batch' && args.length >= 3) {
  let startNum = 1;
  let endNum = 9999;

  const startIdx = args.indexOf('--start');
  if (startIdx !== -1 && args[startIdx + 1]) {
    startNum = parseInt(args[startIdx + 1]);
  }

  const endIdx = args.indexOf('--end');
  if (endIdx !== -1 && args[endIdx + 1]) {
    endNum = parseInt(args[endIdx + 1]);
  }

  processBatch(args[1], args[2], startNum, endNum);
} else if (args.length >= 1) {
  const result = processFile(args[0], args[1]);
  if (result.success && !args[1]) {
    console.log(JSON.stringify(result.result, null, 2));
  }
}

module.exports = { convertPlotlyToVega };
