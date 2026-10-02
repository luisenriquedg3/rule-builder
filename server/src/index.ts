import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { createDb } from "./db";

const port = Number(process.env.PORT ?? 3001);
serve({ fetch: createApp(createDb()).fetch, port }, () =>
  console.log(`API en http://localhost:${port}`),
);