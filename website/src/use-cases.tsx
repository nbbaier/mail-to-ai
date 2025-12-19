import { useScrollReveal } from "./App";

export function UseCases() {
	const ref = useScrollReveal<HTMLElement>();

	const cases = [
		{
			title: "Founders & Executives",
			desc: "Queue up competitive analysis, market research, and strategic reports in the morning. Review completed work in the afternoon.",
		},
		{
			title: "Researchers & Analysts",
			desc: "Send multiple research requests overnight. Wake up to comprehensive reports with citations ready for review.",
		},
		{
			title: "Writers & Creators",
			desc: "Delegate background research and fact-checking while you focus on creating. Get sourced information delivered to your inbox.",
		},
	];

	return (
		<section ref={ref} className="py-20 bg-white">
			<div className="max-w-6xl mx-auto px-6">
				<div className="text-center mb-16 fade-in-up">
					<h2 className="text-4xl font-bold mb-4 font-display">
						Built for people who value their time
					</h2>
					<p className="text-xl text-slate-600">
						Delegate work that takes hours, not minutes
					</p>
				</div>

				<div className="grid md:grid-cols-3 gap-8">
					{cases.map(({ title, desc }, i) => (
						<div
							key={title}
							className={`bg-slate-50 rounded-2xl p-8 border border-slate-200 fade-in-up stagger-${i + 1}`}
						>
							<h3 className="font-bold text-xl mb-3 font-display">{title}</h3>
							<p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
