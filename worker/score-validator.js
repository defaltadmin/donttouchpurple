export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const data = await request.json();
      const ip = request.headers.get("cf-connecting-ip") || "unknown";

      // === Rate Limiting with KV ===
      const rateKey = `rate:${ip}:${(data.initials || 'anon').toLowerCase()}`;
      const now = Date.now();
      let attempts = await env.RATE_LIMIT_KV.get(rateKey, { type: "json" }) || [];

      attempts = attempts.filter(ts => now - ts < 60000); // 1 minute

      if (attempts.length >= 8) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        });
      }

      attempts.push(now);
      await env.RATE_LIMIT_KV.put(rateKey, JSON.stringify(attempts), { expirationTtl: 90 });

      // === Validation ===
      if (typeof data.score !== "number" || data.score < 0 || data.score > 9999) {
        return new Response(JSON.stringify({ error: "Invalid score" }), { status: 400 });
      }
      if (!data.initials || typeof data.initials !== "string" || data.initials.length > 8) {
        return new Response(JSON.stringify({ error: "Invalid initials" }), { status: 400 });
      }
      if (!data.mode || !["classic", "evolve"].includes(data.mode)) {
        return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400 });
      }
      if (data.tick && data.score > data.tick * 15 + 300) {
        return new Response(JSON.stringify({ error: "Impossible score" }), { status: 400 });
      }

      // === Forward to Firebase ===
      const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/lb_global`;

      const payload = {
        fields: {
          score: { integerValue: data.score.toString() },
          initials: { stringValue: data.initials },
          mode: { stringValue: data.mode },
          badge: { stringValue: data.badge || "" },
          date: { stringValue: data.date || new Date().toISOString().split("T")[0] },
          ts: { timestampValue: new Date().toISOString() }
        }
      };

      const fbResponse = await fetch(`${firebaseUrl}?documentId=auto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.FIREBASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!fbResponse.ok) {
        const errText = await fbResponse.text();
        console.error("Firebase write failed:", errText);
        return new Response(JSON.stringify({ error: "Database error" }), { status: 502 });
      }

      return new Response(JSON.stringify({ success: true, score: data.score }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Worker error:", err);
      return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
  }
};
