# MapData 工具脚本

本目录包含用于处理和管理地图数据的实用脚本。

## 脚本列表

### 1. compress-json.js

压缩 JSON 文件，移除所有不必要的空白字符以减小文件大小。

**使用方法:**

```bash
# 压缩默认目录 (./data)
npm run compress-json

# 压缩指定目录
npm run compress-json ./data/countries
npm run compress-json packages/mapData/data
```

**功能:**

- 递归搜索指定目录下的所有 `.json` 文件
- 将格式化的 JSON 压缩为紧凑格式
- 显示每个文件的压缩统计信息
- 汇总总体的空间节省情况

**输出示例:**

```
压缩 JSON 文件工具
====================

目标目录: /path/to/data
正在搜索 JSON 文件...

找到 150 个 JSON 文件

[1/150] ✓ data/china/100000.json - 节省 45.32%
...
```

---

### 2. merge-geojson.js

将多个 GeoJSON 文件合并成一个完整的区域 GeoJSON 文件。

**使用方法:**

```bash
# 基本用法
npm run merge-geojson <源文件夹> <输出文件路径>

# 查看帮助
npm run merge-geojson -- --help

# 合并示例
npm run merge-geojson ./data/us-states/ak ./data/ak.geo.json
npm run merge-geojson ./data/counties ./data/state.geo.json --prefix "US"
npm run merge-geojson ./data/districts ./data/region.geo.json --type state --name "California"
```

**参数说明:**

| 参数             | 必需 | 说明                                    |
| ---------------- | ---- | --------------------------------------- |
| `<源文件夹>`     | 是   | 包含多个 `.geo.json` 文件的源文件夹路径 |
| `<输出文件路径>` | 是   | 生成的合并 geo.json 文件路径            |

**选项:**

| 选项                | 说明                                 | 示例                  |
| ------------------- | ------------------------------------ | --------------------- |
| `--prefix <prefix>` | 添加到每个 feature name 的前缀       | `--prefix "US"`       |
| `--suffix <suffix>` | 添加到每个 feature name 的后缀       | `--suffix "State"`    |
| `--type <type>`     | 合并类型（用于设置 properties.kind） | `--type state`        |
| `--name <name>`     | 合并后的区域名称                     | `--name "California"` |

**功能:**

- 读取指定目录下的所有 `.geo.json` 文件
- 合并所有 features 到一个 FeatureCollection
- 支持添加前缀/后缀到 feature properties
- 自动添加原始文件信息到 properties
- 生成紧凑格式的 JSON 输出

**输出示例:**

```
处理目录: /path/to/data/us-states/ak
找到 29 个 geo.json 文件

  处理: anchorage.geo.json - 1 个 features
  处理: fairbanks.geo.json - 1 个 features
  ...
总共合并了 29 个 features
✓ 成功生成: /path/to/data/ak.geo.json
  文件大小: 0.45 MB
```

---

## 使用场景

### 压缩 JSON 文件

压缩大量 GeoJSON 文件以减小包体积：

```bash
# 压缩整个 data 目录
npm run compress-json

# 压缩特定国家/地区的数据
npm run compress-json ./data/china
npm run compress-json ./data/countries
```

### 合并 GeoJSON 文件

将多个较小的 GeoJSON 文件合并成区域级文件：

**场景 1: 合并州的各县数据**

```bash
npm run merge-geojson ./data/usa-states/ny ./data/newyork.geo.json --type state --name "New York"
```

**场景 2: 合并国家的省份数据**

```bash
npm run merge-geojson ./data/china/provinces ./data/china-all.geo.json --type country --name "China"
```

**场景 3: 合并并添加前缀**

```bash
npm run merge-geojson ./data/districts ./data/all-districts.geo.json --prefix "CN"
```

---

## 注意事项

1. **备份数据**: 运行这些脚本会修改文件内容，建议先备份重要数据
2. **文件格式**: 确保 GeoJSON 文件符合标准格式（FeatureCollection）
3. **路径**: 可以使用相对路径或绝对路径
4. **大规模处理**: 压缩大量文件可能需要一些时间，请耐心等待
