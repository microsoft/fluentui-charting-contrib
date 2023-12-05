export async function updatedFile(filePath: string) {
  let data = await fs.readFileSync(filePath, 'utf8');
  // Replace the words
  data = data.replace(/\bprivate\b/g, "public");
  // Write the file back
  if (data != null && data != '' && data != undefined) {
    await fs.writeFileSync(filePath, data);
  }
};

updatedFile(fs.realpathSync('./') + '/src/components/LineChart/LineChart.base.tsx');

updatedFile(fs.realpathSync('./') + '/src/components/AreaChart/AreaChart.base.tsx');

updatedFile(fs.realpathSync('./') + '/src/components/VerticalBarChart/VerticalBarChart.base.tsx');
