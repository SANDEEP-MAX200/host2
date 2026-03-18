import axios from 'axios';

export async function expandShortUrl(url) {
  let current = url;
  const chain = [url];
  const maxRedirects = 10;

  try {
    for (let i = 0; i < maxRedirects; i++) {
      let res;
      try {
        const config = {
          maxRedirects: 0,
          // We allow 200 to check for Meta Refresh, and 3xx for standard redirects
          validateStatus: (status) => (status >= 200 && status < 400) || status === 405,
          timeout: 8000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          }
        };

        res = await axios.get(current, { ...config, maxContentLength: 1024 * 100 });
      } catch (err) {
        break;
      }

      // 1. Handle standard HTTP Redirects (301, 302, 307, 308)
      if (res.status >= 300 && res.status < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, current).href;
        if (nextUrl === current) break;
        current = nextUrl;
        chain.push(current);
        continue;
      }

      // 2. Handle HTML Meta Refresh Redirects (Common in Phishing/Masking)
      if (res.status === 200 && typeof res.data === 'string') {
        const metaMatch = res.data.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)["']/i);

        if (metaMatch && metaMatch[1]) {
          let nextUrl = metaMatch[1].replace(/['"]/g, '').trim();
          const absoluteUrl = new URL(nextUrl, current).href;

          if (absoluteUrl === current) break;
          current = absoluteUrl;
          chain.push(current);
          continue;
        }
      }

      break;
    }
  } catch (error) {
    console.error('Error expanding URL:', error.message);
  }

  return {
    originalUrl: url,
    expandedUrl: current,
    chain,
    redirectCount: chain.length - 1
  };
}
