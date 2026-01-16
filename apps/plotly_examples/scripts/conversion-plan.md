# Plan: Convert Remaining 701 Plotly Schemas to Vega-Lite

## Current Status
- **Total Source Files:** 1,024
- **Successfully Converted:** 323 (31.5%)
- **Remaining to Convert:** 701 (68.5%)

## Root Causes of Skipped Files

| Reason | Count | Solvable? |
|--------|-------|-----------|
| Binary encoded data (dtype/bdata) | ~500+ | YES - Decoder exists |
| Polar charts (scatterpolar, barpolar) | ~50+ | YES - Vega-Lite supports theta/radius |
| Histograms | ~30+ | YES - Vega-Lite supports bin:true |
| Annotation-only visualizations | ~50+ | YES - Layered text marks |
| 3D charts (scatter3d, surface) | ~20+ | NO - Not supported |
| Geographic (scattergeo, choropleth) | ~20+ | NO - Requires Vega (not Lite) |
| Sankey diagrams | ~10+ | NO - Not supported |
| Box/Violin plots | ~10+ | PARTIAL - Box supported, violin not |
| Gauge/Indicator | ~10+ | YES - Arc with partial fill |
| Funnel charts | ~10+ | YES - Bar chart approximation |
| Table traces | ~5+ | YES - Text marks in grid |

**Expected new conversions: ~630 files → Total coverage: ~93%**

---

## Key Resources Discovered

### 1. Binary Data Decoder
**Location:** `/home/atisjai/dev/fluentui/packages/charts/chart-utilities/src/DecodeBase64Data.ts`

```typescript
// Main entry point
decodeBase64Fields(plotlySchema: PlotlySchema): PlotlySchema

// Supported dtype values:
// f8 → Float64Array, i4 → Int32Array, i2 → Int16Array, i1 → Int8Array
```

### 2. Vega-Lite Polar Chart Support
**Examples in:** `apps/declarative_chart_examples/src/data/vega/`
- `donutchart.json` - Arc mark with theta encoding
- `market_share_donut.json` - innerRadius/outerRadius control

```json
{
  "mark": { "type": "arc", "innerRadius": 50 },
  "encoding": {
    "theta": { "field": "value", "type": "quantitative" },
    "radius": { "field": "r", "type": "quantitative" },
    "color": { "field": "category", "type": "nominal" }
  }
}
```

### 3. Vega-Lite Histogram Support
**Examples in:** `apps/declarative_chart_examples/src/data/vega/`
- `histogram_basic_count.json` - bin:true with count aggregate
- `histogram_custom_bins.json` - maxbins configuration

```json
{
  "mark": "bar",
  "encoding": {
    "x": { "field": "value", "bin": true, "type": "quantitative" },
    "y": { "aggregate": "count", "type": "quantitative" }
  }
}
```

---

## Implementation Plan

### Phase 1: Create Binary Decoder Script
**Create:** `apps/declarative_chart_examples/scripts/decode-binary-data.js`

Port the TypeScript decoder to a Node.js script:
```javascript
const fs = require('fs');

function decodeBase64(value, dtype) {
  const buffer = Buffer.from(value, 'base64');
  switch (dtype) {
    case 'f8': return Array.from(new Float64Array(buffer.buffer));
    case 'i4': return Array.from(new Int32Array(buffer.buffer));
    case 'i2': return Array.from(new Int16Array(buffer.buffer));
    case 'i1': return Array.from(new Int8Array(buffer.buffer));
    default: return buffer.toString();
  }
}

function decodeBdataRecursive(obj) {
  if (obj && typeof obj === 'object' && obj.bdata && obj.dtype) {
    return decodeBase64(obj.bdata, obj.dtype);
  }
  if (Array.isArray(obj)) return obj.map(decodeBdataRecursive);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, decodeBdataRecursive(v)])
    );
  }
  return obj;
}
```

### Phase 2: Convert Binary-Encoded Standard Charts (~500 files)

**Process:**
1. Run decoder script on each file
2. Identify chart type from decoded traces
3. Convert using established patterns
4. Output to `vega_converted/`

**Batch breakdown:**
| Batch | File Range | Estimated Count |
|-------|------------|-----------------|
| 1 | 332-400 | ~60 files |
| 2 | 401-500 | ~90 files |
| 3 | 501-600 | ~90 files |
| 4 | 601-700 | ~90 files |
| 5 | 701-800 | ~90 files |
| 6 | 801-900 | ~50 files |
| 7 | 901-1000 | ~30 files |

### Phase 3: Convert Polar Charts (~50 files)

**Plotly → Vega-Lite mapping:**

