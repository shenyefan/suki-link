import { formatResponse, authenticate, EdgeOneContext, getDateString, getDateDaysAgo, getTimezoneFromRequest } from '../utils/common.js';

/**
 * 每日统计数据接口
 */
interface DailyStat {
  date: string;
  clicks: number;
}

/**
 * 链接排名数据接口
 */
interface LinkRanking {
  slug: string;
  clicks: number;
  url: string;
  comment: string;
}

/**
 * 分析数据响应接口
 */
interface AnalyticsResponse {
  dailyStats: DailyStat[];
  linkRankings: LinkRanking[];
  date: string;
}

/**
 * 分析 API 处理函数
 * 获取最近 30 天的每日统计数据和指定日期的链接排名
 */
export async function onRequest(context: EdgeOneContext): Promise<Response> {
  const { request, env } = context;

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  // 身份验证
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date'); // 可选：指定日期用于排名
    const timezone = getTimezoneFromRequest(request);

    // 生成最近 30 天的日期列表
    const today = new Date();
    const dates: string[] = [];
    
    // 从今天开始，向前推30天
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime());
      // 减去i天，得到正确的日期
      d.setDate(d.getDate() - i);
      // 通过 getDateString 函数处理时区
      dates.push(getDateString(d, timezone));
    }

    // 从 daily_all 获取最近 30 天的每日总数
    const dailyAllKey = 'daily_all';
    const dailyAll = ((await (Link as KVNamespace).get(dailyAllKey, 'json')) || {}) as Record<string, number>;

    const dailyStats: DailyStat[] = dates.map((dateStr) => {
      return {
        date: dateStr,
        clicks: dailyAll[dateStr] || 0,
      };
    });

    // 获取今天（或指定日期）的链接排名
    const targetDate = date || dates[dates.length - 1];
    const rankingDate = targetDate;

    // 从 daily_links 获取指定日期的每日链接数据
    const dailyLinksKey = 'daily_links';
    const dailyLinks = ((await (Link as KVNamespace).get(dailyLinksKey, 'json')) || {}) as Record<
      string,
      Record<string, number>
    >;
    const dateLinks = dailyLinks[rankingDate] || {};

    // 转换为数组并按点击量降序排序
    const linkRankings: LinkRanking[] = Object.entries(dateLinks)
      .map(([slug, clicks]) => ({
        slug: slug,
        clicks: clicks || 0,
        url: '',
        comment: '',
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 100); // 前 100 名

    // 获取排名链接的详细信息
    const rankingsWithDetails: LinkRanking[] = await Promise.all(
      linkRankings.map(async (item) => {
        const linkData = (await (Link as KVNamespace).get(`link_${item.slug}`, 'json')) as {
          url?: string;
          comment?: string;
        } | null;
        return {
          slug: item.slug,
          clicks: item.clicks,
          url: linkData?.url || '',
          comment: linkData?.comment || '',
        };
      })
    );

    return formatResponse<AnalyticsResponse>(
      {
        dailyStats: dailyStats,
        linkRankings: rankingsWithDetails,
        date: rankingDate,
      },
      200,
      'Retrieved successfully'
    );
  } catch (err) {
    console.error(err);
    return formatResponse(err, 500);
  }
}
