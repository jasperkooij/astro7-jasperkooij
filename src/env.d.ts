/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_BUILDER_API_KEY: string;
	readonly PUBLIC_GOOGLE_ANALYTICS_ID?: string;
	readonly PUBLIC_WEBMCP_ORIGIN_TRIAL_TOKEN?: string;
	readonly WEBHOOK_SECRET?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
