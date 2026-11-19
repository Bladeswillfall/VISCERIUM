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

test('ordinary H3 subsections indent their entire prose range while H2 text stays full-width', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/eras/citadel/nations/okse-dominion/', { waitUntil: 'networkidle' });

  const positions = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content.codex-editorial-article');
    if (!content) return null;

    const headingBlocks = (level) => [...content.querySelectorAll(level)]
      .map((heading) => heading.closest('.sl-heading-wrapper') ?? heading)
      .filter((block) => block.parentElement === content);
    // The authored prose can differ from the checked-in generated MDX. Verify
    // the Markdown structure, not a particular revision of an article's text.
    const h3 = headingBlocks('h3').find((block) =>
      block.nextElementSibling?.matches('p')
      && block.nextElementSibling.nextElementSibling?.matches('p'));
    const h2 = headingBlocks('h2')[0];
    const firstParagraph = h3?.nextElementSibling;
    const secondParagraph = firstParagraph?.nextElementSibling;

    return {
      h3Depth: h3?.getAttribute('data-codex-section-indent'),
      paragraphDepths: [firstParagraph?.getAttribute('data-codex-section-indent'), secondParagraph?.getAttribute('data-codex-section-indent')],
      h2Depth: h2?.getAttribute('data-codex-section-indent'),
      h3Offset: h3 ? Number.parseFloat(getComputedStyle(h3).marginLeft) : null,
      paragraphOffsets: [firstParagraph, secondParagraph].map((node) => node ? Number.parseFloat(getComputedStyle(node).marginLeft) : null),
      h2Offset: h2 ? Number.parseFloat(getComputedStyle(h2).marginLeft) : null,
    };
  });

  expect(positions).not.toBeNull();
  expect(positions.h3Depth).toBe('1');
  expect(positions.paragraphDepths).toEqual(['1', '1']);
  expect(positions.h2Depth).toBeNull();
  expect(positions.h3Offset).toBeCloseTo(36, 0);
  expect(positions.paragraphOffsets).toEqual([36, 36]);
  expect(positions.h2Offset).toBeLessThan(4);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileOffset = await page.evaluate(() => {
    const content = document.querySelector('.sl-markdown-content.codex-editorial-article');
    const heading = [...content.querySelectorAll('h3')]
      .map((node) => node.closest('.sl-heading-wrapper') ?? node)
      .find((block) => block.parentElement === content && block.nextElementSibling?.matches('p')
        && block.nextElementSibling.nextElementSibling?.matches('p'));
    return heading ? Number.parseFloat(getComputedStyle(heading).marginLeft) : null;
  });
  expect(mobileOffset).toBeCloseTo(18, 0);
});

test('manual Valenheim indents remain single-depth rather than doubling', async ({ page }) => {
  await page.goto('http://127.0.0.1:4321/eras/citadel/nations/okse-dominion/regions/halvmaneheimr/settlements/valenheim/', { waitUntil: 'networkidle' });
  const authoredIndent = page.locator('.sl-markdown-content blockquote:has(.vc-layout-indent-marker)').first();
  await expect(authoredIndent).toHaveCount(1);
  await expect(authoredIndent).not.toHaveAttribute('data-codex-section-indent', /[12]/);
  const offset = await authoredIndent.evaluate((element) => Number.parseFloat(getComputedStyle(element).marginLeft));
  expect(offset).toBeCloseTo(36, 0);
});
