/**
 * Worker Environment Types
 * Auto-generated type definitions for worker bindings
 */

import { worker } from "./alchemy.run.js";


// Use this type for your worker environment
export type Env = typeof worker.Env;


/**
 * Usage in your worker:
 * 
 * import type { Env } from "./worker-env";
 * 
 * export default {
 *   async fetch(request: Request, env: Env, ctx: ExecutionContext) {
 *     // env is fully typed with all your bindings
 *     const value = await env.CACHE.get("key");
 *     return new Response("OK");
 *   }
 * };
 */