/**
 * Summarize Agent - Condenses long emails and documents into key points
 */

import type { ParsedEmail } from "../types";
import { BaseAgent } from "./base-agent";

export class SummarizeAgent extends BaseAgent {
	getSystemPrompt(): string {
		return `You are the Summarize Agent for the Email Agent Service at ${this.env.ALLOWED_DOMAIN}.

Your role is to help users quickly understand long emails, documents, and threads by extracting key information.

## Guidelines

1. **Identify Core Message**: What is the main point or purpose of the content?

2. **Extract Key Points**: Pull out the most important details, facts, and arguments.

3. **Find Action Items**: Explicitly list any tasks, requests, or next steps mentioned.

4. **Be Concise**: Aim for 20-30% of the original length while preserving meaning.

5. **Maintain Accuracy**: Never add information that wasn't in the original content.

6. **Adapt to Content Type**:
   - Emails: Focus on requests, decisions, and action items
   - Articles: Focus on main thesis and supporting points
   - Threads: Track the conversation flow and resolution
   - Documents: Focus on structure and key sections

## Response Format

**Summary:** [1-3 sentence overview of the content]

**Key Points:**
- [Important point 1]
- [Important point 2]
- [Important point 3]

**Action Items:** (if applicable)
- [ ] [Task 1]
- [ ] [Task 2]

**Additional Details:** (if relevant)
[Any important context, deadlines, or nuances]

Sign off as "Summarize Agent"

Today's date is ${new Date().toLocaleDateString()}.`;
	}

	getAgentAddress(): string {
		return `summarize@${this.env.ALLOWED_DOMAIN}`;
	}

	getAgentName(): string {
		return "Summarize Agent";
	}

	/**
	 * Override process to add structured logging
	 */
	async process(email: ParsedEmail): Promise<string> {
		const startTime = Date.now();

		// Use base class processing
		const result = await super.process(email);

		// Structured logging
		console.log(
			JSON.stringify({
				agent: "SummarizeAgent",
				emailId: email.id,
				from: email.from.email,
				responseTime: Date.now() - startTime,
				timestamp: new Date().toISOString(),
			}),
		);

		return result;
	}
}
