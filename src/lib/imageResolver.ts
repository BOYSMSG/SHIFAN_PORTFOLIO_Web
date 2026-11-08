/**
 * Helper to automatically resolve user-entered image URLs, including:
 * - Direct image links (https://i.ibb.co/..., https://i.imgur.com/..., etc.)
 * - ImgBB web pages (https://ibb.co/XXXX) -> auto-fetches direct image from og:image
 * - Full or truncated HTML embed snippets (<a href="https://ibb.co/..."><img src="..."/></a>)
 * - BBCode tags ([img]...[/img] or [url=...])
 * - Imgur page links (https://imgur.com/XXXX -> https://i.imgur.com/XXXX.png)
 */
export async function resolveCoverImageUrl(input: string): Promise<string> {
  if (!input || typeof input !== 'string') return '';
  let str = input.trim();

  // 1. If it's already a full direct image link from i.ibb.co
  if (/^https?:\/\/i\.ibb\.co\/[^\s"'>]+$/i.test(str)) {
    return str;
  }

  // 2. If it contains a complete direct image link somewhere in the text
  const directMatch = str.match(/https?:\/\/i\.ibb\.co\/[a-zA-Z0-9_\-./]+\.(?:png|jpg|jpeg|webp|gif)/i);
  if (directMatch && directMatch[0]) {
    return directMatch[0];
  }

  // 3. If there is an ibb.co viewer link (e.g. https://ibb.co/rfzmW2TZ or http://ibb.co/rfzmW2TZ)
  // whether pasted standalone or inside <a href="..."> / [url=...]
  const ibbViewerMatch = str.match(/https?:\/\/(?:www\.)?ibb\.co\/([a-zA-Z0-9]+)/i);
  if (ibbViewerMatch && ibbViewerMatch[0]) {
    const pageUrl = ibbViewerMatch[0];
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const html = await res.text();
        const ogMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i) ||
                        html.match(/<meta name=["']twitter:image["'] content=["']([^"']+)["']/i) ||
                        html.match(/<img[^>]+src=["'](https:\/\/i\.ibb\.co\/[^"']+)["']/i);
        if (ogMatch && ogMatch[1]) {
          return ogMatch[1].trim();
        }
      }
    } catch (e) {
      console.warn('Failed to resolve ibb.co page to direct image:', e);
    }
  }

  // 4. If user pasted HTML snippet with other image src
  const imgMatch = str.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    const src = imgMatch[1].trim();
    if (!src.endsWith('...') && !src.endsWith('..') && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
      return src;
    }
  }

  // 5. Imgur Page Link (https://imgur.com/XXXX -> https://i.imgur.com/XXXX.png)
  const imgurMatch = str.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/i);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.png`;
  }

  return str;
}
