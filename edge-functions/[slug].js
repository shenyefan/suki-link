// Get date string (YYYY-MM-DD format) for a specific date, or current date if not provided
function getDateString(date) {
    const d = date || new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Record access statistics
async function recordAccess(slug, request) {
    try {
        const dateStr = getDateString();
        
        // Update daily_all - stores last 30 days of total clicks
        const dailyAllKey = 'daily_all';
        let dailyAll = await Link.get(dailyAllKey, 'json') || {};
        
        // Increment today's count
        dailyAll[dateStr] = (dailyAll[dateStr] || 0) + 1;
        
        // Clean up data older than 30 days
        const cutoffDate = new Date();
        cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 30);
        const cutoffDateStr = getDateString(cutoffDate);
        
        Object.keys(dailyAll).forEach(key => {
            if (key < cutoffDateStr) {
                delete dailyAll[key];
            }
        });
        
        await Link.put(dailyAllKey, JSON.stringify(dailyAll));
        
        // Update daily_links - stores all dates and links' clicks
        const dailyLinksKey = 'daily_links';
        let dailyLinks = await Link.get(dailyLinksKey, 'json') || {};
        
        // Initialize date if not exists
        if (!dailyLinks[dateStr]) {
            dailyLinks[dateStr] = {};
        }
        
        // Increment slug's count for this date
        dailyLinks[dateStr][slug] = (dailyLinks[dateStr][slug] || 0) + 1;
        
        // Clean up data older than 30 days
        Object.keys(dailyLinks).forEach(key => {
            if (key < cutoffDateStr) {
                delete dailyLinks[key];
            }
        });
        
        await Link.put(dailyLinksKey, JSON.stringify(dailyLinks));
    } catch (err) {
        // Silently fail - don't block redirect
        console.error('Error recording access:', err);
    }
}

export async function onRequest({ request, env }) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Root path handling: Pass through to Next.js origin (handled by page.tsx)
    if (path === '/') {
        return fetch(request);
    }

    // 2. Extract and clean the slug
    const slug = path.replace(/^\/|\/$/g, ''); // Remove leading and trailing slashes

    // 3. Define Reserved Paths and Patterns
    const reservedSlugs = [
        'dashboard',
        'login',
        'analytics',
        'expired',
        'api',
        '_next',
        'logo.svg',
        'favicon.ico',
        'robots.txt',
        'sitemap.xml'
    ];

    const slugRegex = /^[a-z0-9_]+$/i;
    const isStaticFile = path.match(/\.[a-zA-Z0-9]+$/);

    // 4. Determine if we should attempt redirection
    const shouldRedirect =
        !reservedSlugs.some(reserved => slug.startsWith(reserved)) &&
        slugRegex.test(slug) &&
        !isStaticFile;

    if (shouldRedirect) {
        try {
            const data = await Link.get(`link_${slug.toLowerCase()}`, 'json');
            if (data && data.url) {
                const statusCode = parseInt(env.REDIRECT_STATUS_CODE) || 302;

                // Check for expiration
                if (data.expiration) {
                    const now = Math.floor(Date.now() / 1000);
                    if (now > data.expiration) {
                        const expiredUrl = new URL('/expired', request.url);
                        return Response.redirect(expiredUrl.toString(), 302);
                    }
                }

                let targetUrl = data.url;
                if (env.REDIRECT_WITH_QUERY === 'true' || env.REDIRECT_WITH_QUERY === true) {
                    const originUrl = new URL(request.url);
                    if (originUrl.search) {
                        const destUrl = new URL(targetUrl);
                        // Combine query parameters
                        for (const [key, value] of originUrl.searchParams) {
                            destUrl.searchParams.set(key, value);
                        }
                        targetUrl = destUrl.toString();
                    }
                }

                // Record access statistics (fire-and-forget, don't block redirect)
                recordAccess(slug.toLowerCase(), request).catch(err => {
                    console.error('Failed to record access:', err);
                });

                return Response.redirect(targetUrl, statusCode);
            }
        } catch (err) {
            console.error('KV Error:', err);
        }
    }

    // 5. Fallback: Pass-through to origin
    return fetch(request);
}
