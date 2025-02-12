import { Hono } from "hono";
let state = 0;

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/stateless-add", (c) => {
  const x = Number(c.req.query("x"));
  if (isNaN(x)) {
    return c.text("invalid x");
  }

  const y = Number(c.req.query("y"));
  if (isNaN(y)) {
    return c.text("invalid y");
  }

  state = x + y;
  return c.json({ state });
});

app.get("/add", (c) => {
  const y = Number(c.req.query("y"));
  if (isNaN(y)) {
    return c.text("invalid y");
  }

  state += y;
  return c.json({ state });
});

app.get("/reset", (c) => {
  state = 0;
  return c.json({ state });
});

export default {
  fetch: app.fetch,
  port: 8080,
};
