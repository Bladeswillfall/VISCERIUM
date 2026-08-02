const { Notice, Plugin } = require('obsidian');

const ALIGNMENTS = new Set(['left', 'right', 'center', 'wide', 'full']);
const SHAPE_FLAGS = new Set(['shape', 'contour']);
const IMAGE_CLASSES = [
  'vc-image-embed',
  'vc-image-left',
  'vc-image-right',
  'vc-image-center',
  'vc-image-wide',
  'vc-image-full',
  'vc-image-shape',
];

function clampInteger(value, minimum, maximum) {
  const number = Number(value);
  if (!Number.isInteger(number)) return undefined;
  return Math.min(maximum, Math.max(minimum, number));
}

function isFlagToken(token) {
  const lower = String(token ?? '').trim().toLowerCase();
  return ALIGNMENTS.has(lower)
    || SHAPE_FLAGS.has(lower)
    || /^\d{1,4}$/.test(lower)
    || /^gap=\d{1,3}$/.test(lower)
    || /^alt=/i.test(lower);
}

function parseImageSpec(rawSpec) {
  const parts = String(rawSpec ?? '').split('|').map((part) => part.trim()).filter(Boolean);
  const tokens = parts.length > 0 && isFlagToken(parts[0]) ? parts : parts.slice(1);
  let alignment;
  let width;
  let gap;
  let shape = false;

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (ALIGNMENTS.has(lower)) alignment = lower;
    else if (SHAPE_FLAGS.has(lower)) shape = true;
    else if (/^\d{1,4}$/.test(lower)) width = clampInteger(lower, 1, 2400);
    else {
      const gapMatch = lower.match(/^gap=(\d{1,3})$/);
      if (gapMatch) gap = clampInteger(gapMatch[1], 0, 96);
    }
  }

  if (!alignment && width) alignment = 'center';
  if (shape && !['left', 'right'].includes(alignment)) shape = false;

  return {
    alignment,
    width,
    gap,
    shape,
    hasLayout: Boolean(alignment || width || gap !== undefined || shape),
  };
}

function cssUrl(value) {
  const escaped = String(value ?? '').replace(/["\\\n\r]/g, (character) => `\\${character}`);
  return `url("${escaped}")`;
}

function clearImageLayout(wrapper) {
  wrapper.classList.remove(...IMAGE_CLASSES);
  wrapper.style.removeProperty('--vc-image-width');
  wrapper.style.removeProperty('--vc-image-gap');
  wrapper.style.removeProperty('--vc-image-shape');
  delete wrapper.dataset.vcImageLayout;
}

function sourceSpec(wrapper, image) {
  return wrapper.getAttribute('alt')
    || wrapper.getAttribute('data-href')
    || image.getAttribute('alt')
    || '';
}

function applyShapeSource(wrapper, image) {
  const source = image.currentSrc || image.getAttribute('src') || image.src;
  if (!source) return;
  wrapper.style.setProperty('--vc-image-shape', cssUrl(source));
}

function decorateImageEmbed(wrapper) {
  const image = wrapper.querySelector('img');
  if (!image) return false;

  const rawSpec = sourceSpec(wrapper, image);
  const spec = parseImageSpec(rawSpec);
  clearImageLayout(wrapper);
  if (!spec.hasLayout) return false;

  wrapper.classList.add('vc-image-embed', `vc-image-${spec.alignment || 'center'}`);
  wrapper.dataset.vcImageLayout = rawSpec;

  if (spec.width) wrapper.style.setProperty('--vc-image-width', `${spec.width}px`);
  if (spec.gap !== undefined) wrapper.style.setProperty('--vc-image-gap', `${spec.gap}px`);

  if (spec.shape) {
    wrapper.classList.add('vc-image-shape');
    applyShapeSource(wrapper, image);
    image.addEventListener('load', () => applyShapeSource(wrapper, image), { once: true });
  }

  return true;
}

function imageEmbeds(root) {
  if (!root?.querySelectorAll) return [];
  const embeds = Array.from(root.querySelectorAll('.image-embed'));
  if (root.matches?.('.image-embed')) embeds.unshift(root);
  return [...new Set(embeds)];
}

function decorateImageEmbeds(root) {
  let decorated = 0;
  for (const wrapper of imageEmbeds(root)) {
    if (decorateImageEmbed(wrapper)) decorated += 1;
  }
  return decorated;
}

module.exports = class VisceriumImageToolsPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor((element) => {
      decorateImageEmbeds(element);
    });

    const refreshWorkspace = () => {
      window.requestAnimationFrame(() => decorateImageEmbeds(document));
    };

    this.registerEvent(this.app.workspace.on('layout-change', refreshWorkspace));
    this.registerEvent(this.app.workspace.on('active-leaf-change', refreshWorkspace));

    this.addCommand({
      id: 'refresh-article-image-layouts',
      name: 'Refresh article image layouts',
      callback: () => {
        const decorated = decorateImageEmbeds(document);
        new Notice(`Refreshed ${decorated} VISCERIUM image layout${decorated === 1 ? '' : 's'}.`);
      },
    });
  }
};
