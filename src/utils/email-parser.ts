/**
 * Email parsing utilities for converting inbound webhooks to internal format
 */

import {
	getEmailHtml,
	getEmailText,
	getSenderInfo,
	type InboundWebhookPayload,
} from "@inboundemail/sdk";

import type { ParsedEmail } from "../types";

/**
 * Parse inbound webhook payload into our internal email format
 */
export function parseInboundEmail(payload: InboundWebhookPayload): ParsedEmail {
	const { email } = payload;

	// Use SDK helper to get sender info
	const senderInfo = getSenderInfo(email);

	// Use SDK helper to get text content
	const bodyText = getEmailText(email);
	const bodyHtml = getEmailHtml(email);

	// Get parsed data for more details
	const { parsedData, cleanedContent } = email;

	return {
		id: email.id,
		from: {
			email:
				senderInfo.address ||
				extractEmailFromText(email.from?.text) ||
				"unknown@unknown.com",
			name: senderInfo.name || undefined,
		},
		to: email.recipient, // Use recipient field directly - it's the clean email address
		cc: extractCcAddresses(parsedData.cc),
		subject: email.subject || "(no subject)",
		body: cleanTextBody(bodyText || parsedData.textBody || ""),
		html: bodyHtml || parsedData.htmlBody || undefined,
		threadId: email.threadId || email.messageId || email.id,
		messageId: email.messageId || email.id,
		inReplyTo: parsedData.inReplyTo || undefined,
		references: parsedData.references || [],
		attachments: cleanedContent.attachments.map((att) => ({
			filename: att.filename || "unnamed",
			contentType: att.contentType || "application/octet-stream",
			size: att.size || 0,
			url: att.downloadUrl,
		})),
		receivedAt: new Date(email.receivedAt),
	};
}

/**
 * Extract CC addresses from parsed data
 */
function extractCcAddresses(
	cc: { addresses?: Array<{ address?: string | null }> } | null,
): string[] {
	if (!cc?.addresses) return [];
	return cc.addresses
		.map((addr) => addr.address)
		.filter((addr): addr is string => Boolean(addr));
}

/**
 * Extract email from text like "Name <email@domain.com>" or just "email@domain.com"
 */
function extractEmailFromText(text: string | undefined | null): string | null {
	if (!text) return null;
	const match = text.match(/<([^>]+)>/) || text.match(/([^\s<>]+@[^\s<>]+)/);
	return match ? match[1] : null;
}

/**
 * Clean plain text body by removing signatures and quoted replies
 */
function cleanTextBody(text: string): string {
	let cleaned = text;

	// Remove common email signatures
	const signaturePatterns = [
		/^--\s*$/m, // Standard signature delimiter
		/^Sent from my iPhone$/m,
		/^Sent from my iPad$/m,
		/^Sent from my Android$/m,
		/^Get Outlook for iOS$/m,
		/^Get Outlook for Android$/m,
		/^Sent from Mail for Windows$/m,
	];

	for (const pattern of signaturePatterns) {
		const match = cleaned.match(pattern);
		if (match?.index !== undefined) {
			cleaned = cleaned.substring(0, match.index);
		}
	}

	// Remove quoted replies (lines starting with >)
	const lines = cleaned.split("\n");
	const contentLines: string[] = [];

	for (const line of lines) {
		// Stop at quoted content
		if (line.trim().startsWith(">")) break;
		// Stop at "On ... wrote:" patterns
		if (/^On .+ wrote:$/i.test(line.trim())) break;
		contentLines.push(line);
	}

	return contentLines.join("\n").trim();
}

/**
 * Extract the local part (before @) of an email address
 */
export function extractLocalPart(email: string): string {
	return email.split("@")[0].toLowerCase();
}

/**
 * Extract the agent name from an email address
 * e.g., "write-haiku-about-cats@mail-to-ai.com" -> "write-haiku-about-cats"
 */
export function extractAgentName(toAddress: string): string {
	return extractLocalPart(toAddress);
}
