import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare global {
  type Env = CloudflareEnv;
}
