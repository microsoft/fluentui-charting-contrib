const fs = require('fs');
const path = require('path');

// Directory path (change this to your target folder)
const directoryPath = path.join(__dirname, '../src/data');

// Function to list and rename files
function listAndRenameFiles(dirPath) {
    try {
        // Check if directory exists
        if (!fs.existsSync(dirPath)) {
            console.error(`❌ Directory not found: ${dirPath}`);
            return;
        }

        // Read all files in the directory
        const files = fs.readdirSync(dirPath);

        if (files.length === 0) {
            console.log('📂 No files found in the directory.');
            return;
        }

        console.log('📄 Files found:');
        files.forEach((file, index) => {
            const oldPath = path.join(dirPath, file);

            // Skip directories
            if (fs.statSync(oldPath).isDirectory()) {
                console.log(`   Skipping folder: ${file}`);
                return;
            }

            console.log(`   ${file}`);

            // Create a new file name (example: file_1.txt, file_2.txt, etc.)
            const parsed = path.parse(file);
            const ext = parsed.ext;
            const newName = `${parsed.name.split('_').slice(0,2).join('_')}${ext}`;
            const newPath = path.join(dirPath, newName);

            // Rename the file
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`   ✅ Renamed to: ${newName}`);
            } catch (err) {
                console.error(`   ❌ Error renaming ${file}:`, err.message);
            }
        });

        console.log('✅ All files processed.');
    } catch (err) {
        console.error('❌ Error reading directory:', err.message);
    }
}

// Run the function
listAndRenameFiles(directoryPath);