| Plotly Type | Plotly Properties | Vega-Lite Equivalent |
|-------------|-------------------|---------------------|
| scatterpolar (markers) | r, theta arrays | point mark with theta/radius encoding |
| scatterpolar (lines) | r, theta, mode:lines | line mark in polar projection |
| scatterpolar (fill:toself) | Radar chart | arc mark with layered approach |
| barpolar | r, theta, width | arc mark with radius extent |

**Conversion example:**
```json
// Plotly scatterpolar
{
  "data": [{
    "r": [1, 2, 3, 4, 5],
    "theta": [0, 90, 180, 270, 360],
    "type": "scatterpolar",
    "mode": "markers"
  }]
}

// Vega-Lite equivalent
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"r": 1, "theta": 0},
      {"r": 2, "theta": 90},
      {"r": 3, "theta": 180},
      {"r": 4, "theta": 270},
      {"r": 5, "theta": 360}
    ]
  },
  "mark": { "type": "arc", "innerRadius": 0 },
  "encoding": {
    "theta": { "field": "theta", "type": "quantitative", "scale": {"domain": [0, 360]} },
    "radius": { "field": "r", "type": "quantitative" }
  }
}
```

**Files to convert:** 1013-1024 range + scattered throughout 900-1000

### Phase 4: Convert Histogram Charts (~30 files)

**Plotly → Vega-Lite mapping:**
```json
// Plotly histogram
{
  "data": [{
    "x": [1, 1, 2, 2, 2, 3, 3, 3, 3, 4],
    "type": "histogram"
  }]
}

// Vega-Lite equivalent
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"value": 1}, {"value": 1}, {"value": 2}, {"value": 2}, {"value": 2},
      {"value": 3}, {"value": 3}, {"value": 3}, {"value": 3}, {"value": 4}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": { "field": "value", "bin": true, "type": "quantitative" },
    "y": { "aggregate": "count", "type": "quantitative" }
  }
}
```

### Phase 5: Convert Annotation Charts (~50 files)

**Types:**
- Word clouds → Text marks with size encoding
- Timelines → Rule + text marks
- Label displays → Text marks with positioning

**Example - Word Cloud:**
```json
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"word": "AI", "x": 100, "y": 100, "size": 30},
      {"word": "ML", "x": 200, "y": 150, "size": 25}
    ]
  },
  "mark": { "type": "text" },
  "encoding": {
    "x": { "field": "x", "type": "quantitative", "axis": null },
    "y": { "field": "y", "type": "quantitative", "axis": null },
    "text": { "field": "word", "type": "nominal" },
    "size": { "field": "size", "type": "quantitative" }
  }
}
```

### Phase 6: Convert Special Types (~30 files)

| Type | Conversion Approach |
|------|---------------------|
| Gauge/Indicator | Arc mark with angular extent (0-180 or 0-270) |
| Box plots | Native `boxplot` mark in Vega-Lite |
| Funnel | Horizontal bar chart with sorted categories |
| Table | Text marks in grid layout with rect backgrounds |

---

## Files to Create

1. **`apps/declarative_chart_examples/scripts/decode-binary-data.js`**
   - Node.js binary decoder script
   - Batch processing capability

2. **`apps/declarative_chart_examples/scripts/conversion-progress.md`**
   - Tracking document for conversion status

## Files to Modify

1. **`apps/declarative_chart_examples/src/data/vega_converted/`**
   - Add ~630 new converted schemas

---

## Execution Order

1. **Step 1:** Create and test binary decoder script
2. **Step 2:** Decode all binary files to temp directory
3. **Step 3:** Convert decoded standard charts (line, bar, scatter, pie, area)
4. **Step 4:** Convert polar charts using theta/radius encoding
5. **Step 5:** Convert histograms using bin:true
6. **Step 6:** Convert annotation-only charts to text marks
7. **Step 7:** Convert special types (gauge, box, funnel)
8. **Step 8:** Document truly unsupported types

---

## Truly Unsupported (Will Remain Skipped ~70 files)

| Type | Reason |
|------|--------|
| scatter3d, surface, mesh3d | Vega-Lite has no 3D support |
| scattergeo, choropleth | Requires Vega (not Lite) with TopoJSON |
| scattermapbox | Mapbox integration not available |
| sankey | No native support, very complex |
| violin | Not supported in Vega-Lite |
| carpet, contourcarpet | Specialized scientific charts |

---

## Success Metrics

| Metric | Before | After (Expected) |
|--------|--------|------------------|
| Converted files | 323 | ~953 |
| Coverage | 31.5% | ~93% |
| Skipped (unsupported) | 701 | ~71 |
