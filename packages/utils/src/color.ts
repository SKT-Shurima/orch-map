
/**
 * 将RGB数组转换为十六进制颜色代码
 * @param {number[]} rgbArray - 包含三个数字的RGB数组 [R,G,B]
 * @return {string} 十六进制颜色代码，如 #123456
 */
export function rgbToHex(rgbArray: number[]) {
  // 验证每个RGB值
  for (let i = 0; i < 3; i++) {
    const value = rgbArray[i];
    if (typeof value !== "number" || value < 0 || value > 255 || !Number.isInteger(value)) {
      throw new Error("RGB值必须是0-255之间的整数");
    }
  }

  // 转换为十六进制并拼接
  const hexColor = rgbArray.map(value =>
    value.toString(16).padStart(2, "0"),
  ).join("");

  return `#${hexColor}`;
}

/**
 * 将RGBA数组转换为rgba(r,g,b,a)格式的字符串
 * @param {number[]} rgbaArray - 包含四个数字的RGBA数组 [R,G,B,A]
 * @return {string} rgba格式字符串，如 rgba(18,52,86,0.5)
 */
export function rgbaToString(rgbaArray: number[]) {
  // 验证RGB值
  for (let i = 0; i < 3; i++) {
    const value = rgbaArray[i];
    if (typeof value !== "number" || value < 0 || value > 255 || !Number.isInteger(value)) {
      throw new Error("RGB值必须是0-255之间的整数");
    }
  }

  // 验证Alpha值
  const alpha = rgbaArray[3];
  if (typeof alpha !== "number" || alpha < 0 || alpha > 255) {
    throw new Error("Alpha值必须是0-255之间的数字");
  }

  // 将Alpha值从0-255转换为0-1
  const normalizedAlpha = (alpha / 255).toFixed(2);

  // 返回rgba格式
  return `rgba(${rgbaArray[0]},${rgbaArray[1]},${rgbaArray[2]},${normalizedAlpha})`;
}


/**
 * 将数字数组转换为颜色代码
 * @param {number[]} colorArray - 包含3个或4个数字的数组 [R,G,B] 或 [R,G,B,A]
 * @return {string} 颜色代码，如果是3个数字则返回 #RRGGBB，如果是4个数字则返回 rgba(r,g,b,a)
 */
export function convertToColorCode(colorArray: number[] | string) {
  if (typeof colorArray === "string") {
    return colorArray;
  }
  // 验证输入是否为数组
  if (!Array.isArray(colorArray)) {
    throw new Error("输入必须是一个数组");
  }

  // 根据数组长度选择不同的处理方式
  if (colorArray.length === 3) {
    // RGB格式 - 转换为 #RRGGBB
    return rgbToHex(colorArray);
  } else if (colorArray.length === 4) {
    // RGBA格式 - 转换为 rgba(r,g,b,a)
    return rgbaToString(colorArray);
  } else {
    throw new Error("数组长度必须是3（RGB）或4（RGBA）");
  }
}

