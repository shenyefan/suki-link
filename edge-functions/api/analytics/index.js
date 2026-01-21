import { formatResponse, authenticate } from '../utils.js';

// Get date string (YYYY-MM-DD format) for a specific date, or current date if not provided
function getDateString(date) {
  const d = date || new Date();
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function onRequest({ request, env }) {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return formatResponse({}, 204);
  }

  // Authentication
  if (!(await authenticate(request, env))) {
    return formatResponse('Unauthorized', 401);
  }

  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date'); // Optional: specific date for ranking

    // Generate last 30 days
    const today = new Date();
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(getDateString(d));
    }

    // Get daily totals for last 30 days from daily_all
    const dailyAllKey = 'daily_all';
    const dailyAll = await Link.get(dailyAllKey, 'json') || {};
    
    const dailyStats = dates.map((dateStr) => {
      return {
        date: dateStr,
        clicks: dailyAll[dateStr] || 0,
      };
    });

    // Get link ranking for today (or specified date)
    const targetDate = date || dates[dates.length - 1];
    const rankingDate = targetDate;

    // Get daily links for the specified date from daily_links
    const dailyLinksKey = 'daily_links';
    const dailyLinks = await Link.get(dailyLinksKey, 'json') || {};
    const dateLinks = dailyLinks[rankingDate] || {};

    // Convert to array and sort by clicks descending
    const linkRankings = Object.entries(dateLinks)
      .map(([slug, clicks]) => ({
        slug: slug,
        clicks: clicks || 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 100); // Top 100

    // Get link details for top rankings
    const rankingsWithDetails = await Promise.all(
      linkRankings.map(async (item) => {
        const linkData = await Link.get(`link_${item.slug}`, 'json');
        return {
          slug: item.slug,
          clicks: item.clicks,
          url: linkData?.url || '',
          comment: linkData?.comment || '',
        };
      })
    );

    return formatResponse({
      dailyStats: dailyStats,
      linkRankings: rankingsWithDetails,
      date: rankingDate,
    }, 200, 'Retrieved successfully');
  } catch (err) {
    console.error(err);
    return formatResponse(err, 500);
  }
}
