
import fs from 'fs';
import path from 'path';

const rootDir = 'e:/server/homepage';
const backupDir = 'e:/server/homepage/tmp_backup';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'tmp_backup' && file !== 'dist' && file !== 'dist_backup') {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const backupFiles = getAllFiles(backupDir);
const report = [];

backupFiles.forEach(backupFile => {
  const relativePath = path.relative(backupDir, backupFile);
  const currentFile = path.join(rootDir, relativePath);

  if (!fs.existsSync(currentFile)) {
    report.push({ path: relativePath, status: 'Missing in Current', backupSize: fs.statSync(backupFile).size });
  } else {
    const backupStat = fs.statSync(backupFile);
    const currentStat = fs.statSync(currentFile);
    if (backupStat.size !== currentStat.size) {
      report.push({ path: relativePath, status: 'Different Size', currentSize: currentStat.size, backupSize: backupStat.size });
    }
  }
});

console.log(JSON.stringify(report, null, 2));
