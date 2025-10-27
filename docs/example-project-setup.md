# 在外部项目中使用 @orch-map

本指南展示如何在一个新的 Vue/React 项目中使用 `@orch-map` 包。

## 新建项目并安装依赖

### 1. 创建新项目

```bash
# 创建 Vue 项目
npm create vue@latest my-map-app
cd my-map-app

# 或创建 React 项目
npx create-react-app my-map-app --template typescript
cd my-map-app
```

### 2. 安装 @orch-map 包

#### 从 GitHub 安装（推荐用于开发）

在项目的 `package.json` 中添加：

```json
{
  "dependencies": {
    "@orch-map/core": "github:SKT-Shurima/orch-map#packages/core",
    "@orch-map/types": "github:SKT-Shurima/orch-map#packages/types",
    "@orch-map/utils": "github:SKT-Shurima/orch-map#packages/utils",
    "@orch-map/mapdata": "github:SKT-Shurima/orch-map#packages/mapData",
    "echarts": "^5.6.0"
  }
}
```

然后安装：

```bash
npm install
# 或
pnpm install
```

#### 从 npm 安装（如果已发布）

```bash
npm install @orch-map/core @orch-map/types @orch-map/utils @orch-map/mapdata echarts
```

---

## Vue 3 + TypeScript 项目示例

### 项目结构

```
my-map-app/
├── src/
│   ├── components/
│   │   └── ChinaMap.vue
│   ├── App.vue
│   └── main.ts
├── package.json
└── tsconfig.json
```

### package.json

```json
{
  "name": "my-map-app",
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#packages/core",
    "@orch-map/types": "github:yourusername/orch-map#packages/types",
    "echarts": "^5.6.0",
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.2.4",
    "typescript": "^5.0.0",
    "vite": "^5.4.20",
    "vue-tsc": "^2.0.0"
  }
}
```

### src/components/ChinaMap.vue

```vue
<template>
  <div ref="containerRef" class="map-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

const containerRef = ref<HTMLDivElement>();

onMounted(() => {
  if (!containerRef.value) return;

  const config: GeoConfig = {
    mapName: 'china',
    center: [105, 36],
    zoom: 1.2,
    roam: true,
    areaColor: '#f0f0f0',
    borderColor: '#999',
    borderWidth: 1,
  };

  const geo = new Geo(containerRef.value, config);

  // 添加散点数据
  const data = [
    { name: '北京', value: [116.46, 39.92, 100] },
    { name: '上海', value: [121.48, 31.22, 200] },
    { name: '广州', value: [113.23, 23.16, 150] },
    { name: '深圳', value: [114.07, 22.62, 180] },
    { name: '成都', value: [104.06, 30.67, 120] },
  ];

  geo.addSeries({
    type: 'scatter',
    data: data,
    symbolSize: (val: number[]) => val[2] / 2,
    itemStyle: {
      color: '#ff6b6b',
    },
    label: {
      show: true,
      formatter: '{b}',
      position: 'top',
    },
  });

  // 添加事件监听
  geo.setEventHandlers({
    onRegionClick: (params) => {
      console.log('点击了区域:', params.name);
    },
    onRegionMouseOver: (params) => {
      console.log('悬停在:', params.name);
    },
  });
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 600px;
}
</style>
```

### src/App.vue

```vue
<template>
  <div id="app">
    <h1>中国地图示例</h1>
    <ChinaMap />
  </div>
</template>

<script setup lang="ts">
import ChinaMap from './components/ChinaMap.vue';
</script>

<style>
#app {
  padding: 20px;
}
</style>
```

---

## React + TypeScript 项目示例

### 项目结构

```
my-map-app/
├── src/
│   ├── components/
│   │   └── ChinaMap.tsx
│   ├── App.tsx
│   └── index.tsx
├── package.json
└── tsconfig.json
```

### package.json

```json
{
  "name": "my-map-app",
  "version": "0.1.0",
  "dependencies": {
    "@orch-map/core": "github:yourusername/orch-map#packages/core",
    "@orch-map/types": "github:yourusername/orch-map#packages/types",
    "echarts": "^5.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react-scripts": "5.0.1",
    "typescript": "^5.0.0"
  }
}
```

### src/components/ChinaMap.tsx

```tsx
import React, { useEffect, useRef } from 'react';
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

const ChinaMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: GeoConfig = {
      mapName: 'china',
      center: [105, 36],
      zoom: 1.2,
      roam: true,
      areaColor: '#f0f0f0',
      borderColor: '#999',
      borderWidth: 1,
    };

    const geo = new Geo(containerRef.current, config);

    const data = [
      { name: '北京', value: [116.46, 39.92, 100] },
      { name: '上海', value: [121.48, 31.22, 200] },
      { name: '广州', value: [113.23, 23.16, 150] },
      { name: '深圳', value: [114.07, 22.62, 180] },
      { name: '成都', value: [104.06, 30.67, 120] },
    ];

    geo.addSeries({
      type: 'scatter',
      data: data,
      symbolSize: (val: number[]) => val[2] / 2,
      itemStyle: {
        color: '#ff6b6b',
      },
      label: {
        show: true,
        formatter: '{b}',
        position: 'top',
      },
    });

    geo.setEventHandlers({
      onRegionClick: (params) => {
        console.log('点击了区域:', params.name);
      },
      onRegionMouseOver: (params) => {
        console.log('悬停在:', params.name);
      },
    });

    return () => {
      // 清理
      geo.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '600px' }} />;
};

export default ChinaMap;
```

### src/App.tsx

```tsx
import React from 'react';
import ChinaMap from './components/ChinaMap';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>中国地图示例</h1>
      <ChinaMap />
    </div>
  );
}

export default App;
```

---

## 注意事项

### 1. TypeScript 配置

确保 `tsconfig.json` 中包含正确的类型解析：

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

### 2. Vite 配置（如使用）

`vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
```

### 3. 路径映射

如果需要使用 `@` 别名：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 测试安装

创建一个简单的测试文件：

```typescript
// src/test-import.ts
import { Geo } from '@orch-map/core';
import type { GeoConfig } from '@orch-map/types';

console.log('Geo:', Geo);
console.log('导入成功！');
```

运行项目：

```bash
npm run dev
# 或
pnpm dev
```

---

## 故障排除

### 问题：找不到模块

**解决方案**：

1. 检查 package.json 中的依赖是否正确
2. 删除 `node_modules` 和 `package-lock.json` 重新安装
3. 确保 GitHub 仓库 URL 正确

### 问题：类型错误

**解决方案**：

1. 确保安装了 TypeScript
2. 确保项目中的 tsconfig.json 配置正确
3. 检查是否需要添加 `"module": "ESNext"`

### 问题：echarts 未定义

**解决方案**：

1. 确保安装了 echarts: `npm install echarts`
2. 确保 echarts 版本 >= 5.6.0

---

## 更多示例

查看 [`../../examples/`](../examples) 目录中的完整示例项目。
