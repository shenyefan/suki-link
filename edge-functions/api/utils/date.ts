/**
 * 日期处理工具类
 */

/**
 * 获取日期字符串（YYYY-MM-DD 格式）
 * @param date - 指定的日期，如果不提供则使用当前日期
 * @param timezone - 时区字符串，如果不提供则使用 UTC
 * @returns 格式化的日期字符串
 */
export function getDateString(date?: Date, timezone?: string): string {
  const d = date || new Date();
  
  if (timezone && typeof Intl !== 'undefined') {
    // 使用 Intl.DateTimeFormat 进行时区转换
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short'
    });
    
    // 格式化日期并提取 YYYY-MM-DD 部分
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    
    return `${year}-${month}-${day}`;
  } else {
    // 默认使用 UTC
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/**
 * 获取指定天数前的日期
 * @param days - 天数
 * @param date - 基准日期，如果不提供则使用当前日期
 * @param timezone - 时区字符串，如果不提供则使用 UTC
 * @returns 计算后的日期
 */
export function getDateDaysAgo(days: number, date?: Date, timezone?: string): Date {
  const d = date || new Date();
  const result = new Date(d.getTime());
  
  if (timezone && typeof Intl !== 'undefined') {
    // 使用 Intl.DateTimeFormat 进行时区转换，然后减去天数
    const formatter = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: timezone
    });
    
    // 先获取当前日期的 YYYY-MM-DD 格式
    const parts = formatter.formatToParts(result);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // 月份从 0 开始
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
    
    // 创建本地日期对象并减去天数
    const localDate = new Date(year, month, day);
    localDate.setDate(localDate.getDate() - days);
    
    // 转换回 UTC 时间
    return new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60 * 1000));
  } else {
    result.setUTCDate(result.getUTCDate() - days);
  }
  
  return result;
}

/**
 * 从请求中获取时区字符串
 * @param request - 请求对象
 * @returns 时区字符串，如果不存在则返回 undefined
 */
export function getTimezoneFromRequest(request: Request): string | undefined {
  try {
    const url = new URL(request.url);
    return url.searchParams.get('timezone');
  } catch {
    return undefined;
  }
}