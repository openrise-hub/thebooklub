import autoAdapter from "@sveltejs/adapter-auto";
import vercelAdapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const isVercel = process.env.VERCEL === "1";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: isVercel
			? vercelAdapter({
					runtime: "nodejs22.x",
				})
			: autoAdapter(),
	},
};

export default config;
