(function () {
  let client = null;
  let ready = null;

  async function config() {
    if (ready) return ready;
    ready = fetch("/api/public-config")
      .then((res) => res.json())
      .catch(() => ({ configured: false }));
    return ready;
  }

  async function db() {
    const cfg = await config();
    if (!cfg || !cfg.configured || !window.supabase) return null;
    if (!client) client = window.supabase.createClient(cfg.url, cfg.anonKey);
    return client;
  }

  window.Cloud = {
    async push(data) {
      const supabase = await db();
      if (!supabase) return;
      await supabase.from("app_state").upsert({
        id: "main",
        data,
        updated_at: new Date().toISOString(),
      });
    },
    async pull() {
      const supabase = await db();
      if (!supabase) return null;
      const { data, error } = await supabase.from("app_state").select("data").eq("id", "main").maybeSingle();
      if (error || !data) return null;
      return data.data;
    },
  };
})();
