# 发布指南

本指南说明如何将 `orch-map` 包的各个模块发布到 npm/GitHub 并供其他项目使用。

## 方式一：发布到 npm（推荐）

### 1. 准备工作

确保所有包都已构建：

```bash
# 构建所有包
pnpm build
```

### 2. 登录 npm

```bash
npm login
```

### 3. 发布包

使用 pnpm 批量发布：

```bash
# 发布所有包（按照依赖顺序）
pnpm -r publish --filter @orch-map/types
pnpm -r publish --filter @orch-map/utils
pnpm -r publish --filter @orch-map/mapdata
pnpm -r publish --filter @orch-map/core
```

或者使用脚本：

```bash
pnpm publish:all
```

### 4. 在其他项目中使用

发布后，其他项目可以通过 npm 安装：

```bash
npm install @orch-map/core
npm install @orch-map/types
npm install @orch-map/utils
npm install @orch-map/mapdata
```

使用：

```typescript
import { Geo, MapRegistry } from '@orch-map/core';
import type { MapConfig, DataPoint } from '@orch-map/types';
```

---

## 方式二：使用 GitHub Git 依赖

如果你不想发布到 npm（例如包是私有的或者还在开发中），可以直接通过 Git 仓库引用。

### 1. 推送代码到 GitHub

首先将代码推送到 GitHub 仓库：

```bash
# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换为你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/SKT-Shurima/orch-map.git

# 提交并推送代码
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. 修改 package.json

在 `packages/*/package.json` 中修改 `repository.url` 为实际的 GitHub 仓库地址：

```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SKT-Shurima/orch-map.git",
    "directory": "packages/core"
  }
}
```

### 3. 在其他项目中使用

在其他项目的 `package.json` 中添加：

```json
{
  "dependencies": {
    "@orch-map/core": "github:SKT-Shurima/orch-map#packages/core",
    "@orch-map/types": "github:SKT-Shurima/orch-map#packages/types",
    "@orch-map/utils": "github:SKT-Shurima/orch-map#packages/utils",
    "@orch-map/mapdata": "github:SKT-Shurima/orch-map#packages/mapData"
  }
}
```

或者使用完整的 Git URL：

```json
{
  "dependencies": {
    "@orch-map/core": "git+https://github.com/yourusername/orch-map.git#packages/core",
    "@orch-map/types": "git+https://github.com/yourusername/orch-map.git#packages/types",
    "@orch-map/utils": "git+https://github.com/yourusername/orch-map.git#packages/utils",
    "@orch-map/mapdata": "git+https://github.com/yourusername/orch-map.git#packages/mapData"
  }
}
```

安装：

```bash
pnpm install
# 或
npm install
```

### 4. 使用特定分支或标签

```json
{
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#main"
  }
}
```

或者指定特定的 tag：

```json
{
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#v1.0.0"
  }
}
```

---

## 方式三：使用 GitHub Packages（npm registry）

GitHub Packages 允许你使用 npm registry 来发布私有/公开包。

### 1. 配置 .npmrc

在项目根目录创建 `.npmrc` 文件：

```
@orch-map:registry=https://npm.pkg.github.com
```

### 2. 修改 publishConfig

在 `packages/*/package.json` 中修改 `publishConfig`：

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "@orch-map:registry": "https://npm.pkg.github.com"
  }
}
```

### 3. 登录 GitHub Packages

```bash
npm login --scope=@orch-map --registry=https://npm.pkg.github.com
# 用户名：your-github-username
# 密码：使用 GitHub Personal Access Token (需要 `write:packages` 权限)
```

### 4. 发布

```bash
pnpm -r publish --filter @orch-map/types
pnpm -r publish --filter @orch-map/utils
pnpm -r publish --filter @orch-map/mapdata
pnpm -r publish --filter @orch-map/core
```

### 5. 在其他项目中使用

在项目的 `.npmrc` 文件中添加：

```
@orch-map:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

然后安装：

```bash
npm install @orch-map/core
```

---

## 自动化发布

### 使用 GitHub Actions 自动发布

我们已经创建了 `.github/workflows/publish.yml`，它会在你打 tag 时自动发布到 npm。

触发发布：

```bash
# 更新版本号
npm version patch  # 或 minor, major

# 推送 tag
git push origin main --tags
```

或者手动创建 tag：

```bash
git tag v1.0.0
git push origin v1.0.0
```

### 使用 pnpm 脚本

在根目录的 `package.json` 中添加发布脚本：

```json
{
  "scripts": {
    "publish:all": "pnpm -r publish --filter '!examples/*'",
    "publish:types": "pnpm -r publish --filter @orch-map/types",
    "publish:utils": "pnpm -r publish --filter @orch-map/utils",
    "publish:mapdata": "pnpm -r publish --filter @orch-map/mapdata",
    "publish:core": "pnpm -r publish --filter @orch-map/core"
  }
}
```

---

## 版本管理

建议使用 `changesets` 或 `lerna` 来管理版本：

### 使用 changesets

```bash
# 安装
pnpm add -Dw @changesets/cli

# 初始化
pnpm changeset init

# 创建变更
pnpm changeset

# 发布
pnpm changeset publish
```

---

## 注意事项

1. **构建顺序**：确保按照依赖顺序发布：
   - types（基础）
   - utils（依赖 types）
   - mapdata（依赖 types）
   - core（依赖所有）

2. **版本号**：每次发布前记得更新版本号

3. **权限**：发布到 npm 需要账号有发布权限

4. **测试**：发布前确保所有包都已构建且测试通过

5. **Tag**：建议创建 Git tag 标记版本

---

## 快速参考

### 发布到 npm

```bash
pnpm build
pnpm -r publish --filter '@orch-map/*'
```

### 通过 Git 引用

```json
{
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#packages/core"
  }
}
```

### 在其他项目中使用

```typescript
import { Geo } from '@orch-map/core';
import type { MapConfig } from '@orch-map/types';
```
