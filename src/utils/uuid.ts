/**
 * 生成UUID v4（随机UUID，保证全局唯一）
 * @returns 标准UUID字符串（如：1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed）
 */
export const generateUUID = (): string => {
  // 简化版UUID v4生成逻辑（兼容所有环境）
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * 生成带业务前缀的唯一ID（如：distanceSurveying_polyline_1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed）
 * @param prefix 业务前缀（如 'distanceSurveying_polyline'）
 * @returns 带前缀的唯一ID
 */
export const generateBizUniqueId = (prefix: string): string => {
  return `${prefix}_${generateUUID()}`;
};
