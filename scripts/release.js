#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const version = process.argv[2] || 'v1.0.0';
const branch = `release/${version}`;

console.log(`🚀 创建发布版本: ${version}\n`);

// 1. 确保在 master
const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
  encoding: 'utf8',
}).trim();
if (currentBranch !== 'master') {
  console.log('切换到 master 分支...');
  execSync('git checkout master');
}

// 2. 安装依赖并应用 patches
console.log('📦 安装依赖...');
execSync('pnpm install', { stdio: 'inherit' });

// 3. 构建
console.log('🔨 构建...');
execSync('pnpm build', { stdio: 'inherit' });

// 4. 创建发布包配置
console.log('📝 准备发布配置...');
const packageJson = {
  name: 'orch-map',
  version: version.replace('v', ''),
  description: 'A monorepo project with packages',
  exports: {
    './core': './packages/core/dist/index.js',
    './core/types': './packages/core/dist/index.d.ts',
    './types': './packages/types/dist/index.js',
    './utils': './packages/utils/dist/index.js',
    './mapData': './packages/mapData/dist/index.js',
  },
  files: ['packages', 'patches'],
  scripts: {
    postinstall: 'patch-package || exit 0',
  },
  devDependencies: {
    'patch-package': '^8.0.0',
  },
  pnpm: {
    patchedDependencies: {
      '@deck.gl/layers@9.2.2': 'patches/@deck.gl__layers@9.2.2.patch',
    },
  },
};
fs.writeFileSync('package.release.json', JSON.stringify(packageJson, null, 2));

// 备份原 package.json
fs.copyFileSync('package.json', 'package.json.bak');

// 替换 package.json
fs.copyFileSync('package.release.json', 'package.json');

// 5. 创建 release 分支
console.log('🔨 创建 release 分支...');
execSync(`git checkout -b ${branch}`, { stdio: 'inherit' });

// 6. 添加必要文件
execSync(
  'git add -f packages packages/*/dist packages/*/data patches package.json README.md',
  { stdio: 'inherit' }
);
execSync(`git commit -m "Release ${version}"`, { stdio: 'inherit' });

console.log(`\n✅ 发布完成!\n`);
console.log(`下一步: git push origin ${branch}`);
