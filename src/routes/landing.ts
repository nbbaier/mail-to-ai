import { Hono } from "hono";
import { html } from "hono/html";
import type { Env } from "../types";

export const landing = new Hono<{ Bindings: Env }>();

const DOMAIN = "mail-to-ai.com";

const landingPage = () => html`
`;

landing.get("/", (c) => {
	return c.html(landingPage());
});
