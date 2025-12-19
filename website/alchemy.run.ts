import alchemy from "alchemy";
import { Vite } from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";

const app = await alchemy("mail-to-ai-website", {
	stage: process.env.ALCHEMY_STAGE ?? "dev",
	stateStore: (scope) => new CloudflareStateStore(scope),
	password: process.env.ALCHEMY_PASSWORD,
});

export const website = await Vite("website", {
	name: `mail-to-ai-website-${app.stage}`,
	domains: ["mail-to-ai.com"],
	entrypoint: "src/worker.ts",
	url: true,
});

console.log(`Website deployed to: ${website.url}`);

await app.finalize();
