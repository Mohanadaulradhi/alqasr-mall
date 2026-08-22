/* ====== جلب منشورات فيسبوك وانستقرام تلقائيًا ======
   يعمل كدالة خادمية على Cloudflare Pages (نفس نطاق الموقع).
   المتغيرات البيئية المطلوبة (تُضاف من لوحة تحكم Cloudflare):
     FACEBOOK_PAGE_ID    مثل: 123456789
     FACEBOOK_PAGE_TOKEN رمز صفحة فيسبوك طويل الأمد
     INSTAGRAM_USER_ID   معرف حساب انستقرام الاحترافي (Business)
     INSTAGRAM_TOKEN     رمز انستقرام الاحترافي طويل الأمد
   إن لم تكن المتغيرات مضبوطة يرجع الموقع محتواه الثابت كالمعتاد. */

const CACHE_TTL = 600;

async function fetchFacebook(env) {
  if (!env.FACEBOOK_PAGE_ID || !env.FACEBOOK_PAGE_TOKEN) return [];
  const url =
    "https://graph.facebook.com/v21.0/" +
    encodeURIComponent(env.FACEBOOK_PAGE_ID) +
    "/posts?fields=id,message,created_time,permalink_url,full_picture,attachments{media{image}}&limit=10&access_token=" +
    encodeURIComponent(env.FACEBOOK_PAGE_TOKEN);
  const res = await fetch(url);
  const data = await res.json();
  const out = [];
  if (Array.isArray(data.data)) {
    for (const p of data.data) {
      if (!p.message) continue;
      let image = p.full_picture || "";
      if (!image && p.attachments && Array.isArray(p.attachments.data)) {
        const m = p.attachments.data.find((a) => a.media && a.media.image);
        if (m) image = m.media.image.src || "";
      }
      out.push({
        id: "fb-" + p.id,
        source: "facebook",
        title: extractTitle(p.message),
        message: p.message,
        date: p.created_time || "",
        url: p.permalink_url || "",
        image: image,
      });
    }
  }
  return out;
}

async function fetchInstagram(env) {
  if (!env.INSTAGRAM_USER_ID || !env.INSTAGRAM_TOKEN) return [];
  const url =
    "https://graph.instagram.com/v21.0/" +
    encodeURIComponent(env.INSTAGRAM_USER_ID) +
    "/media?fields=id,caption,timestamp,permalink,media_type,media_url,thumbnail_url&limit=10&access_token=" +
    encodeURIComponent(env.INSTAGRAM_TOKEN);
  const res = await fetch(url);
  const data = await res.json();
  const out = [];
  if (Array.isArray(data.data)) {
    for (const p of data.data) {
      if (!p.caption) continue;
      out.push({
        id: "ig-" + p.id,
        source: "instagram",
        title: extractTitle(p.caption),
        message: p.caption,
        date: p.timestamp || "",
        url: p.permalink || "",
        image: p.media_type === "VIDEO" ? p.thumbnail_url || "" : p.media_url || "",
      });
    }
  }
  return out;
}

function extractTitle(text) {
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim().replace(/^\s*#\S+\s*/g, ""))
    .filter(Boolean);
  let t = lines[0] || "";
  t = t.replace(/(https?:\/\/\S+)/g, "").replace(/#\w+/g, " ").replace(/\s+/g, " ").trim();
  if (!t) t = lines[1] || "منشور جديد";
  if (t.length > 80) t = t.slice(0, 80) + "…";
  return t;
}

export async function onRequest(context) {
  const { env, waitUntil } = context;
  const cache = caches.default;
  const cacheKey = new Request("https://alqasrmall.pages.dev/api/news", { method: "GET" });

  try {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=" + CACHE_TTL,
        },
      });
    }
  } catch (e) {
    /* تجاهل أخطاء الكاش */
  }

  const all = [];
  try {
    all.push(...(await fetchFacebook(env)));
  } catch (e) {
    /* تابع دون منشورات فيسبوك */
  }
  try {
    all.push(...(await fetchInstagram(env)));
  } catch (e) {
    /* تابع دون منشورات انستقرام */
  }

  all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const body = JSON.stringify({
    updated: new Date().toISOString(),
    count: all.length,
    posts: all,
  });

  const response = new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=" + CACHE_TTL,
    },
  });

  try {
    waitUntil(cache.put(cacheKey, response.clone()));
  } catch (e) {
    /* تجاهل أخطاء الكاش */
  }

  return response;
}
