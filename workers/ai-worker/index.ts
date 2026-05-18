import { streamText } from "ai";
import { createWorkersAI } from "workers-ai-provider";

export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Add CORS headers
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const { messages } = await request.json() as any;
      const workersAi = createWorkersAI({ binding: env.AI });

      const result = streamText({
        model: workersAi("@cf/moonshotai/kimi-k2.5"),
        system: "You are a helpful assistant that can do various tasks using MCP tools.",
        temperature: 1,
        messages: messages || [],
      });

      const response = result.toTextStreamResponse();
      
      // Add CORS headers to the response
      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", "*");
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error: any) {
      return new Response(error.message, { status: 500 });
    }
  },
};
