/**
 * Webhook routes for receiving inbound emails
 */

import {
	Inbound,
	type InboundWebhookPayload,
	isInboundWebhook,
	verifyWebhookFromHeaders,
} from "@inboundemail/sdk";
import { Hono } from "hono";
import type { Env, QueueMessage } from "../types";
import { parseInboundEmail } from "../utils/email-parser";

const webhook = new Hono<{ Bindings: Env }>();

/**
 * POST /webhook/inbound
 * Receives emails from inbound.new and queues them for processing
 */
webhook.post("/inbound", async (c) => {
	const startTime = Date.now();

	try {
		// Verify webhook signature
		const inbound = new Inbound(c.env.INBOUND_API_KEY);
		const isValid = await verifyWebhookFromHeaders(c.req.raw.headers, inbound);
		if (!isValid) {
			console.error("Webhook signature verification failed");
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Parse the webhook payload
		const payload = (await c.req.json()) as InboundWebhookPayload;

		// Validate webhook using inbound SDK
		if (!isInboundWebhook(payload)) {
			console.error("Invalid webhook payload received");
			return c.json({ error: "Invalid webhook payload" }, 400);
		}

		// Parse the email into our internal format
		const email = parseInboundEmail(payload);

		console.log(
			`Received email ${email.id} from ${email.from.email} to ${email.to}`,
		);

		// Validate the recipient domain
		const recipientDomain = email.to.split("@")[1];
		if (recipientDomain !== c.env.ALLOWED_DOMAIN) {
			console.warn(`Rejected email to unauthorized domain: ${recipientDomain}`);
			return c.json({ error: "Unauthorized recipient domain" }, 403);
		}

		// Create queue message
		const queueMessage: QueueMessage = {
			email,
			queuedAt: new Date().toISOString(),
		};

		// Queue the email for async processing
		await c.env.EMAIL_QUEUE.send(queueMessage);

		const duration = Date.now() - startTime;
		console.log(`Queued email ${email.id} in ${duration}ms`);

		// Respond quickly to the webhook (must be under 5s)
		return c.json({
			received: true,
			emailId: email.id,
			queuedAt: queueMessage.queuedAt,
		});
	} catch (error) {
		console.error("Webhook processing error:", error);
		return c.json(
			{
				error: "Failed to process webhook",
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

export { webhook };
