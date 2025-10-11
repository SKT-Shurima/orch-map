/**
 * 将 SVG 转换为 ECharts symbol 格式
 * @param {string|Element} svg - SVG 字符串或 DOM 元素
 * @param {Object} options - 配置选项
 * @param {boolean} options.preferPath - 是否优先使用路径方式 (默认: true)
 * @param {boolean} options.normalize - 是否规范化路径数据 (默认: false)
 * @return {string} ECharts 可用的 symbol 格式
 */
export function svgToEChartsSymbol(svg: string | Element, options: { preferPath?: boolean, normalize?: boolean } = {}) {
  const { preferPath = true, normalize = false } = options;

  // 如果传入的是 DOM 元素，转换为字符串
  const svgString = typeof svg === "string"
    ? svg
    : (svg instanceof Element ? svg.outerHTML : "");

  // 如果字符串为空，返回默认符号
  if (!svgString) {
    return "circle";
  }

  // 尝试提取路径数据
  if (preferPath) {
    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, "image/svg+xml");

      // 检查是否有解析错误
      const parserError = svgDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("SVG 解析错误");
      }

      // 获取所有路径元素
      const pathElements = svgDoc.querySelectorAll("path");

      if (pathElements.length === 1) {
        // 只有一个路径元素，直接返回
        let pathData = pathElements[0].getAttribute("d");

        // 规范化路径数据（可选）
        if (normalize && pathData) {
          // 简单的规范化处理，实际应用可能需要更复杂的逻辑
          pathData = pathData.trim().replace(/\s+/g, " ");
        }

        return pathData ? `path://${ pathData}` : "circle";
      } else if (pathElements.length > 1) {
        // 多个路径元素，可能比较复杂，使用 Base64 方式
        return svgToBase64Symbol(svgString);
      }

      // 尝试处理基本图形
      const basicShapes = svgDoc.querySelectorAll("circle,rect,ellipse,line,polyline,polygon");
      if (basicShapes.length === 0) {
        // 没有基本图形，使用 Base64 方式
        return svgToBase64Symbol(svgString);
      } else if (basicShapes.length === 1) {
        // 单个基本图形，尝试转换为路径
        const shape = basicShapes[0];
        const tagName = shape.tagName.toLowerCase();

        // 根据不同图形类型构造路径
        let pathData = "";

        if (tagName === "circle") {
          const cx = parseFloat(shape.getAttribute("cx") ?? "0");
          const cy = parseFloat(shape.getAttribute("cy") ?? "0");
          const r = parseFloat(shape.getAttribute("r") ?? "0");
          pathData = `M${cx-r},${cy}A${r},${r},0,1,1,${cx+r},${cy}A${r},${r},0,1,1,${cx-r},${cy}Z`;
        } else if (tagName === "rect") {
          const x = parseFloat(shape.getAttribute("x") ?? "0");
          const y = parseFloat(shape.getAttribute("y") ?? "0");
          const width = parseFloat(shape.getAttribute("width") ?? "0");
          const height = parseFloat(shape.getAttribute("height") ?? "0");
          const rx = parseFloat(shape.getAttribute("rx") ?? "0");
          const ry = parseFloat(shape.getAttribute("ry") ?? "0");

          if (rx > 0 || ry > 0) {
            // 圆角矩形
            const _rx = rx ?? ry;
            const _ry = ry ?? rx;
            pathData = `M${x+_rx},${y} L${x+width-_rx},${y} Q${x+width},${y} ${x+width},${y+_ry} ` +
                       `L${x+width},${y+height-_ry} Q${x+width},${y+height} ${x+width-_rx},${y+height} ` +
                       `L${x+_rx},${y+height} Q${x},${y+height} ${x},${y+height-_ry} ` +
                       `L${x},${y+_ry} Q${x},${y} ${x+_rx},${y} Z`;
          } else {
            // 普通矩形
            pathData = `M${x},${y} L${x+width},${y} L${x+width},${y+height} L${x},${y+height} Z`;
          }
        } else {
          // 其他基本图形处理较复杂，使用 Base64 方式
          return svgToBase64Symbol(svgString);
        }

        return `path://${ pathData}`;
      } else {
        // 多个基本图形，使用 Base64 方式
        return svgToBase64Symbol(svgString);
      }
    } catch (error) {
      console.error("SVG 路径提取错误:", error);
      // 出错时回退到 Base64 方式
      return svgToBase64Symbol(svgString);
    }
  }

  // 如果不优先使用路径或者提取路径失败，使用 Base64 方式
  return svgToBase64Symbol(svgString);
}

/**
 * 将 SVG 字符串转换为 Base64 格式
 * @param {string} svgString - SVG 字符串
 * @return {string} Base64 格式的 SVG
 */
export function svgToBase64Symbol(svgString: string) {
  // 确保 SVG 包含正确的命名空间
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  // 转换为 Base64
  const base64 = btoa(unescape(encodeURIComponent(svgString)));

  // 返回 ECharts 可用的 image:// 格式
  return `image://data:image/svg+xml;base64,${ base64}`;
}
