# 快速开始

## 在 5 分钟内使用 @orch-map

### 1. 推送代码到 GitHub

```bash
# 初始化 git（如果还没有）
git init

# 添加远程仓库（替换为你的 GitHub 用户名）
git remote add origin https://github.com/SKT-Shurima/orch-map.git

# 提交代码
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git push -u origin main
```

### 2. 在其他项目中使用

> 注意：仓库 URL 已经配置为 `SKT-Shurima/orch-map`，可以直接使用。

在新项目的 `package.json` 中添加：

```json
{
  "dependencies": {
    "@orch-map/core": "github:SKT-Shurima/orch-map#packages/core",
    "@orch-map/types": "github:SKT-Shurima/orch-map#packages/types",
    "echarts": "^5.6.0"
  }
}
```

安装：

```bash
npm install
# 或
pnpm install
```

### 3. 使用

```typescript
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

const geoConfig: GeoConfig = {
  mapName: 'china',
  center: [105, 36],
  zoom: 1.2,
};

const geo = new Geo(document.getElementById('map'), geoConfig);

geo.addSeries({
  type: 'scatter',
  data: [{ name: '北京', value: [116.46, 39.92, 100] }],
});
```

完成！✅

---

## 下一步

- 📖 查看 [USAGE.md](./USAGE.md) 了解更多用法
- 📦 查看 [PUBLISHING.md](./PUBLISHING.md) 了解如何发布到 npm
- 🎯 查看 [example-project-setup.md](./example-project-setup.md) 了解完整项目配置
