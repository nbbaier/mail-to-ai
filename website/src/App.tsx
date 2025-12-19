import {
	Book01Icon,
	File02Icon,
	InformationCircleIcon,
	Search02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { type RefObject, useEffect, useRef, useState } from "react";
import Guide from "./Guide";

const DOMAIN = "mail-to-ai.com";

export function useScrollReveal<T extends HTMLElement>(): RefObject<T | null> {
	const ref = useRef<T>(null);

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("visible");
					}
				});
			},
			{ threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
		);

		const fadeElements = element.querySelectorAll(".fade-in-up");
		fadeElements.forEach((el) => {
			if (el) {
				observer.observe(el);
			}
		});

		return () => observer.disconnect();
	}, []);

	return ref;
}

function Hero() {
	return (
		<header className="relative overflow-hidden bg-slate-900 text-white">
			<div className="absolute inset-0 mesh-gradient" />
			<div
				className="absolute inset-0 opacity-[0.03]"
				style={{
					backgroundImage: `url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')`,
				}}
			/>

			<div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
				<div className="max-w-4xl">
					<h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display hero-animate hero-delay-1">
						Send a request.
						<br />
						<span className="gradient-text">Get back to your life.</span>
					</h1>

					<p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-3xl hero-animate hero-delay-2">
						Real autonomous agents that work while you're offline.
						Fire-and-forget workflows via email. No apps, no waiting, no
						babysitting.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 items-start hero-animate hero-delay-3">
						<a
							href="#built-in"
							className="px-8 py-4 bg-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:bg-cyan-600 transition transform hover:scale-105"
						>
							See Built-in Agents
						</a>
						<a
							href="#custom"
							className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 font-semibold rounded-lg hover:bg-white/20 transition"
						>
							Or Create Your Own
						</a>
					</div>
				</div>

				<div className="mt-20 max-w-2xl hero-animate hero-delay-4">
					<div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
						<div className="space-y-6">
							<div className="flex items-start gap-4">
								<div className="shrink-0 w-16 text-sm text-slate-400 font-mono">
									9:47 AM
								</div>
								<div className="flex-1">
									<div className="bg-cyan-600 rounded-2xl rounded-tl-sm p-4 text-white text-sm max-w-md">
										Research the top 10 AI email automation companies, their
										funding rounds, and key product differences
									</div>
								</div>
							</div>

							<div className="flex items-center gap-3 py-4">
								<div className="flex-1 h-px bg-slate-700" />
								<div className="flex items-center gap-2 text-cyan-400 text-sm font-mono px-3 py-1 rounded-full pulse-glow">
									<svg
										className="w-4 h-4 animate-spin"
										fill="none"
										viewBox="0 0 24 24"
									>
										<title>Processing</title>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>agent processing</span>
								</div>
								<div className="flex-1 h-px bg-slate-700" />
							</div>

							<div className="flex items-start gap-4">
								<div className="shrink-0 w-16 text-sm text-slate-400 font-mono">
									2:34 PM
								</div>
								<div className="flex-1 text-right">
									<div className="bg-slate-700 border border-slate-600 rounded-2xl rounded-tr-sm p-4 text-slate-200 text-sm inline-block max-w-md">
										Complete research report with 10 companies analyzed, funding
										data verified, comparison table attached →
									</div>
								</div>
							</div>
						</div>
					</div>

					<p className="text-center text-slate-400 text-sm mt-6">
						<span className="text-cyan-400">~5 hours of autonomous work</span>{" "}
						while you had meetings, lunch, focused time
					</p>
				</div>
			</div>
		</header>
	);
}

