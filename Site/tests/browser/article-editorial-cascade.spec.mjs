import { test, expect } from '@playwright/test';

const errackUrl = 'http://127.0.0.1:4321/degel-system/errack/';

test.use({ viewport: { width: 1280, height: 900 } });

test('Errack renders the approved article hierarchy and detail polish', async ({ page }) => {
  await page.goto(errackUrl, { waitUntil: 'networkidle' });
  await expect(page.locator('.codex-page-classifier--article')).toHaveCount(1);
  await expect(page.locator('.codex-page-classifier--structural')).toHaveCount(0);

  const result = await page.evaluate(() => {
    const h2 = document.querySelector('.sl-markdown-content h2');
    const h2Icon = h2?.querySelector('.codex-heading-icon');
    const h3 = document.querySelector('.sl-markdown-content h3');
    const h4 = document.querySelector('.sl-markdown-content h4');
    const h3Wrapper = document.querySelector('.sl-markdown-content .sl-heading-wrapper.level-h3');
    const h4Wrapper = document.querySelector('.sl-markdown-content .sl-heading-wrapper.level-h4');
    const paragraphAfterH4 = document.querySelector('.sl-markdown-content .sl-heading-wrapper.level-h4 + p');
    const firstBullet = document.querySelector('.sl-markdown-content ul > li');
    const artCaption = document.querySelector('.codex-sidebar-art-caption');

    if (
      !(h2 instanceof HTMLElement) ||
      !(h2Icon instanceof HTMLElement) ||
      !(h3 instanceof HTMLElement) ||
      !(h4 instanceof HTMLElement) ||
      !(h3Wrapper instanceof HTMLElement) ||
      !(h4Wrapper instanceof HTMLElement) ||
      !(firstBullet instanceof HTMLLIElement) ||
      !(artCaption instanceof HTMLElement)
    ) return null;

    const h2Style = getComputedStyle(h2);
    const h2IconStyle = getComputedStyle(h2Icon);
    const before = getComputedStyle(h2, '::before');
    const after = getComputedStyle(h2, '::after');
    const h3Style = getComputedStyle(h3);
    const h4Style = getComputedStyle(h4);
    const h3WrapperStyle = getComputedStyle(h3Wrapper);
    const h4WrapperStyle = getComputedStyle(h4Wrapper);
    const paragraphStyle = paragraphAfterH4 instanceof HTMLParagraphElement ? getComputedStyle(paragraphAfterH4) : null;
    const markerStyle = getComputedStyle(firstBullet, '::marker');
    const artCaptionStyle = getComputedStyle(artCaption);

    return {
      h2PaddingLeft: h2Style.paddingLeft,
      h2FontSize: Number.parseFloat(h2Style.fontSize),
      h2MarginBottom: h2Style.marginBottom,
      h2IconFontSize: Number.parseFloat(h2IconStyle.fontSize),
      beforeContent: before.content,
      beforeDisplay: before.display,
      afterDisplay: after.display,
      afterHeight: after.height,
      afterBackground: after.backgroundImage,
      h3FontSize: Number.parseFloat(h3Style.fontSize),
      h3FontWeight: h3Style.fontWeight,
      h3LetterSpacing: h3Style.letterSpacing,
      h3LineHeight: Number.parseFloat(h3Style.lineHeight),
      h3TextTransform: h3Style.textTransform,
      h3PaddingBottom: h3Style.paddingBottom,
      h3MarginBottom: h3Style.marginBottom,
      h4MarginBottom: h4Style.marginBottom,
      h3WrapperMarginBottom: h3WrapperStyle.marginBottom,
      h4WrapperMarginBottom: h4WrapperStyle.marginBottom,
      followingParagraphMarginTop: paragraphStyle?.marginTop ?? null,
      bulletMarkerContent: markerStyle.content,
      artCaptionBackground: artCaptionStyle.backgroundColor,
      artCaptionBorderTopWidth: artCaptionStyle.borderTopWidth,
    };
  });

  expect(result).not.toBeNull();
  expect(result.h2PaddingLeft).toBe('0px');
  expect(result.h2FontSize).toBeLessThanOrEqual(38.5);
  expect(result.h2MarginBottom).toBe('-24px');
  expect(result.h2IconFontSize / result.h2FontSize).toBeGreaterThanOrEqual(0.79);
  expect(['none', 'normal', '""']).toContain(result.beforeContent);
  expect(result.beforeDisplay).toBe('none');
  expect(result.afterDisplay).toBe('block');
  expect(result.afterHeight).toBe('1px');
  expect(result.afterBackground).toContain('linear-gradient');
  expect(result.h3FontSize).toBe(16);
  expect(Number(result.h3FontWeight)).toBe(600);
  expect(result.h3LetterSpacing).toBe('3.2px');
  expect(result.h3LineHeight).toBeCloseTo(21.6, 1);
  expect(result.h3TextTransform).toBe('uppercase');
  expect(result.h3PaddingBottom).toBe('0px');
  expect(result.h3MarginBottom).toBe('0px');
  expect(result.h4MarginBottom).toBe('0px');
  expect(result.h3WrapperMarginBottom).toBe('0px');
  expect(result.h4WrapperMarginBottom).toBe('0px');
  expect(result.followingParagraphMarginTop).toBe('0px');
  expect(result.bulletMarkerContent).toContain('◆');
  expect(result.artCaptionBackground).toBe('rgba(0, 0, 0, 0)');
  expect(result.artCaptionBorderTopWidth).toBe('0px');
});
