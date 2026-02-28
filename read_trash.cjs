const fs = require('fs').promises;
const path = require('path');
const os = require('os');

const typeMapping = {
  '.png': { type: 'image', color: '#EBF4FA', border: '#B0C4DE', label: 'Image' },
  '.jpg': { type: 'image', color: '#EBF4FA', border: '#B0C4DE', label: 'Image' },
  '.docx':{ type: 'document', color: '#FFFFFF', border: '#E0E0E0', label: 'Document' },
  '.pdf': { type: 'document', color: '#FFFFFF', border: '#E0E0E0', label: 'Document' },
  '.js':  { type: 'code', color: '#F0FFF0', border: '#8FBC8F', label: 'Code' },
};

function getTrashPath() {
  const platform = process.platform;
  if (platform === 'darwin') return path.join(os.homedir(), '.Trash'); // Mac
  if (platform === 'win32') return 'C:\\$Recycle.Bin'; // Windows
  return path.join(os.homedir(), '.local', 'share', 'Trash', 'files'); 
}

async function scanTrash() {
  const trashPath = getTrashPath();
  try {
    console.log(`正在扫描你的废纸篓...`);
    const files = await fs.readdir(trashPath);
    const trashData = [];

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(trashPath, fileName);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const ext = path.extname(fileName).toLowerCase();
          const mapping = typeMapping[ext] || { type: 'system', color: '#F5F5F5', border: '#CCCCCC', label: 'System' };
          trashData.push({
            id: `real-shred-${i}`,
            name: fileName,
            size: stats.size,
            color: mapping.color,
            borderColor: mapping.border,
            label: mapping.label,
            deletedAt: stats.birthtime.toISOString().split('T')[0]
          });
        }
      } catch (err) {}
    }

    const publicDirPath = path.join(__dirname, 'public');
    await fs.mkdir(publicDirPath, { recursive: true });
    await fs.writeFile(path.join(publicDirPath, 'trash_data.json'), JSON.stringify(trashData, null, 2));
    console.log(`✅ 成功！发现 ${trashData.length} 个废弃文件。`);
  } catch (error) {
    console.error("读取失败:", error.message);
  }
}
scanTrash();