/**
 * Safety Validator - Rejects unsafe or inappropriate meta-agent addresses
 *
 * Blocks potentially harmful requests before processing
 */

export interface SafetyValidationResult {
	safe: boolean;
	reason?: string;
}

const UNSAFE_ADDRESS_PATTERNS = [
	/password/i,
	/hack/i,
	/exploit/i,
	/malware/i,
	/phishing/i,
	/spam/i,
	/illegal/i,
	/weapon/i,
	/drug/i,
	/bomb/i,
	/terror/i,
	/steal/i,
	/fraud/i,
	/scam/i,
	/attack/i,
	/bypass/i,
	/inject/i,
	/ddos/i,
	/ransomware/i,
	/keylog/i,
	/\bchild\b/i,
	/\bporn\b/i,
	/\bnude\b/i,
	/\bsex\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
	/ignore\s+(all\s+)?previous\s+instructions?/i,
	/ignore\s+(all\s+)?prior\s+instructions?/i,
	/disregard\s+(all\s+)?previous/i,
	/forget\s+(all\s+)?previous/i,
	/new\s+instructions?:/i,
	/override\s+system/i,
	/you\s+are\s+now/i,
	/pretend\s+you\s+are/i,
	/act\s+as\s+if\s+you/i,
	/jailbreak/i,
	/dan\s+mode/i,
	/developer\s+mode/i,
];

export function validateAddress(address: string): SafetyValidationResult {
	const localPart = address.split("@")[0].toLowerCase();

	for (const pattern of UNSAFE_ADDRESS_PATTERNS) {
		if (pattern.test(localPart)) {
			return {
				safe: false,
				reason: `Address contains blocked term: "${localPart.match(pattern)?.[0] || "unknown"}"`,
			};
		}
	}

	return { safe: true };
}

export function validateBody(body: string): SafetyValidationResult {
	for (const pattern of PROMPT_INJECTION_PATTERNS) {
		if (pattern.test(body)) {
			return {
				safe: false,
				reason: "Message contains prompt injection attempt",
			};
		}
	}

	return { safe: true };
}

export function validateRequest(
	address: string,
	body: string,
): SafetyValidationResult {
	const addressResult = validateAddress(address);
	if (!addressResult.safe) {
		return addressResult;
	}

	const bodyResult = validateBody(body);
	if (!bodyResult.safe) {
		return bodyResult;
	}

	return { safe: true };
}

export function getBlockedResponseMessage(reason: string): string {
	return `I'm sorry, but I cannot process this request.

Your message was blocked by our safety filters: ${reason}

If you believe this is an error, please contact support or try rephrasing your request.

Best regards,
Mail-to-AI Safety System`;
}
