# Fluent Charts MCP Server

A Model Context Protocol (MCP) server that executes Python Plotly code and captures Fluent UI chart renderings as images and ready-to-use React components.

## Features

- ✅ Execute Python Plotly code safely
- ✅ Auto-convert Plotly charts to Fluent UI DeclarativeChart format
- ✅ Capture chart images (PNG) via Puppeteer
- ✅ Generate ready-to-use React components with embedded schemas
- ✅ Support for multiple charts per execution
- ✅ Automatic Python environment validation
- ✅ Session-based output organization

## Prerequisites

### Required Dependencies

1. **Node.js 18+** - For running the MCP server
2. **Python 3.8+** - For executing Plotly code
3. **Python Packages** - `plotly` and `kaleido` for chart generation

### Quick Setup

```bash
# Install the MCP server
npm install @fluentui/fluent-charts-mcp

# Start the server (will auto-install Python packages if needed)
npm start
```

### Manual Python Setup

If auto-install fails, install manually:

**Windows:**
```powershell
# Install Python
winget install Python.Python.3.12

# Install required packages
python -m pip install --user plotly kaleido
```

**macOS:**
```bash
# Install Python
brew install python@3.12

# Install required packages  
python3 -m pip install --user plotly kaleido
```

**Linux:**
```bash
# Install Python
sudo apt update && sudo apt install python3 python3-pip

# Install required packages
python3 -m pip install --user plotly kaleido
```

## Usage

### As MCP Server

Add to your MCP configuration file:

```json
{
  "servers": {
    "fluent-charts": {
      "command": "npx",
      "args": ["@fluentui/fluent-charts-mcp"]
    }
  }
}
```

### As Standalone Server

```bash
# Start the server
npm start

# Server will be available at http://localhost:8100
```

### REST API

Execute Python code directly via REST:

```bash
curl -X POST http://localhost:8100/tools/execute-python-and-capture-chart \
  -H "Content-Type: application/json" \
  -d '{
    "pythonCode": "import plotly.express as px\nfig = px.bar(x=[\"A\", \"B\"], y=[1, 2])",
    "outputFormat": "png",
    "timeout": 30000
  }'
```

## API Reference

### Tool: `execute-python-and-capture-chart`

Executes Python Plotly code and returns chart images + React components.

**Parameters:**
- `pythonCode` (string, required) - Python code to execute
- `outputFormat` (string, optional) - Image format: "png" (default), "jpg", "jpeg"  
- `timeout` (number, optional) - Execution timeout in milliseconds (default: 30000)

**Returns:**
- Chart images as base64-encoded data
- Ready-to-use React component code with embedded schemas
- Files saved to `output/charts/<session_id>/`:
  - `chart_N_name_fluent_chart.png` - Chart image
  - `chart_N_name_fluent_chart.tsx` - React component

### Generated React Components

Each chart generates a React component with:

```tsx
/**
 * DEPENDENCIES REQUIRED:
 * npm install react react-dom @fluentui/react-charts
 */
import * as React from 'react';
import { DeclarativeChart, Schema } from '@fluentui/react-charts';

export const ChartComponent = () => {
  const schema: Schema = { /* embedded Plotly schema */ };
  return <DeclarativeChart chartSchema={schema} />;
};
```

## Environment Validation

The server automatically validates your Python environment on startup:

```
✅ Python environment ready: Python 3.12.0
```

If issues are detected:

```
❌ Python Environment Issue:
Python 3.8+ not found. Install from: https://python.org/downloads/

⚠️  Server will start but chart generation may fail without Python setup.
```

## Examples

### Basic Usage

```python
import plotly.express as px

# Create a simple bar chart
data = {'Product': ['A', 'B', 'C'], 'Sales': [100, 150, 80]}
fig = px.bar(data, x='Product', y='Sales', title='Sales by Product')
```

### Multiple Charts

```python
import plotly.express as px
import plotly.graph_objects as go

# Chart 1: Bar chart
fig1 = px.bar(x=['A', 'B'], y=[1, 2], title='Bar Chart')

# Chart 2: Line chart  
fig2 = go.Figure()
fig2.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6], name='Line'))
fig2.update_layout(title='Line Chart')
```

### Iris Dataset

```python
import plotly.express as px

df = px.data.iris()
fig = px.scatter(df, x='sepal_width', y='sepal_length', 
                 color='species', title='Iris Dataset')
```

## Troubleshooting

### Python Issues

**"Python not found"**
- Ensure Python 3.8+ is installed and in PATH
- Download from: https://python.org/downloads/
- Try `python`, `python3`, or `py` commands

**"Package install failed"**
```bash
python -m pip install --user plotly kaleido
```

**"Permission denied"**
```bash
# Install packages for current user only
python -m pip install --user plotly kaleido
```

### Chart Generation Issues

**"No charts captured"**
- Ensure your Python code creates `fig` objects
- Check that Plotly code is syntactically correct
- Verify `kaleido` package is installed for image export

**"Download failed"**  
- Check internet connection for Puppeteer to download Chrome
- Ensure sufficient disk space for temporary files

### Server Issues

**Port already in use**
```bash
# Use different port
PORT=8101 npm start
```

**Memory issues**
- Increase Node.js memory: `--max-old-space-size=4096`
- Check available disk space for temporary files

## Development

```bash
# Clone repository
git clone https://github.com/Anush2303/fluentui-charting-contrib.git
cd apps/fluent-charts-mcp

# Install dependencies
npm install

# Build
npm run build

# Start development server
npm run dev
```

## License

MIT - See [LICENSE](./LICENSE) file for details.

## Contributing

Contributions welcome! Please see the main repository for guidelines.