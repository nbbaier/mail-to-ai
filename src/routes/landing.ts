import { Hono } from "hono";
import type { Env } from "../types";

export const landing = new Hono<{ Bindings: Env }>();

landing.get("/", (c) => {
	return c.redirect("https://mail-to-ai.com");
});