function ProblemSolution() {
	const ref = useScrollReveal<HTMLElement>();

	return (
		<section ref={ref} className="py-20 bg-white border-b border-slate-200">
			<div className="max-w-6xl mx-auto px-6">
				<div className="grid md:grid-cols-2 gap-16 items-center">
					<div className="fade-in-up">
						<div className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full mb-4">
							The Problem
						</div>
						<h2 className="text-3xl font-bold mb-6 font-display">
							Most "AI assistants" require you to sit there and watch
						</h2>
						<ul className="space-y-4">
							{[
								"You type a prompt, wait for streaming response",
								'Stuck in their interface while it "thinks"',
								"Can't delegate and move on with your day",
							].map((item) => (
								<li key={item} className="flex items-start gap-3">
									<svg
										className="w-6 h-6 text-red-500 mt-0.5 shrink-0"
										fill="no ne"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Cross icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
									<span className="text-slate-600">{item}</span>
								</li>
							))}
						</ul>
					</div>

					<div className="fade-in-up stagger-2">
						<div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
							The Solution
						</div>
						<h2 className="text-3xl font-bold mb-6 font-display">
							True agents work asynchronously, like human colleagues
						</h2>
						<ul className="space-y-4">
							{[
								{ bold: "Email your request", text: "in natural language" },
								{
									bold: "Agent works autonomously",
									text: "in the background",
								},
								{
									bold: "Check back later",
									text: "for completed work in inbox",
								},
							].map((item) => (
								<li key={item.bold} className="flex items-start gap-3">
									<svg
										className="w-6 h-6 text-emerald-500 mt-0.5 shrink-0"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Check icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									<span className="text-slate-600">
										<strong>{item.bold}</strong> {item.text}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
}

function BuiltInAgents() {
	const ref = useScrollReveal<HTMLElement>();

	return (
		<section ref={ref} id="built-in" className="py-24 bg-slate-50">
			<div className="max-w-6xl mx-auto px-6">
				<div className="text-center mb-16 fade-in-up">
					<div className="inline-block px-4 py-2 bg-cyan-100 text-cyan-700 text-sm font-semibold rounded-full mb-4">
						Ready to Use
					</div>
					<h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
						Two Built-in Agents
					</h2>
					<p className="text-xl text-slate-600 max-w-2xl mx-auto">
						Specialized agents optimized for the most common async workflows
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto auto-rows-fr">
					<div className="fade-in-up stagger-1">
						<AgentCard
							badge="DEEP WORK"
							badgeColor="blue"
							title="Research Agent"
							email={`research@${DOMAIN}`}
							iconColor="from-blue-500 to-cyan-500"
							icon={<HugeiconsIcon icon={Search02Icon} />}
							description="Multi-source web research with synthesis, citations, and structured reports. Perfect for competitive analysis, market research, technical deep-dives."
							example='"Compare the pricing models and target markets of the top 5 project management tools used by remote teams in 2024"'
							// time="30-120 min typical"
						/>
					</div>

					<div className="fade-in-up stagger-2">
						<AgentCard
							badge="FAST TRACK"
							badgeColor="emerald"
							title="Summarize Agent"
							email={`summarize@${DOMAIN}`}
							iconColor="from-emerald-500 to-teal-500"
							icon={<HugeiconsIcon icon={File02Icon} />}
							description="Intelligent summarization of long email threads, articles, documents. Extracts key points, action items, decisions made."
							example='Forward a 52-email thread: "Summarize this discussion and tell me what we decided about the launch timeline"'
							// time="5-20 min typical"
						/>
					</div>
				</div>

				<div className="mt-12 text-center fade-in-up stagger-3">
					<p className="text-slate-600 mb-4">
						Want to learn more about how the service works?
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<a
							href="/guide"
							className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 transition"
						>
							<HugeiconsIcon icon={Book01Icon} size={20} />
							Read the User Guide
						</a>
						<a
							href={`mailto:info@${DOMAIN}`}
							className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition"
						>
							<HugeiconsIcon icon={InformationCircleIcon} size={20} />
							info@{DOMAIN}
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}

interface AgentCardProps {
	badge: string;
	badgeColor: "blue" | "emerald";
	title: string;
	email: string;
	iconColor: string;
	icon: React.ReactNode;
	description: string;
	example: string;
	time?: string;
}

function AgentCard({
	badge,
	badgeColor,
	title,
	email,
	iconColor,
	icon,
	description,
	example,
	time,
}: AgentCardProps) {
	const badgeClasses =
		badgeColor === "blue"
			? "bg-blue-100 text-blue-700"
			: "bg-emerald-100 text-emerald-700";
	const codeClasses =
		badgeColor === "blue" ? "text-blue-600" : "text-emerald-600";

	return (
		<div className="card-hover bg-white rounded-3xl p-8 border-2 border-slate-200 shadow-lg h-full flex flex-col">
			<div className="flex items-start justify-between mb-6">
				<div>
					<div
						className={`inline-flex items-center gap-2 px-3 py-1 ${badgeClasses} text-xs font-bold rounded-full mb-3`}
					>
						{badge}
					</div>
					<h3 className="text-3xl font-bold text-slate-900 mb-2 font-display">
						{title}
					</h3>
					<code
						className={`text-sm bg-slate-100 px-3 py-1.5 rounded-lg ${codeClasses} font-mono`}
					>
						{email}
					</code>
				</div>
				<div
					className={`w-16 h-16 bg-linear-to-br ${iconColor} rounded-2xl flex items-center justify-center shrink-0 shadow-lg`}
				>
					<svg
						className="w-8 h-8 text-white"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Agent icon</title>
						{icon}
					</svg>
				</div>
			</div>

			<p className="text-slate-600 mb-6 leading-relaxed">{description}</p>

			<div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
				<div className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wide">
					Example Request
				</div>
				<p className="text-sm text-slate-700 leading-relaxed">{example}</p>
			</div>

			<div className="flex items-center justify-between text-sm mt-auto">
				{time ? (
					<div className="flex items-center gap-2 text-slate-500">
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Clock icon</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<span>{time}</span>
					</div>
				) : (
					<span className="flex-1"></span>
				)}

				<a
					href={`mailto:${email}`}
					className="text-cyan-600 font-semibold hover:text-cyan-700 flex items-center gap-1"
				>
					Try it now
					<svg
						className="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<title>Arrow icon</title>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						/>
					</svg>
				</a>
			</div>
		</div>
	);
}

function CustomAgents() {
	const ref = useScrollReveal<HTMLElement>();

	const examples = [
		{
			email: `write-haiku-about-cats@${DOMAIN}`,
			desc: "Creates a poetry agent that writes haikus about cats",
		},
		{
			email: `translate-to-spanish@${DOMAIN}`,
			desc: "Creates a translation agent for Spanish",
		},
		{
			email: `explain-like-im-five@${DOMAIN}`,
			desc: "Creates an agent that simplifies complex topics",
		},
		{
			email: `code-review-python@${DOMAIN}`,
			desc: "Creates a code review agent for Python",
		},
		{
			email: `compare-stripe-vs-paypal@${DOMAIN}`,
			desc: "Creates an agent that compares payment processors",
		},
	];

	return (
		<section
			ref={ref}
			id="custom"
			className="py-24 bg-linear-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden"
		>
			<div className="absolute top-0 right-0 w-1/3 h-full opacity-10">
				<svg
					viewBox="0 0 200 200"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full"
				>
					<title>Agent icon</title>
					<path
						fill="currentColor"
						d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.8C26.4,84.6,10,87.6,-5.8,87.1C-21.6,86.6,-36.8,82.6,-49.5,74.5C-62.2,66.4,-72.4,54.2,-78.9,40.2C-85.4,26.2,-88.2,10.4,-86.8,-4.9C-85.4,-20.2,-79.8,-35,-71.1,-47.8C-62.4,-60.6,-50.6,-71.4,-37.3,-79C-24,-86.6,-9.3,-91,4.7,-89.3C18.7,-87.6,30.6,-83.6,44.7,-76.4Z"
						transform="translate(100 100)"
					/>
				</svg>
			</div>

			<div className="relative max-w-6xl mx-auto px-6">
				<div className="text-center mb-16 fade-in-up">
					<div className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-300 text-sm font-semibold rounded-full mb-4 border border-cyan-400/30">
						Infinitely Flexible
					</div>
					<h2 className="text-4xl md:text-5xl font-bold mb-4 font-display">
						Or Create Any Agent Instantly
					</h2>
					<p className="text-xl text-slate-300 max-w-3xl mx-auto">
						The meta-agent creates custom agents from the email address itself.
						No setup, no configuration. Just describe what you want.
					</p>
				</div>

				<div className="max-w-4xl mx-auto">
					<div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 mb-12 fade-in-up stagger-1">
						<h3 className="text-2xl font-bold mb-6 text-center font-display">
							How Custom Agents Work
						</h3>

						<div className="grid md:grid-cols-3 gap-6 text-center">
							{[
								"Describe the task in the email address using hyphens or underscores",
								"Meta-agent creates a specialized agent on the fly",
								"Your custom agent processes the request and replies",
							].map((text, i) => (
								<div key={text}>
									<div className="w-12 h-12 bg-cyan-500/20 border border-cyan-400/30 rounded-xl flex items-center justify-center text-2xl font-bold mx-auto mb-3 text-cyan-400">
										{i + 1}
									</div>
									<p className="text-sm text-slate-300">{text}</p>
								</div>
							))}
						</div>
					</div>

					<div className="space-y-4">
						{examples.map(({ email, desc }, i) => (
							<div
								key={email}
								className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 fade-in-up stagger-${Math.min(i + 2, 5)}`}
							>
								<div className="flex flex-col md:flex-row md:items-center gap-4">
									<code className="text-cyan-400 font-mono text-sm md:text-base shrink-0">
										{email}
									</code>
									<div className="hidden md:block text-slate-600">→</div>
									<p className="text-slate-300 text-sm">{desc}</p>
								</div>
							</div>
						))}
					</div>

					<div className="mt-10 text-center">
						<p className="text-slate-400 text-sm mb-6">
							The possibilities are endless. Any task you can describe, you can
							create an agent for.
						</p>
						<a
							href={`mailto:your-custom-agent@${DOMAIN}`}
							className="inline-block px-8 py-4 bg-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:bg-cyan-600 transition transform hover:scale-105"
						>
							Create Your First Custom Agent
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}

function FinalCTA() {
	return (
		<section
			className="py-20 bg-linear-to-br from-cyan-600 to-blue-600 text-white"
			aria-label="Final CTA"
		>
			<div className="max-w-4xl mx-auto px-6 text-center">
				<h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
					Stop waiting. Start delegating.
				</h2>
				<p className="text-xl text-cyan-100 mb-10">
					No signup. No credit card. Just email an agent and get back to work.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<a
						href={`mailto:research@${DOMAIN}`}
						className="px-8 py-4 bg-white text-cyan-600 font-semibold rounded-lg shadow-lg hover:bg-cyan-50 transition transform hover:scale-105"
					>
						Try Research Agent
					</a>
					<a
						href={`mailto:summarize@${DOMAIN}`}
						className="px-8 py-4 bg-cyan-500/20 backdrop-blur-sm border-2 border-white/30 font-semibold rounded-lg hover:bg-cyan-500/30 transition"
					>
						Try Summarize Agent
					</a>
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
			<div className="max-w-6xl mx-auto px-6">
				<div className="grid md:grid-cols-4 gap-8 mb-8">
					<div>
						<h3 className="text-white font-bold text-lg mb-4 font-display">
							Mail-to-AI
						</h3>
						<p className="text-sm leading-relaxed">
							True autonomous AI agents accessible through email.
						</p>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Built-in Agents</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href={`mailto:research@${DOMAIN}`}
									className="hover:text-cyan-400 transition"
								>
									research@{DOMAIN}
								</a>
							</li>
							<li>
								<a
									href={`mailto:summarize@${DOMAIN}`}
									className="hover:text-cyan-400 transition"
								>
									summarize@{DOMAIN}
								</a>
							</li>
							<li>
								<a
									href={`mailto:info@${DOMAIN}`}
									className="hover:text-cyan-400 transition"
								>
									info@{DOMAIN}
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Custom Agents</h4>
						<ul className="space-y-2 text-sm">
							<li className="text-slate-500">Create any task description</li>
							<li className="text-slate-500">Infinite possibilities</li>
							<li className="text-slate-500">No setup required</li>
						</ul>
					</div>

					<div>
						<h4 className="text-white font-semibold mb-4">Resources</h4>
						<ul className="space-y-2 text-sm">
							<li>
								<a
									href="/guide"
									className="hover:text-cyan-400 transition"
								>
									User Guide
								</a>
							</li>
							<li className="text-slate-500">Cloudflare Workers</li>
							<li className="text-slate-500">Claude AI</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-slate-800 pt-8 text-center text-sm">
					<p>Built for the inbound.new hackathon</p>
				</div>
			</div>
		</footer>
	);
}

function useRoute() {
	const [path, setPath] = useState(window.location.pathname);

	useEffect(() => {
		const handlePopState = () => setPath(window.location.pathname);
		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, []);

	return path;
}

function LandingPage() {
	return (
		<div className="bg-slate-50 text-gray-900 font-sans">
			<Hero />
			<ProblemSolution />
			<BuiltInAgents />
			<CustomAgents />
			<FinalCTA />
			<Footer />
		</div>
	);
}

export default function App() {
	const path = useRoute();

	if (path === "/guide") {
		return <Guide />;
	}

	return <LandingPage />;
}
