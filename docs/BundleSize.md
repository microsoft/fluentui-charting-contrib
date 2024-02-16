# Bundle Size

This table measures the maximum unpacked size of each chart control. This is measured by the monosize tool https://github.com/microsoft/monosize

Each chart is tree shakable. https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking
The actual size overhead for your application consuming the chart will depend on only the piece of functionality that you are importing.
To further improve the dependency size, consider turning on the mangle and code chunking options while bundling your package.

import BundleSizeComponent from "../apps/docsite/src/components/BundleSizeTable.tsx"

<BundleSizeComponent/>