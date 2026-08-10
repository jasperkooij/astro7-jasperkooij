<script lang="ts">
	import { Content, isPreviewing } from '@builder.io/sdk-svelte';
	import { onMount } from 'svelte';

	export let apiKey: string;
	export let model: string = 'page';
	export let urlPath: string = '/';
	export let initialContent: any = null;

	// Check if we're in preview mode
	let isPreview = false;

	onMount(() => {
		// Check for Builder.io preview query params
		const searchParams = new URLSearchParams(window.location.search);
		isPreview = searchParams.has('builder.preview') || isPreviewing();
	});
</script>

{#if isPreview}
	<!-- Use Builder.io SDK in preview mode for live editing -->
	<Content {model} {apiKey} content={initialContent} />
{:else}
	<!-- Render static HTML in production for zero CLS -->
	{@html (() => {
		function getStyles(block) {
			const styles = block.responsiveStyles?.large || {};
			return Object.entries(styles)
				.map(([key, value]) => {
					const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
					return `${cssKey}: ${value}`;
				})
				.join('; ');
		}

		function renderBlock(block) {
			if (!block || !block.component) return '';

			const { name, options } = block.component;
			const style = getStyles(block);
			const className = block.class || '';
			const id = block.id || '';

			if (name === 'Text') {
				const text = options?.text || '';
				return `<div class="builder-text ${className}" style="${style}" ${id ? `id="${id}"` : ''}>${text}</div>`;
			}

			if (name === 'Image') {
				const { image, altText, highPriority } = options || {};
				const loading = highPriority ? 'eager' : 'lazy';
				return `<div class="${className}" style="${style}" ${id ? `id="${id}"` : ''}><img src="${image}" alt="${altText || ''}" loading="${loading}" style="max-width: 100%; height: auto;" /></div>`;
			}

			if (name === 'Core:Section') {
				const children = block.children || [];
				const childrenHtml = children.map((child) => renderBlock(child)).join('');
				return `<section class="${className}" style="${style}" ${id ? `id="${id}"` : ''}>${childrenHtml}</section>`;
			}

			return '';
		}

		if (!initialContent?.data?.blocks) {
			return '<div class="text-center py-12"><h1>Content Not Found</h1><p class="mt-4">The page you\'re looking for doesn\'t exist.</p></div>';
		}

		return initialContent.data.blocks.map((block) => renderBlock(block)).join('');
	})()}
{/if}
