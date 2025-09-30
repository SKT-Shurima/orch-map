/**
 * 模块：图标图集 IconAtlas
 * 说明：将若干 SVG 字符串 rasterize 到同一张 Canvas，生成可供 IconLayer 使用的 iconAtlas 与 iconMapping。
 * 性能与内存注意：
 * - 多个 SVG 需要逐个转 Image 后再绘制，数量大时耗时明显；
 * - 最终通过 toDataURL 生成 Base64 图片，字符串会占用较大内存，建议上层缓存与复用；
 * - 若可预知图标集，推荐离线构建并作为静态资源下发，减少运行时开销。
 */
// 定义图标映射接口
export interface IconMapping {
  [key: string]: {
    x: number
    y: number
     width: number
    height: number
    mask: boolean
  }
}

// 定义图标集合结果接口
export interface IconAtlasResult {
  iconAtlas: string
  iconMapping: IconMapping
}

export default class IconAtlas {
  /**
   * 将 SVG 字符串转为 HTMLImageElement
   */
  private static svgToImage(svgString: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const blob = new Blob([svgString], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)

      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error("Failed to load SVG"))
      }

      img.src = url
    })
  }

  // 构建图标集合的工具方法
  public static async buildIconAtlas(icons: { [key: string]: string }): Promise<IconAtlasResult> {
    const iconMapping: IconMapping = {}
    let canvasWidth = 0
    let canvasHeight = 0

    // 首先计算需要的画布大小
    for (const [iconName, iconSvg] of Object.entries(icons)) {
      const img = await IconAtlas.svgToImage(iconSvg)
      iconMapping[iconName] = {
        x: canvasWidth,
        y: 0,
        width: img.width,
        height: img.height,
        mask: true,
      }
      canvasWidth += img.width
      canvasHeight = Math.max(canvasHeight, img.height)
    }

    // 创建最终的图标图集
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get 2D context from canvas")
    }

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    // 绘制所有图标到一个图集中
    for (const [iconName, iconSvg] of Object.entries(icons)) {
      const img = await IconAtlas.svgToImage(iconSvg)
      const { x } = iconMapping[iconName]
      ctx.drawImage(img, x, 0)
    }

    return {
      iconAtlas: canvas.toDataURL(),
      iconMapping,
    }
  }
}
