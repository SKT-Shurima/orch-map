const fs = require('fs');
const path = require('path');

/**
 * 递归查找指定目录下的所有 JSON 文件
 * @param {string} dir - 目录路径
 * @param {Array<string>} fileList - 文件列表
 * @returns {Array<string>}
 */
function findJsonFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findJsonFiles(filePath, fileList);
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 压缩 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Object} 处理结果
 */
function compressJsonFile(filePath) {
  try {
    // 读取原文件
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalSize = fs.statSync(filePath).size;

    // 解析并重新序列化为压缩格式
    const jsonData = JSON.parse(originalContent);
    const compressedContent = JSON.stringify(jsonData);

    // 计算压缩后大小
    const compressedSize = Buffer.byteLength(compressedContent, 'utf8');

    // 写入压缩后的内容
    fs.writeFileSync(filePath, compressedContent, 'utf8');

    const saved = originalSize - compressedSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(2);

    return {
      success: true,
      originalSize,
      compressedSize,
      saved,
      savedPercent,
      filePath,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      filePath,
    };
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string}
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);

  // 如果没有提供参数，使用默认路径
  const targetDir = args[0] || path.join(__dirname, '..', 'data');
  const dataDir = path.isAbsolute(targetDir)
    ? targetDir
    : path.join(process.cwd(), targetDir);

  console.log(`压缩 JSON 文件工具`);
  console.log(`====================\n`);
  console.log(`目标目录: ${dataDir}`);
  console.log(`\n正在搜索 JSON 文件...\n`);

  if (!fs.existsSync(dataDir)) {
    console.error(`错误: 目录 ${dataDir} 不存在!`);
    console.error(`\n使用方法:`);
    console.error(`  npm run compress-json [目标目录]`);
    console.error(`\n示例:`);
    console.error(`  npm run compress-json ./data`);
    console.error(`  npm run compress-json packages/mapData/data`);
    process.exit(1);
  }

  // 查找所有 JSON 文件
  const jsonFiles = findJsonFiles(dataDir);
  console.log(`找到 ${jsonFiles.length} 个 JSON 文件\n`);

  if (jsonFiles.length === 0) {
    console.log('没有找到需要压缩的 JSON 文件。');
    return;
  }

  // 处理文件
  let successCount = 0;
  let errorCount = 0;
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;

  jsonFiles.forEach((filePath, index) => {
    const result = compressJsonFile(filePath);

    if (result.success) {
      successCount++;
      totalOriginalSize += result.originalSize;
      totalCompressedSize += result.compressedSize;

      // 显示进度
      const relativePath = path.relative(process.cwd(), filePath);
      if (result.savedPercent > 0) {
        console.log(
          `[${index + 1}/${jsonFiles.length}] ✓ ${relativePath} - 节省 ${result.savedPercent}%`
        );
      } else {
        console.log(
          `[${index + 1}/${jsonFiles.length}] ✓ ${relativePath} - 已压缩`
        );
      }
    } else {
      errorCount++;
      console.error(
        `✗ ${path.relative(process.cwd(), filePath)} - 错误: ${result.error}`
      );
    }
  });

  // 显示统计信息
  const totalSaved = totalOriginalSize - totalCompressedSize;
  const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(2);

  console.log('\n=== 压缩完成 ===');
  console.log(`✓ 成功压缩: ${successCount} 个文件`);
  console.log(`✗ 错误: ${errorCount} 个文件`);
  console.log(`\n原始大小: ${formatSize(totalOriginalSize)}`);
  console.log(`压缩后大小: ${formatSize(totalCompressedSize)}`);
  console.log(`节省空间: ${formatSize(totalSaved)} (${totalSavedPercent}%)`);
}

main();
