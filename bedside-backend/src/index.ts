import Fastify from "fastify";
import { config } from "./config.js";
import { supabase } from "./supabase.js";
import { webhookRoutes } from "./routes/webhook.js";
import { adminRoutes } from "./routes/admin.js";
import { familyRoutes } from "./routes/family.js";

const server = Fastify({ logger: true });

server.get("/", async () => {
  return { status: "Bedside is running" };
});

server.get("/health", async (_request, reply) => {
  const { data, error } = await supabase.from("hospitals").select("*").limit(1);
  if (error) {
    return reply.status(503).send({ status: "error", message: error.message });
  }
  return { status: "healthy", hospitals: data };
});

// Register route modules
server.register(webhookRoutes);
server.register(adminRoutes);
server.register(familyRoutes);

const start = async () => {
  try {
    await server.listen({ port: config.port, host: "0.0.0.0" });
    console.log(`Bedside backend running on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export { server };
