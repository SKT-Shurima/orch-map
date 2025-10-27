# 安装和使用指南

`@orch-map` 提供了两种使用方式：**Git 依赖**（推荐）和 **npm 发布**。

## 方式一：通过 Git 依赖（推荐）

这是最简单直接的方式，无需发布到 npm，直接从 GitHub 仓库引用。

### 1. 在新项目的 `package.json` 中配置

```json
{
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/core",
    "@orch-map/types": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/types",
    "@orch-map/utils": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/utils",
    "@orch-map/mapdata": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/mapData",
    "echarts": "^5.6.0"
  }
}
```

### 2. 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 3. 使用

```typescript
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

const config: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
};

const geo = new Geo(document.getElementById('map'), config);
```

---

## 方式二：发布到 npm（可选）

如果你想发布到 npm 供他人使用，可以参考 [PUBLISHING.md](./PUBLISHING.md)。

### 当前错误的解决

如果你遇到 npm 登录错误，有两个选择：

**选择 1：切换回官方 npm 镜像**

```bash
npm config set registry https://registry.npmjs.org/
```

**选择 2：使用 Git 依赖（推荐，不需要发布）**

直接使用方式一，不需要发布到 npm。

---

## 使用 GitHub HTTPS 协议

如果你使用 HTTPS 而不是 SSH：

```json
{
  "dependencies": {
    "@orch-map/core": "git+https://github.com/SKT-Shurima/orch-map.git#packages/core",
    "@orch-map/types": "git+https://github.com/SKT-Shurima/orch-map.git#packages/types",
    "@orch-map/utils": "git+https://github.com/SKT-Shurima/orch-map.git#packages/utils",
    "@orch-map/mapdata": "git+https://github.com/SKT-Shurima/orch-map.git#packages/mapData"
  }
}
```

---

## 使用特定分支或 Tag

### 使用特定分支

```json
{
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#main:packages/core"
  }
}
```

### 使用特定 Tag

```json
{
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#v1.0.0:packages/core"
  }
}
```

---

## 完整示例

### Vue 3 项目

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/core",
    "@orch-map/types": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/types",
    "echarts": "^5.6.0",
    "vue": "^3.4.0"
  }
}
```

### React 项目

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "@orch-map/core": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/core",
    "@orch-map/types": "git+ssh://git@github.com/SKT-Shurima/orch-map.git#packages/types",
    "echarts": "^5.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

---

## 注意事项

1. **SSH 密钥**：使用 `git+ssh://` 需要配置 SSH 密钥访问 GitHub
2. **私有仓库**：如果仓库是私有的，需要确保有访问权限
3. **构建输出**：确保 `packages/*/dist` 目录存在，因为 Git 依赖会使用构建后的文件
4. **版本锁定**：建议使用特定的 tag 来锁定版本

---

## 常见问题

### Q: 为什么直接从 Git 安装会失败？

A: 可能是 SSH 密钥未配置或仓库是私有的。使用 HTTPS 方式可以解决：

```json
{
  "dependencies": {
    "@orch-map/core": "git+https://github.com/SKT-Shurima/orch-map.git#packages/core"
  }
}
```

### Q: 如何在本地开发时测试？

A: 使用 `pnpm link` 或 `yarn link`：

```bash
# 在 orch-map 项目根目录
pnpm link --global

# 在目标项目
pnpm link @orch-map/core
```

### Q: 如何更新到最新版本？

A: 重新安装依赖：

```bash
# npm
npm install --force

# pnpm
pnpm install --force
```

---

## 推荐做法

对于你的用例（项目内部使用），**直接使用 Git 依赖是最简单的方式**：

1. ✅ 不需要发布到 npm
2. ✅ 不需要管理 npm 账号和 token
3. ✅ 可以直接使用最新的代码
4. ✅ 版本控制简单

更多示例请查看 [example-project-setup.md](./example-project-setup.md)。
