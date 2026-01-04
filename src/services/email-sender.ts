/**
 * Email sender service using inbound.new SDK
 */

import { Inbound } from "@inboundemail/sdk";
import type { EmailReply } from "../types";

/**
 * Create an Inbound client
 */
export function createInboundClient(apiKey: string): Inbound {
	return new Inbound(apiKey);
}

/**
 * Send an email reply using the Inbound SDK
 */
export async function sendEmailReply(
	inbound: Inbound,
	reply: EmailReply,
): Promise<{ success: boolean; error?: string }> {
	try {
		const { data, error } = await inbound.emails.send({
			from: reply.from,
			to: reply.to,
			subject: reply.subject,
			text: reply.body,
			html: reply.html,
			headers: {
				...(reply.inReplyTo && { "In-Reply-To": reply.inReplyTo }),
				...(reply.references &&
					reply.references.length > 0 && {
						References: reply.references.join(" "),
					}),
			},
		});

		if (error) {
			console.error("Failed to send email:", error);
			return { success: false, error };
		}

		console.log(`Email sent successfully: ${data?.id}`);
		return { success: true };
	} catch (error) {
		console.error("Email send error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

/**
 * Send an error email to the user
 */
export async function sendErrorEmail(
	inbound: Inbound,
	to: string,
	subject: string,
	originalMessageId: string,
	errorMessage: string,
	fromAddress: string,
): Promise<void> {
	const body = `We encountered an error processing your request:

${errorMessage}

If this persists, please try again later or contact support.

---
Mail-to-AI Service`;

	await sendEmailReply(inbound, {
		to,
		from: `Mail-to-AI <${fromAddress}>`,
		subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
		body,
		inReplyTo: originalMessageId,
		references: [originalMessageId],
	});
}

/**
 * Send a rate limit notification email
 */
export async function sendRateLimitEmail(
	inbound: Inbound,
	to: string,
	subject: string,
	originalMessageId: string,
	resetAt: Date,
	fromAddress: string,
): Promise<void> {
	const resetTime = resetAt.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "UTC",
	});

	const body = `You've reached your hourly limit of email requests.

Your limit will reset at ${resetTime} UTC.

Please try again after that time.

---
Mail-to-AI Service`;

	await sendEmailReply(inbound, {
		to,
		from: `Mail-to-AI <${fromAddress}>`,
		subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
		body,
		inReplyTo: originalMessageId,
		references: [originalMessageId],
	});
}
