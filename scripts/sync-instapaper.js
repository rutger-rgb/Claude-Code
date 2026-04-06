#!/usr/bin/env node
/**
 * Instapaper → Supabase sync script
 * Runs via GitHub Actions cron every 15 minutes.
 *
 * 1. Fetches the public Instapaper profile page (no CORS from server-side)
 * 2. Parses article links from the HTML
 * 3. Compares against existing articles in Supabase
 * 4. Inserts any new ones → triggers realtime → Jurriën gets notified
 */

const INSTAPAPER_URL = process.env.INSTAPAPER_URL || "https://www.instapaper.com/p/brrrtttssss";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://ryknakhvromgjpkmeccr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_CWVHYWFXNwRQWnIfSgCBNg_0xDfHNbd";

async function main() {
  console.log(`Fetching ${INSTAPAPER_URL}...`);

  // 1. Fetch the public profile page (server-side, no CORS issues)
  const res = await fetch(INSTAPAPER_URL, {
    headers: { "User-Agent": "HammerheadHQ-Sync/1.0" },
  });
  if (!res.ok) {
    console.error(`Instapaper returned ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();
  console.log(`Got ${html.length} bytes of HTML`);

  // 2. Parse articles from HTML
  const items = parseArticles(html);
  console.log(`Parsed ${items.length} articles`);
  if (items.length === 0) {
    console.log("No articles found, exiting.");
    return;
  }

  // 3. Get existing article URLs from Supabase
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/articles?select=url`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  const existing = existingRes.ok ? await existingRes.json() : [];
  const knownUrls = new Set(existing.map((a) => a.url));
  console.log(`${knownUrls.size} articles already in Supabase`);

  // 4. Insert new items
  let newCount = 0;
  for (const item of items) {
    if (knownUrls.has(item.url)) continue;
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/articles`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        title: item.title,
        url: item.url,
        description: item.desc || null,
      }),
    });
    if (insertRes.ok || insertRes.status === 201) {
      newCount++;
      console.log(`  ✓ Inserted: ${item.title}`);
    } else {
      console.warn(`  ✗ Failed to insert: ${item.title} (${insertRes.status})`);
    }
  }

  console.log(`Done. ${newCount} new articles pushed to Supabase.`);
}

function parseArticles(html) {
  const items = [];
  const seen = new Set();

  // Strategy 1: find <article> elements with outbound links
  // Since we're in Node (no DOM), use regex-based parsing
  const articleBlocks = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || [];

  for (const block of articleBlocks) {
    // Find first outbound link
    const linkMatch = block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const url = linkMatch[1];
    if (!url || url.includes("instapaper.com") || url.startsWith("/") || url.startsWith("#")) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    // Extract title: link text or heading
    let title = linkMatch[2].replace(/<[^>]+>/g, "").trim();
    const headingMatch = block.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
    if (headingMatch) {
      const headingText = headingMatch[1].replace(/<[^>]+>/g, "").trim();
      if (headingText.length > title.length) title = headingText;
    }

    // Extract description
    const descMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim().slice(0, 240) : "";

    if (title.length >= 4) {
      items.push({ title: title.slice(0, 200), url, desc });
    }
  }

  // Strategy 2: fallback — find all outbound links with substantial text
  if (items.length === 0) {
    const allLinks = html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
    for (const m of allLinks) {
      const url = m[1];
      if (url.includes("instapaper.com")) continue;
      if (seen.has(url)) continue;
      const title = m[2].replace(/<[^>]+>/g, "").trim();
      if (title.length < 15) continue;
      seen.add(url);
      items.push({ title: title.slice(0, 200), url, desc: "" });
    }
  }

  return items;
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
