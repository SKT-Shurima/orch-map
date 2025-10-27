const fs = require('fs');
const path = require('path');

/**
 * 合并指定文件夹下的所有 GeoJSON 文件
 * 生成一个完整的区域 geo.json 文件
 * @param {string} sourceDir - 源文件夹路径
 * @param {string} outputPath - 输出文件路径
 * @param {Object} options - 选项
 */
function mergeGeoJsonFiles(sourceDir, outputPath, options = {}) {
  const {
    prefix = '',
    suffix = '',
    addSourceInfo = true,
    mergeType = 'region',
    mergeName = '',
  } = options;

  // 检查源目录是否存在
  if (!fs.existsSync(sourceDir)) {
    console.warn(`警告: 源目录 ${sourceDir} 不存在`);
    return null;
  }

  // 获取所有 .geo.json 文件
  const files = fs
    .readdirSync(sourceDir)
    .filter((file) => file.endsWith('.geo.json'))
    .sort(); // 按名称排序以保证一致性

  console.log(`处理目录: ${sourceDir}`);
  console.log(`找到 ${files.length} 个 geo.json 文件`);

  if (files.length === 0) {
    console.warn(`警告: 没有找到 geo.json 文件`);
    return null;
  }

  const allFeatures = [];

  // 读取并合并所有文件
  files.forEach((file) => {
    const filePath = path.join(sourceDir, file);

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const geojson = JSON.parse(content);

      // 验证数据格式
      if (!geojson.type || geojson.type !== 'FeatureCollection') {
        console.warn(`警告: 文件 ${file} 不是有效的 FeatureCollection`);
        return;
      }

      if (!geojson.features || !Array.isArray(geojson.features)) {
        console.warn(`警告: 文件 ${file} 没有有效的 features 数组`);
        return;
      }

      // 遍历所有 features 并添加到列表
      geojson.features.forEach((feature) => {
        // 确保每个 feature 有正确的结构
        if (feature.type === 'Feature' && feature.geometry) {
          if (!feature.properties) {
            feature.properties = {};
          }

          // 添加来源文件信息
          if (addSourceInfo) {
            const fileName = file.replace('.geo.json', '');
            if (!feature.properties.originalFile) {
              feature.properties.originalFile = file;
            }
            if (!feature.properties.sourceName) {
              feature.properties.sourceName = fileName;
            }
          }

          // 添加前缀和后缀到 name
          if (feature.properties.name) {
            const namePrefix = prefix ? `${prefix}-` : '';
            const nameSuffix = suffix ? `-${suffix}` : '';
            feature.properties.name = `${namePrefix}${feature.properties.name}${nameSuffix}`;
          }

          allFeatures.push(feature);
        }
      });

      console.log(`  处理: ${file} - ${geojson.features.length} 个 features`);
    } catch (error) {
      console.error(`错误: 处理文件 ${file} 时出错 - ${error.message}`);
    }
  });

  console.log(`总共合并了 ${allFeatures.length} 个 features`);

  if (allFeatures.length === 0) {
    console.warn(`警告: 没有有效的 features`);
    return null;
  }

  // 创建新的 FeatureCollection
  const mergedGeoJSON = {
    type: 'FeatureCollection',
    properties: {
      kind: mergeType,
      name: mergeName || path.basename(sourceDir),
      mergedCount: allFeatures.length,
      mergedAt: new Date().toISOString(),
    },
    features: allFeatures,
  };

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 写入输出文件（使用紧凑格式）
  const outputContent = JSON.stringify(mergedGeoJSON, null, 0);
  fs.writeFileSync(outputPath, outputContent, 'utf8');

  console.log(`✓ 成功生成: ${outputPath}`);
  console.log(
    `  文件大小: ${(outputContent.length / 1024 / 1024).toFixed(2)} MB`
  );

  return mergedGeoJSON;
}

function main() {
  // 获取命令行参数
  const args = process.argv.slice(2);

  // 显示使用说明
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`合并 GeoJSON 文件工具`);
    console.log(`====================\n`);
    console.log(`使用方法:`);
    console.log(`  npm run merge-geojson <源文件夹> <输出文件路径> [选项]\n`);
    console.log(`参数:`);
    console.log(`  <源文件夹>         - 包含多个 geo.json 文件的源文件夹路径`);
    console.log(`  <输出文件路径>     - 生成的合并 geo.json 文件路径\n`);
    console.log(`选项 (JSON 格式):`);
    console.log(`  --prefix <prefix>  - 添加到 name 的前缀`);
    console.log(`  --suffix <suffix>  - 添加到 name 的后缀`);
    console.log(`  --type <type>      - 合并类型 (默认: region)`);
    console.log(`  --name <name>      - 合并后的名称\n`);
    console.log(`示例:`);
    console.log(
      `  npm run merge-geojson ./data/us-states/ak ./data/ak.geo.json`
    );
    console.log(
      `  npm run merge-geojson ./data/counties ./data/state.geo.json --prefix "US" --type state`
    );
    return;
  }

  const sourceDir = args[0];
  const outputPath = args[1];

  if (!sourceDir || !outputPath) {
    console.error('错误: 缺少必要参数');
    console.log('\n运行 "npm run merge-geojson -- --help" 查看使用说明');
    process.exit(1);
  }

  // 解析选项
  const options = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--prefix' && args[i + 1]) {
      options.prefix = args[i + 1];
      i++;
    } else if (args[i] === '--suffix' && args[i + 1]) {
      options.suffix = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      options.mergeType = args[i + 1];
      i++;
    } else if (args[i] === '--name' && args[i + 1]) {
      options.mergeName = args[i + 1];
      i++;
    }
  }

  try {
    // 处理相对路径
    const resolvedSourceDir = path.isAbsolute(sourceDir)
      ? sourceDir
      : path.join(process.cwd(), sourceDir);

    const resolvedOutputPath = path.isAbsolute(outputPath)
      ? outputPath
      : path.join(process.cwd(), outputPath);

    mergeGeoJsonFiles(resolvedSourceDir, resolvedOutputPath, options);
    console.log('\n完成！');
  } catch (error) {
    console.error('错误:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
