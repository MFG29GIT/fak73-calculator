import { Hono } from "hono";
import { Client } from "pg";

const app = new Hono();

// 🔌 Datenbankverbindung initialisiere
async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Azure erfordert oft SSL
  });

  await client.connect();
  console.log("✅ Verbunden mit PostgreSQL");

  return client;
}

// 🌍 Globale Variable für die DB-Verbindung
let dbClient: Client;
initDatabase().then((client) => {
  dbClient = client;
});

// 📥 Aktuellen `state` abrufen
app.get("/state", async (c) => {
  if (!dbClient) return c.text("DB noch nicht verbunden", 500);
  const result = await dbClient.query(
    "SELECT state FROM calculator_state LIMIT 1"
  );
  return c.json({ state: result.rows[0].state });
});

// ➕ Zwei Zahlen addieren (ohne DB-Speicherung)
app.get("/stateless-add", async (c) => {
  const x = Number(c.req.query("x"));
  const y = Number(c.req.query("y"));

  if (isNaN(x) || isNaN(y)) {
    return c.text("Ungültige Eingabe", 400);
  }

  return c.json({ result: x + y });
});

// ➕ `state`-Wert erhöhen
app.get("/add", async (c) => {
  const y = Number(c.req.query("y"));
  if (isNaN(y)) {
    return c.text("Ungültige Eingabe", 400);
  }

  const result = await dbClient.query(
    "UPDATE calculator_state SET state = state + $1 RETURNING state",
    [y]
  );
  return c.json({ state: result.rows[0].state });
});

// 🔄 `state` auf 0 setzen
app.get("/reset", async (c) => {
  await dbClient.query("UPDATE calculator_state SET state = 0");
  return c.json({ state: 0 });
});

// App exportieren
export default {
  fetch: app.fetch,
  port: 8080,
};
