import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const DOMAIN = "mail-to-ai.com";

function Header() {
	return (
		<header className="bg-slate-900 text-white py-6 border-b border-slate-700">
			<div className="max-w-4xl mx-auto px-6">
				<a
					href="/"
					className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition mb-4"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
					Back to Home
				</a>
				<h1 className="text-4xl font-bold font-display">User Guide</h1>
				<p className="text-slate-400 mt-2">
					Everything you need to know to get started with Mail-to-AI
				</p>
			</div>
		</header>
	);
}

function Section({
	id,
	title,
	children,
}: { id: string; title: string; children: React.ReactNode }) {
	return (
		<section id={id} className="scroll-mt-8">
			<h2 className="text-2xl font-bold text-slate-900 mb-4 font-display border-b border-slate-200 pb-2">
				{title}
			</h2>
			{children}
		</section>
	);
}

function EmailExample({
	to,
	subject,
	body,
}: { to: string; subject: string; body: string }) {
	return (
		<div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
			<div className="bg-slate-50 px-4 py-2 border-b border-slate-200 text-sm">
				<div className="flex gap-2">
					<span className="text-slate-500 w-16">To:</span>
					<span className="text-cyan-600 font-mono">{to}</span>
				</div>
				<div className="flex gap-2">
					<span className="text-slate-500 w-16">Subject:</span>
					<span className="text-slate-700">{subject}</span>
				</div>
			</div>
			<div className="p-4 text-slate-700 text-sm whitespace-pre-wrap">
				{body}
			</div>
		</div>
	);
}

