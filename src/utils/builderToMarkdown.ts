import TurndownService from 'turndown';
import { parseHTML } from 'linkedom';
import type { BuilderBlock, BuilderContent } from './builderContent';

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Parse HTML via linkedom and pass the DOM node to Turndown directly,
// avoiding any DOMParser dependency (not available in Cloudflare Workers).
function htmlToMarkdown(html: string): string {
  const { document } = parseHTML(`<html><body>${html}</body></html>`);
  const body = document.querySelector('body');
  return turndownService.turndown(body as any);
}

function processBlock(block: BuilderBlock): string {
  if (!block) return '';

  const componentName = block.component?.name;

  if (componentName === 'Text' || block['@type'] === '@builder.io/sdk:Element') {
    const text = block.component?.options?.text || '';
    if (text) {
      return htmlToMarkdown(text) + '\n\n';
    }
  }

  if (componentName === 'Image') {
    const image = block.component?.options?.image;
    const altText = block.component?.options?.altText || '';
    if (image) {
      return `![${altText}](${image})\n\n`;
    }
  }

  if (componentName === 'Section' || block.children) {
    let content = '';
    if (block.children && Array.isArray(block.children)) {
      for (const child of block.children) {
        content += processBlock(child);
      }
    }
    return content;
  }

  if (componentName === 'ContactForm') {
    return '## Contact\n\nFor inquiries, please use the contact form on the website.\n\n';
  }

  return '';
}

export function convertBuilderToMarkdown(content: BuilderContent): string {
  if (!content?.data) {
    return '';
  }

  let markdown = '';

  if (content.data.title) {
    markdown += `# ${content.data.title}\n\n`;
  }

  if (content.data.description) {
    markdown += `${content.data.description}\n\n`;
  }

  if (content.data.blocks && Array.isArray(content.data.blocks)) {
    for (const block of content.data.blocks) {
      markdown += processBlock(block);
    }
  }

  return markdown.trim();
}
