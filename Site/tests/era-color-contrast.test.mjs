import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const eraStyles = readFileSync(new URL('../src/styles/era-styles.css', import.meta.url), 'utf8');

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
}

function linear(channel) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map(linear);
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

function contrast(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const themes = {
  dark: {
    background: '#101010',
    links: {
      e1: ['#b56873', '#f83b52'],
      e2: ['#7d8250', '#7f8d00'],
      e3: ['#b2668d', '#eb4684'],
      e4: ['#568786', '#009688'],
    },
    buttons: {
      e1: ['#974e59', '#e01c3f'],
      e2: ['#5f6900', '#6d7a00'],
      e3: ['#954b72', '#d42e71'],
      e4: ['#756047', '#797267'],
    },
  },
  light: {
    background: '#b9b4a9',
    links: {
      e1: ['#7b0f2f', '#62000c'],
      e2: ['#444700', '#2c3300'],
      e3: ['#73144e', '#5f0028'],
      e4: ['#004849', '#00342e'],
    },
    buttons: {
      e1: ['#5f1b2a', '#500000'],
      e2: ['#313700', '#222600'],
      e3: ['#5d1840', '#4f0010'],
      e4: ['#433018', '#292219'],
    },
  },
};

test('era links clear AA contrast and gain contrast on hover in both themes', () => {
  for (const [theme, palette] of Object.entries(themes)) {
    for (const [era, [normal, hover]] of Object.entries(palette.links)) {
      const normalContrast = contrast(normal, palette.background);
      const hoverContrast = contrast(hover, palette.background);

      assert.ok(normalContrast >= 4.5, `${theme} ${era} link contrast must be at least 4.5:1`);
      assert.ok(hoverContrast > normalContrast, `${theme} ${era} hover must increase link contrast`);
    }
  }
});

test('era buttons maintain component separation, stronger hover separation, and readable labels', () => {
  const label = '#ffffff';

  for (const [theme, palette] of Object.entries(themes)) {
    for (const [era, [normal, hover]] of Object.entries(palette.buttons)) {
      const normalSeparation = contrast(normal, palette.background);
      const hoverSeparation = contrast(hover, palette.background);

      assert.ok(normalSeparation >= 3, `${theme} ${era} button must separate from the page at 3:1 or better`);
      assert.ok(hoverSeparation > normalSeparation, `${theme} ${era} button hover must increase separation`);
      assert.ok(contrast(label, normal) >= 4.5, `${theme} ${era} button label must clear 4.5:1`);
      assert.ok(contrast(label, hover) >= 4.5, `${theme} ${era} hover label must clear 4.5:1`);
    }
  }
});

test('era identity colours use OKLCH and the shared P3 chroma multiplier', () => {
  assert.match(eraStyles, /@supports \(color: oklch\(from red l c h\)\)/);
  assert.match(eraStyles, /var\(--codex-chroma-scale\)/);
  assert.match(eraStyles, /--era-e1-base:\s*oklch\(/);
  assert.match(eraStyles, /--era-e2-base:\s*oklch\(/);
  assert.match(eraStyles, /--era-e3-base:\s*oklch\(/);
  assert.match(eraStyles, /--era-e4-base:\s*oklch\(/);
});

test('era four keeps teal navigation identity and brown control identity', () => {
  assert.match(eraStyles, /--era-e4-accent:\s*#568786/);
  assert.match(eraStyles, /--era-e4-button:\s*#756047/);
  assert.match(eraStyles, /--era-e4-button-hover:\s*#797267/);
});
