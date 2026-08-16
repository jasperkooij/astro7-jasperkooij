import { faqs } from '../data/faqs';

interface ModelContextTool {
	name: string;
	description: string;
	inputSchema?: Record<string, unknown>;
	execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
	annotations?: {
		readOnlyHint?: boolean;
		untrustedContentHint?: boolean;
	};
}

interface ModelContext {
	registerTool(
		tool: ModelContextTool,
		options?: { signal?: AbortSignal }
	): Promise<unknown>;
}

declare global {
	interface Document {
		modelContext?: ModelContext;
	}
	interface Navigator {
		modelContext?: ModelContext;
	}
}

const BIO_FALLBACK =
	'Jasper Kooij is a full-stack developer and technical team leader with over 25 years of experience, specialising in travel, hospitality, and tourism clients. He is Director of Web Development at Blend Marketing, based in Madison, Wisconsin.';

const BOOKING_ENGINES = [
	'Ventrata',
	'Roller',
	'Peek Pro',
	'FareHarbor',
	'Galaxy Connect',
	'Rezdy'
] as const;

const SECTIONS = ['about', 'contact', 'faq'] as const;
type SectionId = (typeof SECTIONS)[number];

let registration: AbortController | null = null;

function getModelContext(): ModelContext | undefined {
	const fromDocument = document.modelContext;
	if (fromDocument && 'registerTool' in fromDocument) return fromDocument;

	const fromNavigator = navigator.modelContext;
	if (fromNavigator && 'registerTool' in fromNavigator) return fromNavigator;

	return undefined;
}

function faqAnswer(questionIncludes: string): string {
	const match = faqs.find((faq) =>
		faq.question.toLowerCase().includes(questionIncludes.toLowerCase())
	);
	return match?.answer ?? 'That information is not available on this page.';
}

function getBio(): string {
	const about = document.getElementById('about');
	const fromPage = about?.innerText?.replace(/\s+/g, ' ').trim();
	if (fromPage && fromPage.length > 40) return fromPage;
	return BIO_FALLBACK;
}

function scrollToSection(section: string): string {
	if (!SECTIONS.includes(section as SectionId)) {
		return `Unknown section "${section}". Use one of: ${SECTIONS.join(', ')}.`;
	}

	const el = document.getElementById(section);
	if (!el) {
		return `The #${section} section is not on this page.`;
	}

	el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	return `Scrolled to the ${section} section.`;
}

async function registerTools() {
	const modelContext = getModelContext();
	if (!modelContext) return;

	registration?.abort();
	registration = new AbortController();
	const { signal } = registration;
	const options = { signal };

	const emptyObjectSchema = {
		type: 'object',
		properties: {},
		additionalProperties: false
	} as const;

	await modelContext.registerTool(
		{
			name: 'get-bio',
			description:
				'Return Jasper Kooij’s about/bio text from this page: background, role, and who he works with.',
			inputSchema: emptyObjectSchema,
			execute: () => getBio(),
			annotations: { readOnlyHint: true }
		},
		options
	);

	await modelContext.registerTool(
		{
			name: 'get-services',
			description:
				'List the professional services Jasper Kooij offers (web development, booking engines, performance, SEO).',
			inputSchema: emptyObjectSchema,
			execute: () => faqAnswer('services'),
			annotations: { readOnlyHint: true }
		},
		options
	);

	await modelContext.registerTool(
		{
			name: 'list-technologies',
			description:
				'List frontend, CMS, and deployment technologies Jasper Kooij specializes in.',
			inputSchema: emptyObjectSchema,
			execute: () => faqAnswer('technologies'),
			annotations: { readOnlyHint: true }
		},
		options
	);

	await modelContext.registerTool(
		{
			name: 'list-booking-engines',
			description:
				'List booking engines Jasper Kooij integrates for hotels, tours, and attractions (Ventrata, FareHarbor, and others).',
			inputSchema: emptyObjectSchema,
			execute: () =>
				`Jasper integrates: ${BOOKING_ENGINES.join(', ')} for hotels, tours, and attraction operators.`,
			annotations: { readOnlyHint: true }
		},
		options
	);

	await modelContext.registerTool(
		{
			name: 'scroll-to-section',
			description:
				'Scroll this page to a section so the visitor can see it: about, contact, or faq.',
			inputSchema: {
				type: 'object',
				properties: {
					section: {
						type: 'string',
						enum: [...SECTIONS],
						description: 'Target section id: about, contact, or faq.'
					}
				},
				required: ['section'],
				additionalProperties: false
			},
			execute: ({ section }) => scrollToSection(String(section ?? ''))
		},
		options
	);
}

document.addEventListener('astro:page-load', () => {
	void registerTools();
});
