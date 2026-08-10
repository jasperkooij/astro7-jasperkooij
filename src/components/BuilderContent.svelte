<script lang="ts">
	import { onMount } from 'svelte';

	export let apiKey: string;
	export let model: string = 'page';
	export let urlPath: string = '/';
	export let initialContent: any = null;

	let content: any = initialContent;
	let loading = !initialContent;

	onMount(async () => {
		// Only fetch if we don't have initial content (for client-side navigation)
		if (!content) {
			try {
				const url = `https://cdn.builder.io/api/v2/content/${model}?apiKey=${apiKey}&url=${urlPath}`;
				const response = await fetch(url);
				if (response.ok) {
					const data = await response.json();
					content = data.results?.[0];
				}
			} catch (error) {
				console.error('Error fetching Builder.io content:', error);
			} finally {
				loading = false;
			}
		}
	});

	function getStyles(block: any): string {
		const styles = block.responsiveStyles?.large || {};
		return Object.entries(styles)
			.map(([key, value]) => {
				const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
				return `${cssKey}: ${value}`;
			})
			.join('; ');
	}

	function renderBlock(block: any): string {
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
			const { image, altText, width, height, aspectRatio, highPriority } = options || {};
			const loading = highPriority ? 'eager' : 'lazy';
			return `<div class="${className}" style="${style}" ${id ? `id="${id}"` : ''}><img src="${image}" alt="${altText || ''}" loading="${loading}" style="max-width: 100%; height: auto;" /></div>`;
		}

		if (name === 'Core:Section') {
			const children = block.children || [];
			const childrenHtml = children.map((child: any) => renderBlock(child)).join('');
			return `<section class="${className}" style="${style}" ${id ? `id="${id}"` : ''}>${childrenHtml}</section>`;
		}

		return '';
	}

	$: htmlContent = content?.data?.blocks
		? content.data.blocks.map((block: any) => renderBlock(block)).join('')
		: '';
</script>

{#if loading}
	<div class="flex justify-center items-center py-12">
		<div class="loading loading-spinner loading-lg"></div>
	</div>
{:else if htmlContent}
	<div>{@html htmlContent}</div>
{:else}
	<div class="text-center py-12">
		<h1>Content Not Found</h1>
		<p class="mt-4">The page you're looking for doesn't exist.</p>
	</div>
{/if}
