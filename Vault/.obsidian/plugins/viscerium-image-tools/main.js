const { Notice, Plugin } = require('obsidian');

const ALIGNMENTS = new Set(['left', 'right', 'center', 'wide', 'full']);
const SHAPE_FLAGS = new Set(['shape', 'contour']);
const IMAGE_EXTENSIONS = new Set(['avif', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp']);
const ATTRIBUTION_EXTENSIONS = new Set(['svg', 'webp']);
const ATTRIBUTION_ROOTS = [
  { assetRoot: 'Assets/Images/', sidecarRoot: 'Assets/Attribution/Images/', publicRoot: '/assets/images/' },
  { assetRoot: 'Assets/Maps/', sidecarRoot: 'Assets/Attribution/Maps/', publicRoot: '/assets/maps/' },
];
const IMAGE_CLASSES = [
  'vc-image-embed',
  'vc-image-left',
  'vc-image-right',
  'vc-image-center',
  'vc-image-wide',
  'vc-image-full',
  'vc-image-shape',
];
const HEADER_SELECTOR = '[data-vc-header-image="true"]';
const HEADER_HOST_CLASS = 'vc-header-host';

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
  if (wrapper.dataset.vcImageLayout === rawSpec && wrapper.classList.contains('vc-image-embed')) {
    if (wrapper.classList.contains('vc-image-shape')) applyShapeSource(wrapper, image);
    return true;
  }

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
    if (!image.complete) {
      image.addEventListener('load', () => applyShapeSource(wrapper, image), { once: true });
    }
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

function normaliseHeaderImageValue(value) {
  let candidate = value;
  if (Array.isArray(candidate)) candidate = candidate[0];
  if (candidate && typeof candidate === 'object') {
    candidate = candidate.path ?? candidate.link ?? candidate.file ?? candidate.value;
  }

  let text = String(candidate ?? '').trim();
  if (!text) return '';

  const wikilink = text.match(/^!?\[\[([\s\S]+?)\]\]$/);
  if (wikilink) text = wikilink[1];

  return text.split('|')[0].trim();
}

function isExternalImage(reference) {
  return /^https:\/\//i.test(reference);
}

function isUrlReference(reference) {
  return /^[a-z][a-z0-9+.-]*:/i.test(reference) || reference.startsWith('//');
}

function isImageFile(file) {
  return Boolean(file?.extension && IMAGE_EXTENSIONS.has(String(file.extension).toLowerCase()));
}

function resolveHeaderImage(app, value, sourcePath) {
  const reference = normaliseHeaderImageValue(value);
  if (!reference) return undefined;

  if (isExternalImage(reference)) {
    return { key: reference, src: reference, file: undefined };
  }
  if (isUrlReference(reference)) return undefined;

  const direct = app.vault.getAbstractFileByPath(reference.replace(/^\/+/, ''));
  if (isImageFile(direct)) {
    return { key: direct.path, src: app.vault.getResourcePath(direct), file: direct };
  }

  const linked = app.metadataCache.getFirstLinkpathDest(reference, sourcePath);
  if (isImageFile(linked)) {
    return { key: linked.path, src: app.vault.getResourcePath(linked), file: linked };
  }

  const filename = reference.split('/').pop()?.toLowerCase();
  if (!filename) return undefined;

  const matches = app.vault.getFiles().filter((file) => (
    file.path.startsWith('Assets/Images/')
    && file.name.toLowerCase() === filename
    && isImageFile(file)
  ));

  if (matches.length !== 1) return undefined;
  const file = matches[0];
  return { key: file.path, src: app.vault.getResourcePath(file), file };
}

function headerTargets(container) {
  if (!container?.querySelectorAll) return [];
  return [...container.querySelectorAll(
    '.markdown-preview-view .markdown-preview-sizer, .markdown-source-view.mod-cm6 .cm-sizer',
  )];
}

function removeHeaderImages(container) {
  if (!container?.querySelectorAll) return;
  for (const figure of container.querySelectorAll(HEADER_SELECTOR)) figure.remove();
  for (const host of container.querySelectorAll(`.${HEADER_HOST_CLASS}`)) host.classList.remove(HEADER_HOST_CLASS);
}

function createHeaderFigure({ source, alt, decorative, ownerDocument = document }) {
  const figure = ownerDocument.createElement('figure');
  figure.className = 'vc-header-figure';
  figure.dataset.vcHeaderImage = 'true';
  figure.dataset.vcHeaderSource = source.key;
  figure.contentEditable = 'false';

  const image = ownerDocument.createElement('img');
  image.className = 'vc-header-image';
  image.src = source.src;
  image.alt = decorative ? '' : alt;
  image.decoding = 'async';
  image.draggable = false;
  if (decorative) figure.setAttribute('aria-hidden', 'true');

  figure.append(image);
  return figure;
}

function renderHeaderImage({ app, container, file }) {
  if (!container || !file) {
    removeHeaderImages(container);
    return false;
  }

  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
  const source = resolveHeaderImage(app, frontmatter.headerImage, file.path);
  const targets = headerTargets(container);

  if (!source || targets.length === 0) {
    removeHeaderImages(container);
    return false;
  }

  const decorative = frontmatter.decorativeImage === true;
  const alt = String(frontmatter.alt ?? `${file.basename} header image`).trim();
  const expectedAlt = decorative ? '' : alt;
  const targetSet = new Set(targets);

  for (const figure of container.querySelectorAll(HEADER_SELECTOR)) {
    if (!targetSet.has(figure.parentElement)) figure.remove();
  }

  for (const target of targets) {
    target.classList.add(HEADER_HOST_CLASS);
    let figure = target.querySelector(`:scope > ${HEADER_SELECTOR}`);
    const image = figure?.querySelector('img');
    const currentSource = figure?.dataset.vcHeaderSource;
    const currentAlt = image?.getAttribute('alt') ?? '';

    if (!figure || !image || currentSource !== source.key || currentAlt !== expectedAlt) {
      figure?.remove();
      figure = createHeaderFigure({
        source,
        alt,
        decorative,
        ownerDocument: target.ownerDocument,
      });
      target.insertBefore(figure, target.firstChild);
    } else if (target.firstChild !== figure) {
      target.insertBefore(figure, target.firstChild);
    }
  }

  return true;
}

function attributionSidecarSpec(file) {
  if (!file?.path || !ATTRIBUTION_EXTENSIONS.has(String(file.extension ?? '').toLowerCase())) return null;

  const root = ATTRIBUTION_ROOTS.find(({ assetRoot }) => file.path.startsWith(assetRoot));
  if (!root) return null;

  const relativePath = file.path.slice(root.assetRoot.length);
  if (!relativePath || relativePath.split('/').includes('variants')) return null;

  const title = String(file.basename ?? file.name ?? relativePath).replace(/\.(?:svg|webp)$/i, '');
  const asset = `${root.publicRoot}${relativePath}`;
  const sidecarPath = `${root.sidecarRoot}${relativePath}.md`;

  return { title, asset, sidecarPath };
}

function attributionSidecarMarkdown(spec) {
  const title = JSON.stringify(spec.title);
  const asset = JSON.stringify(spec.asset);
  return `---
title: ${title}
description: ${JSON.stringify(`Attribution and provenance record for ${spec.title}.`)}
status: published
type: image
asset: ${asset}
image: ${asset}
alt:
artist:
artistUrl:
editor:
source:
sourceUrl:
credit:
license:
rights: "Copyright"
usage:
sensitiveMedia: false
contentWarnings: []
tags: [attribution]
related: []
navigation:
  hidden: true
giscus: false
---

## Notes

Add any provenance context that does not fit the structured fields above.

## Usage Notes

Record where the image is used and any restrictions or expectations around reuse.

## Related

Link the lore, project, faction, character, location, or other material this image meaningfully depicts or supports.
`;
}

async function ensureVaultFolder(vault, folderPath) {
  const segments = String(folderPath ?? '').split('/').filter(Boolean);
  let current = '';

  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
  }
}

async function ensureAttributionSidecar(app, file) {
  const spec = attributionSidecarSpec(file);
  if (!spec || app.vault.getAbstractFileByPath(spec.sidecarPath)) return null;

  const folderPath = spec.sidecarPath.slice(0, spec.sidecarPath.lastIndexOf('/'));
  await ensureVaultFolder(app.vault, folderPath);

  if (app.vault.getAbstractFileByPath(spec.sidecarPath)) return null;
  await app.vault.create(spec.sidecarPath, attributionSidecarMarkdown(spec));
  return spec.sidecarPath;
}

module.exports = class VisceriumImageToolsPlugin extends Plugin {
  async onload() {
    let refreshTimer;

    const refreshWorkspace = () => {
      let decorated = 0;
      let headers = 0;

      for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
        const view = leaf.view;
        const container = view?.containerEl;
        decorated += decorateImageEmbeds(container);
        if (renderHeaderImage({ app: this.app, container, file: view?.file })) headers += 1;
      }

      return { decorated, headers };
    };

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        window.requestAnimationFrame(refreshWorkspace);
      }, 80);
    };

    this.register(() => window.clearTimeout(refreshTimer));

    this.registerMarkdownPostProcessor((element) => {
      decorateImageEmbeds(element);
      scheduleRefresh();
    });

    this.registerEvent(this.app.workspace.on('layout-change', scheduleRefresh));
    this.registerEvent(this.app.workspace.on('active-leaf-change', scheduleRefresh));
    this.registerEvent(this.app.workspace.on('file-open', scheduleRefresh));
    this.registerEvent(this.app.workspace.on('editor-change', scheduleRefresh));
    this.registerEvent(this.app.metadataCache.on('changed', scheduleRefresh));
    this.registerEvent(this.app.vault.on('create', (file) => {
      void ensureAttributionSidecar(this.app, file)
        .then((sidecarPath) => {
          if (sidecarPath) new Notice(`Created image attribution record: ${sidecarPath}`);
        })
        .catch((error) => {
          console.error('Failed to create image attribution sidecar', error);
          new Notice('Could not create the image attribution record. Check the developer console for details.');
        });
      scheduleRefresh();
    }));
    this.registerEvent(this.app.vault.on('rename', scheduleRefresh));
    this.registerEvent(this.app.vault.on('delete', scheduleRefresh));

    this.app.workspace.onLayoutReady(scheduleRefresh);

    this.addCommand({
      id: 'refresh-article-image-layouts',
      name: 'Refresh article image layouts',
      callback: () => {
        const { decorated, headers } = refreshWorkspace();
        new Notice(
          `Refreshed ${decorated} VISCERIUM image layout${decorated === 1 ? '' : 's'} and ${headers} article header${headers === 1 ? '' : 's'}.`,
        );
      },
    });
  }

  onunload() {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      removeHeaderImages(leaf.view?.containerEl);
    }
  }
};
