/**
 * 模块：球体几何体工具
 * 说明：用于生成地球球体的几何体数据，供 SimpleMeshLayer 使用
 */

/**
 * 球体几何体数据结构
 */
export interface SphereGeometry {
  attributes: {
    positions: {
      value: Float32Array;
      size: number;
    };
    normals: {
      value: Float32Array;
      size: number;
    };
    texCoords: {
      value: Float32Array;
      size: number;
    };
  };
  indices: Uint16Array;
}

/**
 * 创建球体几何体
 * @param radius - 球体半径（米）
 * @param nlat - 纬度方向的分段数
 * @param nlong - 经度方向的分段数
 * @returns 球体几何体数据
 */
export function createSphereGeometry(
  radius: number,
  nlat: number = 18,
  nlong: number = 36,
): SphereGeometry {
  // 参数验证
  if (typeof radius !== "number" || isNaN(radius) || radius <= 0) {
    throw new Error(`Invalid radius: ${radius}. Must be a positive number.`);
  }
  if (typeof nlat !== "number" || isNaN(nlat) || nlat < 1 || !Number.isInteger(nlat)) {
    throw new Error(`Invalid nlat: ${nlat}. Must be a positive integer.`);
  }
  if (typeof nlong !== "number" || isNaN(nlong) || nlong < 1 || !Number.isInteger(nlong)) {
    throw new Error(`Invalid nlong: ${nlong}. Must be a positive integer.`);
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const texCoords: number[] = [];
  const indices: number[] = [];

  // 生成球体顶点
  for (let lat = 0; lat <= nlat; lat++) {
    const theta = (lat * Math.PI) / nlat;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= nlong; lon++) {
      const phi = (lon * 2 * Math.PI) / nlong;
      const sinPhi = Math.sin(phi);
      const cosPhi = Math.cos(phi);

      const x = cosPhi * sinTheta;
      const y = cosTheta;
      const z = sinPhi * sinTheta;

      positions.push(radius * x, radius * y, radius * z);
      normals.push(x, y, z);
      texCoords.push(lon / nlong, lat / nlat);
    }
  }

  // 生成索引
  for (let lat = 0; lat < nlat; lat++) {
    for (let lon = 0; lon < nlong; lon++) {
      const first = lat * (nlong + 1) + lon;
      const second = first + nlong + 1;

      indices.push(first, second, first + 1);
      indices.push(second, second + 1, first + 1);
    }
  }

  return {
    attributes: {
      positions: {
        value: new Float32Array(positions),
        size: 3,
      },
      normals: {
        value: new Float32Array(normals),
        size: 3,
      },
      texCoords: {
        value: new Float32Array(texCoords),
        size: 2,
      },
    },
    indices: new Uint16Array(indices),
  };
}

/**
 * 地球半径（米）
 */
export const EARTH_RADIUS_METERS = 6.3e6;

