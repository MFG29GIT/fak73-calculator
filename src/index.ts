import { Hono } from "hono";
import { Client } from "pg";

const app = new Hono();

// 🔌 Datenbankverbindung initialisieren
async function initDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Azure erfordert oft SSL
  });

  await client.connect();
  console.log("✅ Verbunden mit PostgreSQL");

  // Stelle sicher, dass die `calculator_state`-Tabelle existiert
  // await client.query(`
  //   CREATE TABLE IF NOT EXISTS calculator_state (
  //     id SERIAL PRIMARY KEY,
  //     value INTEGER NOT NULL DEFAULT 0
  //   );
  // `);

  // Falls kein Eintrag existiert, initialisieren
  // await client.query(`
  //   INSERT INTO calculator_state (value)
  //   SELECT 0
  //   WHERE NOT EXISTS (SELECT 1 FROM calculator_state);
  // `);

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
    "SELECT value FROM calculator_state LIMIT 1"
  );
  return c.json({ state: result.rows[0].value });
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
    "UPDATE calculator_state SET value = value + $1 RETURNING value",
    [y]
  );
  return c.json({ state: result.rows[0].value });
});

// 🔄 `state` auf 0 setzen
app.get("/reset", async (c) => {
  await dbClient.query("UPDATE calculator_state SET value = 0");
  return c.json({ state: 0 });
});

// App exportieren
export default {
  fetch: app.fetch,
  port: 8080,
};
