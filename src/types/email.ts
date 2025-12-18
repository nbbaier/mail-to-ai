/**
 * Email types for the mail-to-ai service
 */

export interface EmailAddress {
	email: string;
	name?: string;
}

export interface Attachment {
	filename: string;
	contentType: string;
	size: number;
	url?: string;
}

/**
 * Parsed email representation used internally
 */
export interface ParsedEmail {
	id: string;
	from: EmailAddress;
	to: string;
	cc: string[];
	subject: string;
	body: string;
	html?: string;
	threadId?: string;
	messageId: string;
	inReplyTo?: string;
	references: string[];
	attachments: Attachment[];
	receivedAt: Date;
}

/**
 * Email reply structure for sending responses
 */
export interface EmailReply {
	to: string;
	from: string;
	subject: string;
	body: string;
	html?: string;
	inReplyTo?: string;
	references?: string[];
}

/**
 * Queue message format for async processing
 */
export interface QueueMessage {
	email: ParsedEmail;
	attempt: number;
	queuedAt: string;
}

/**
 * Agent processing result
 */
export interface AgentResult {
	success: boolean;
	reply?: EmailReply;
	error?: string;
}