function TableOfContents() {
	const sections = [
		{ id: "quick-start", label: "Quick Start" },
		{ id: "built-in-agents", label: "Built-in Agents" },
		{ id: "custom-agents", label: "Custom Agents (Meta-Agent)" },
		{ id: "conversations", label: "Multi-turn Conversations" },
		{ id: "tips", label: "Tips & Best Practices" },
		{ id: "faq", label: "FAQ" },
	];

	return (
		<nav className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
			<h3 className="font-semibold text-slate-700 mb-3">On this page</h3>
			<ul className="space-y-2">
				{sections.map((section) => (
					<li key={section.id}>
						<a
							href={`#${section.id}`}
							className="text-slate-600 hover:text-cyan-600 transition text-sm"
						>
							{section.label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	);
}

export default function Guide() {
	return (
		<div className="min-h-screen bg-slate-100">
			<Header />

			<main className="max-w-4xl mx-auto px-6 py-12">
				<TableOfContents />

				<div className="space-y-12">
					<Section id="quick-start" title="Quick Start">
						<p className="text-slate-600 mb-4">
							Getting started is simple — just send an email. No signup, no API
							keys, no configuration.
						</p>

						<div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-cyan-800 mb-2">
								Your first request
							</h4>
							<p className="text-cyan-700 text-sm mb-3">
								Send an email to one of our agents and you'll receive a response
								in your inbox:
							</p>
							<a
								href={`mailto:research@${DOMAIN}?subject=Quick%20Test&body=What%20is%20the%20current%20population%20of%20Tokyo%3F`}
								className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm font-medium"
							>
								Send a test email to research@{DOMAIN}
							</a>
						</div>

						<h4 className="font-semibold text-slate-800 mb-3">How it works</h4>
						<ol className="list-decimal list-inside space-y-2 text-slate-600 mb-4">
							<li>
								<strong>Send an email</strong> to any agent address
							</li>
							<li>
								<strong>Agent processes</strong> your request autonomously
							</li>
							<li>
								<strong>Receive a reply</strong> with the completed work
							</li>
						</ol>

						<p className="text-slate-600">
							Response times vary by complexity — from seconds for simple tasks
							to minutes for research.
						</p>
					</Section>

					<Section id="built-in-agents" title="Built-in Agents">
						<p className="text-slate-600 mb-6">
							These specialized agents are ready to use immediately.
						</p>

						<div className="space-y-8">
							<div>
								<h3 className="text-xl font-semibold text-slate-800 mb-2">
									🔍 Research Agent
								</h3>
								<p className="text-slate-600 mb-3">
									<code className="bg-slate-200 px-2 py-1 rounded text-sm">
										research@{DOMAIN}
									</code>
								</p>
								<p className="text-slate-600 mb-4">
									Performs web research with citations. Great for competitive
									analysis, fact-checking, and exploring topics in depth.
								</p>
								<EmailExample
									to={`research@${DOMAIN}`}
									subject="AI Regulation Comparison"
									body="Compare how AI is being regulated in the EU, US, and China. Include recent legislation and key differences in approach."
								/>
							</div>

							<div>
								<h3 className="text-xl font-semibold text-slate-800 mb-2">
									📄 Summarize Agent
								</h3>
								<p className="text-slate-600 mb-3">
									<code className="bg-slate-200 px-2 py-1 rounded text-sm">
										summarize@{DOMAIN}
									</code>
								</p>
								<p className="text-slate-600 mb-4">
									Condenses long content into key points. Perfect for email
									threads, articles, or any lengthy text.
								</p>
								<EmailExample
									to={`summarize@${DOMAIN}`}
									subject="Summarize this meeting notes"
									body={`Here are the notes from our Q4 planning meeting...

[Paste your long content here]

Please extract the key decisions made and any action items.`}
								/>
							</div>

							<div>
								<h3 className="text-xl font-semibold text-slate-800 mb-2">
									ℹ️ Info Agent
								</h3>
								<p className="text-slate-600 mb-3">
									<code className="bg-slate-200 px-2 py-1 rounded text-sm">
										info@{DOMAIN}
									</code>
								</p>
								<p className="text-slate-600 mb-4">
									Learn about the service and available agents. Ask any
									questions about how Mail-to-AI works.
								</p>
								<EmailExample
									to={`info@${DOMAIN}`}
									subject="How does this work?"
									body="Can you explain how the custom agent feature works?"
								/>
							</div>
						</div>
					</Section>

					<Section id="custom-agents" title="Custom Agents (Meta-Agent)">
						<p className="text-slate-600 mb-4">
							Create any agent on the fly by describing the task in the email
							address itself. The meta-agent interprets the address and creates
							a specialized agent for your request.
						</p>

						<h4 className="font-semibold text-slate-800 mb-3">
							Address Format
						</h4>
						<p className="text-slate-600 mb-4">
							Use hyphens, underscores, or camelCase to separate words in your
							agent description:
						</p>

						<div className="bg-slate-800 rounded-lg p-4 mb-6 space-y-2">
							<p className="text-slate-300">
								<span className="text-cyan-400 font-mono">
									write-haiku-about-cats@{DOMAIN}
								</span>
							</p>
							<p className="text-slate-300">
								<span className="text-cyan-400 font-mono">
									translate_to_spanish@{DOMAIN}
								</span>
							</p>
							<p className="text-slate-300">
								<span className="text-cyan-400 font-mono">
									explainLikeImFive@{DOMAIN}
								</span>
							</p>
						</div>

						<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
							<h4 className="font-semibold text-amber-800 mb-2">
								⚠️ Important: Word Separation Required
							</h4>
							<p className="text-amber-700 text-sm">
								The address parser needs clear word boundaries. Addresses
								without separators won't work correctly:
							</p>
							<ul className="mt-2 text-sm text-amber-700 space-y-1">
								<li>
									✅ <code className="bg-amber-100 px-1">write-haiku</code> →
									"write haiku"
								</li>
								<li>
									✅ <code className="bg-amber-100 px-1">writeHaiku</code> →
									"write haiku"
								</li>
								<li>
									❌ <code className="bg-amber-100 px-1">writehaiku</code> →
									"writehaiku" (unreadable)
								</li>
							</ul>
						</div>

						<h4 className="font-semibold text-slate-800 mb-3">Examples</h4>
						<div className="space-y-4">
							<EmailExample
								to={`explain-like-im-five@${DOMAIN}`}
								subject="Quantum Entanglement"
								body="What is quantum entanglement and why is it important?"
							/>

							<EmailExample
								to={`code-review-python@${DOMAIN}`}
								subject="Review my function"
								body={`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

Is there a more efficient way to write this?`}
							/>

							<EmailExample
								to={`write-professional-email@${DOMAIN}`}
								subject="Follow up after interview"
								body="I just had an interview at Acme Corp for a senior engineer role. The interviewer was Sarah Chen. Help me write a thank you follow-up."
							/>
						</div>
					</Section>

					<Section id="conversations" title="Multi-turn Conversations">
						<p className="text-slate-600 mb-4">
							Agents remember your conversation history. Simply reply to
							continue the discussion.
						</p>

						<div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
							<div className="space-y-4">
								<div className="flex gap-3">
									<div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
										1
									</div>
									<div>
										<p className="font-medium text-slate-700">
											You: "What is machine learning?"
										</p>
										<p className="text-slate-500 text-sm">
											Agent explains the basics...
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
										2
									</div>
									<div>
										<p className="font-medium text-slate-700">
											You reply: "Can you give me an example?"
										</p>
										<p className="text-slate-500 text-sm">
											Agent provides examples with context from previous
											message...
										</p>
									</div>
								</div>
								<div className="flex gap-3">
									<div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
										3
									</div>
									<div>
										<p className="font-medium text-slate-700">
											You reply: "How do I get started?"
										</p>
										<p className="text-slate-500 text-sm">
											Agent recommends learning resources...
										</p>
									</div>
								</div>
							</div>
						</div>

						<p className="text-slate-600">
							Conversation history is maintained per email thread. Starting a
							new email thread creates a fresh conversation.
						</p>
					</Section>

					<Section id="tips" title="Tips & Best Practices">
						<div className="grid md:grid-cols-2 gap-6">
							<div className="bg-white rounded-lg p-4 border border-slate-200">
								<h4 className="font-semibold text-slate-800 mb-2">
									✅ Be Specific
								</h4>
								<p className="text-slate-600 text-sm">
									The more context you provide, the better the response.
									Include relevant details, constraints, and your intended use
									case.
								</p>
							</div>

							<div className="bg-white rounded-lg p-4 border border-slate-200">
								<h4 className="font-semibold text-slate-800 mb-2">
									✅ Use Subjects
								</h4>
								<p className="text-slate-600 text-sm">
									Email subjects help provide context. A clear subject line
									helps the agent understand your request better.
								</p>
							</div>

							<div className="bg-white rounded-lg p-4 border border-slate-200">
								<h4 className="font-semibold text-slate-800 mb-2">
									✅ Chain Requests
								</h4>
								<p className="text-slate-600 text-sm">
									Use replies to refine or expand on previous responses. Agents
									maintain conversation context.
								</p>
							</div>

							<div className="bg-white rounded-lg p-4 border border-slate-200">
								<h4 className="font-semibold text-slate-800 mb-2">
									✅ Right Agent for the Job
								</h4>
								<p className="text-slate-600 text-sm">
									Use built-in agents for their specialties. Research for web
									lookups, Summarize for condensing content.
								</p>
							</div>
						</div>
					</Section>

					<Section id="faq" title="FAQ">
						<div className="space-y-6">
							<div>
								<h4 className="font-semibold text-slate-800 mb-2">
									How long do responses take?
								</h4>
								<p className="text-slate-600">
									Most responses arrive within seconds to a few minutes.
									Research tasks that require web searches may take longer
									depending on complexity.
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-slate-800 mb-2">
									Is there a cost?
								</h4>
								<p className="text-slate-600">
									Currently, the service is free to use during the beta period.
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-slate-800 mb-2">
									Can I send attachments?
								</h4>
								<p className="text-slate-600">
									Attachment support is limited. For now, paste content directly
									into the email body for best results.
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-slate-800 mb-2">
									How is my data handled?
								</h4>
								<p className="text-slate-600">
									Email content is processed to generate responses and
									conversation history is maintained for thread continuity. We
									don't share your data with third parties.
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-slate-800 mb-2">
									Why didn't my custom agent address work?
								</h4>
								<p className="text-slate-600">
									Make sure you're using word separators (hyphens, underscores,
									or camelCase). Addresses like{" "}
									<code className="bg-slate-200 px-1 text-sm">
										writehaikuaboutcats
									</code>{" "}
									without separators can't be parsed correctly.
								</p>
							</div>
						</div>
					</Section>
				</div>

				<div className="mt-12 pt-8 border-t border-slate-200 text-center">
					<p className="text-slate-500 mb-4">Still have questions?</p>
					<a
						href={`mailto:info@${DOMAIN}`}
						className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-medium"
					>
						Email info@{DOMAIN}
					</a>
				</div>
			</main>

			<footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
				<div className="max-w-4xl mx-auto px-6 text-center text-sm">
					<a href="/" className="text-cyan-400 hover:text-cyan-300 transition">
						← Back to Mail-to-AI
					</a>
				</div>
			</footer>
		</div>
	);
}
