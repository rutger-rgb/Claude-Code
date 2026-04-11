// Data layer — abstractie die met Supabase werkt als die geconfigureerd is,
// en anders terugvalt op localStorage. De modules praten alleen met deze
// laag, nooit rechtstreeks met Supabase of localStorage.

import { SUPABASE } from "../config.js";

const LS_PREFIX = "hgw2026:";
let client = null;
let mode = "local";
let initPromise = null;

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (SUPABASE.url && SUPABASE.anonKey) {
      try {
        const { createClient } = await import(
          "https://esm.sh/@supabase/supabase-js@2"
        );
        client = createClient(SUPABASE.url, SUPABASE.anonKey);
        mode = "supabase";
        console.info("[data] Supabase verbonden");
      } catch (err) {
        console.warn("[data] Supabase init mislukt, fallback naar local:", err);
        mode = "local";
      }
    } else {
      console.info("[data] Geen Supabase config — draait op localStorage");
    }
  })();
  return initPromise;
}

export function getMode() {
  return mode;
}

function lsRead(table) {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + table) || "[]");
  } catch {
    return [];
  }
}

function lsWrite(table, rows) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
}

function newId() {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export async function getAll(table, { order = "created_at", ascending = true } = {}) {
  await init();
  if (mode === "supabase") {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order(order, { ascending });
    if (error) throw error;
    return data || [];
  }
  const rows = lsRead(table);
  rows.sort((a, b) => {
    const av = a[order];
    const bv = b[order];
    if (av === bv) return 0;
    return (av > bv ? 1 : -1) * (ascending ? 1 : -1);
  });
  return rows;
}

export async function add(table, item) {
  await init();
  const payload = {
    ...item,
    created_at: item.created_at || new Date().toISOString(),
  };
  if (mode === "supabase") {
    const { data, error } = await client
      .from(table)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const rows = lsRead(table);
  const row = { id: newId(), ...payload };
  rows.push(row);
  lsWrite(table, rows);
  return row;
}

export async function update(table, id, changes) {
  await init();
  if (mode === "supabase") {
    const { data, error } = await client
      .from(table)
      .update(changes)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const rows = lsRead(table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...changes };
  lsWrite(table, rows);
  return rows[idx];
}

export async function remove(table, id) {
  await init();
  if (mode === "supabase") {
    const { error } = await client.from(table).delete().eq("id", id);
    if (error) throw error;
    return true;
  }
  const rows = lsRead(table).filter((r) => r.id !== id);
  lsWrite(table, rows);
  return true;
}

// Real-time subscribe — werkt alleen met Supabase. Bij local mode wordt de
// callback genegeerd (UI moet dan zelf refreshen na acties).
export async function subscribe(table, onChange) {
  await init();
  if (mode !== "supabase") return () => {};
  const channel = client
    .channel(`realtime:${table}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table },
      (payload) => onChange(payload)
    )
    .subscribe();
  return () => client.removeChannel(channel);
}

// Foto-upload — Supabase storage of base64 in localStorage.
export async function uploadPhoto(file) {
  await init();
  if (mode === "supabase") {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await client.storage
      .from("photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = client.storage.from("photos").getPublicUrl(path);
    return data.publicUrl;
  }
  // Local fallback: lees als base64 (niet ideaal voor grote bestanden)
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Init direct triggeren zodat logging zichtbaar is
init();
