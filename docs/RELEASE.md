# 发布文档

本文档说明如何发布 Orch Map 项目的新版本。

## 📋 目录

- [分支说明](#分支说明)
- [发布流程](#发布流程)
- [版本管理](#版本管理)
- [使用说明](#使用说明)

## 🌲 分支说明

项目采用双分支发布策略：

### master 分支

- **作用**: 源代码分支
- **内容**: 包含所有源代码、开发文件
- **用途**: 日常开发和维护

### release/\* 分支

- **作用**: 发布版本分支
- **命名**: `release/v1.0.0` (对应版本号)
- **内容**: 包含构建后的 `dist` 目录、补丁文件、简化的配置
- **用途**: 供用户安装和使用的稳定版本

## 🚀 发布流程

### 前置准备

确保代码已提交到 master 分支：

```bash
# 切换到 master 分支
git checkout master

# 确保代码已提交
git status

# 如有未提交的修改
git add .
git commit -m "chore: 准备发布 v1.0.0"
```

### 1. 更新版本号

在发布前，需要更新 `package.json` 中的版本号：

```bash
# 手动编辑 package.json
# 或在发布脚本中指定版本
```

### 2. 运行发布脚本

使用项目提供的发布脚本：

```bash
# 发布 v1.0.0
pnpm release v1.0.0
```

该脚本会：

1. 确保在 master 分支
2. 安装依赖并应用补丁
3. 构建所有包
4. 准备发布配置
5. 创建 release 分支
6. 提交必要的文件

### 3. 创建 Git Tag

**重要**: 每次发布都必须打 tag！

```bash
# 创建 tag
git tag v1.0.0

# 推送 tag 到远程
git push origin v1.0.0
```

### 4. 推送 release 分支

```bash
# 推送 release 分支到远程
git push origin release/v1.0.0
```

### 完整发布命令序列

```bash
# 1. 确保在 master 并更新代码
git checkout master
git pull origin master

# 2. 运行发布脚本
pnpm release v1.0.0

# 3. 创建并推送 tag
git tag v1.0.0
git push origin v1.0.0

# 4. 推送 release 分支
git push origin release/v1.0.0
```

## 🔖 版本管理

### 版本号规则

使用 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号 (Major)**: 不兼容的 API 修改
- **次版本号 (Minor)**: 向下兼容的功能性新增
- **修订号 (Patch)**: 向下兼容的问题修正

示例：

- `v1.0.0` - 首次发布
- `v1.1.0` - 新增功能
- `v1.1.1` - 修复 bug
- `v2.0.0` - 重大变更

### 版本更新清单

发布前检查：

- [ ] 版本号已更新
- [ ] CHANGELOG 已更新
- [ ] 所有测试通过
- [ ] 构建成功
- [ ] 已创建 tag
- [ ] release 分支已推送

## 📦 使用说明

### 在用户项目中安装

用户可以在项目中使用以下方式安装：

```json
{
  "dependencies": {
    "orch-map": "github:SKT-Shurima/orch-map#release/v1.0.0"
  }
}
```

### 安装步骤

```bash
# 安装依赖
pnpm install

# pnpm 会自动应用 patches
```

### 使用

```typescript
import { Geo } from 'orch-map/core';
import type { GeoConfig } from 'orch-map/types';

const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
};

const geo = new Geo(container, config);
```

## 🔄 回滚发布

如果需要回滚某个版本：

```bash
# 1. 删除远程 tag
git push origin :refs/tags/v1.0.0

# 2. 删除远程 release 分支
git push origin :release/v1.0.0

# 3. 重新发布或修复后重新发布
```

## 📋 发布检查清单

发布前请确认：

### 代码质量

- [ ] 代码已通过 lint 检查
- [ ] 类型检查通过
- [ ] 无明显的 bug

### 构建

- [ ] 所有包构建成功
- [ ] dist 目录存在
- [ ] 补丁文件已准备

### 版本

- [ ] 版本号已更新
- [ ] tag 已创建
- [ ] release 分支已创建

### 文档

- [ ] README 已更新
- [ ] 文档已同步

### Git

- [ ] master 分支代码已推送
- [ ] release 分支已推送
- [ ] tag 已推送

## 🚨 注意事项

### 1. 必须打 Tag

每次发布都必须创建并推送 tag，这是版本追踪的关键。

### 2. release 分支内容

release 分支只包含：

- `packages/*/dist` - 构建产物
- `packages/*/data` - 数据文件
- `patches/` - 补丁文件
- `package.json` - 发布配置
- `README.md` - 说明文档

不包含源代码和开发文件。

### 3. 补丁处理

pnpm 会自动应用 `patches/@deck.gl__layers@9.2.2.patch`，无需手动处理。

### 4. 版本兼容性

保持向后兼容，除非发布主版本更新。

## 📖 相关文档

- [DEVELOPMENT.md](./DEVELOPMENT.md) - 开发说明
- [USAGE.md](./USAGE.md) - 使用说明
