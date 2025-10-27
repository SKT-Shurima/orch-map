# 文档目录

欢迎使用 `@orch-map` 项目文档！

## 快速导航

### 🚀 快速开始

- **[QUICK_START.md](./QUICK_START.md)** - 5 分钟内开始使用 @orch-map

### 📥 安装指南
- **[INSTALLATION.md](./INSTALLATION.md)** - 如何通过 Git 依赖安装和使用 @orch-map（推荐）

### 📚 使用指南
- **[USAGE.md](./USAGE.md)** - 完整的使用指南和 API 说明
- **[example-project-setup.md](./example-project-setup.md)** - 在外部项目中使用 @orch-map 的完整示例

### 📦 发布指南

- **[PUBLISHING.md](./PUBLISHING.md)** - 如何发布包到 npm/GitHub/GitHub Packages

---

## 主要内容

### INSTALLATION.md
安装和使用指南，包含：
- 通过 Git 依赖安装（推荐）
- 通过 npm 安装
- SSH 和 HTTPS 两种协议
- 使用特定分支或 tag
- 常见问题

### QUICK_START.md

快速开始指南，包含：

- 推送代码到 GitHub
- 在其他项目中使用
- 基本使用示例

### USAGE.md

详细的使用文档，包含：

- 安装方式（npm/GitHub/GitHub Packages）
- 完整的使用示例
- Vue 3 和 React 集成示例
- API 参考
- 常见问题

### example-project-setup.md

在外部项目中使用的详细指南，包含：

- Vue 3 + TypeScript 完整示例
- React + TypeScript 完整示例
- 项目配置详解
- 故障排除

### PUBLISHING.md

发布和维护指南，包含：

- 发布到 npm
- 使用 GitHub Git 依赖
- 使用 GitHub Packages
- 自动化发布
- 版本管理

---

## 从 GitHub 使用

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

安装：

```bash
npm install
# 或
pnpm install
```

使用：

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

查看主项目 [README](../README.md) 了解更多信息。
