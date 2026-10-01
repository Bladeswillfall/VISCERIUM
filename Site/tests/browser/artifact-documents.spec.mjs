import { test, expect } from '@playwright/test';

const articleUrl = 'http://127.0.0.1:4321/myrkildicary/myrkild/';

async function openArtifact(page, width) {
  await page.setViewportSize({width,height:900});
  await page.goto(articleUrl,{waitUntil:'domcontentloaded'});
  const artifact = page.locator('.cx-artifact[data-preset="citadel-note"]');
  await expect(artifact).toHaveAttribute('data-artifact-installed','true');
  await expect(artifact.locator('.cx-artifact-paper:not([hidden])')).toHaveCount(1);
  return artifact;
}

test('manuscript paginates without dropping source words or losing Markdown anchors',async ({page}) => {
  const artifact = await openArtifact(page,1365);
  await expect(artifact.locator('.cx-artifact-pager')).toBeVisible();
  const state = await artifact.evaluate(root => {
    const source = root.querySelector('.cx-artifact-source').cloneNode(true);
    source.querySelectorAll('.cx-artifact-source-note').forEach(node => node.remove());
    const clean = value => value.replace(/\s+/g,' ').trim();
    const pages = [...root.querySelectorAll('.cx-artifact-paper')];
    const rendered = pages.map(page => {
      const prose = page.querySelector('.cx-artifact-prose').cloneNode(true);
      prose.querySelectorAll('.cx-artifact-note-trigger,.cx-artifact-inline-note').forEach(node => node.remove());
      return prose.textContent;
    }).join(' ');
    const leaf = root.querySelector('.cx-artifact-paper:not([hidden])');
    const anchor = leaf.querySelector('.cx-artifact-anchor');
    const aside = leaf.querySelector('.cx-artifact-margin-note');
    return {
      source:clean(source.textContent),
      rendered:clean(rendered),
      pages:pages.length,
      anchorAligned:anchor && aside
        ? Math.abs(anchor.getBoundingClientRect().top-aside.getBoundingClientRect().top)<35
        : null,
    };
  });
  expect(state.pages).toBeGreaterThan(1);
  expect(state.rendered).toBe(state.source);
  expect(state.anchorAligned).toBe(true);

  await artifact.getByRole('button',{name:'Next leaf'}).click();
  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 2 /');
  await artifact.getByRole('button',{name:'Original text'}).click();
  await expect(artifact.locator('.cx-artifact-source')).toBeVisible();
  await expect(artifact.locator('.cx-artifact-source-note')).toContainText(['Marginal note: I thought I was dead.']);
});

test('mobile manuscript keeps notes attached and preserves plain-text fallback',async ({page}) => {
  const artifact = await openArtifact(page,390);
  const visible = artifact.locator('.cx-artifact-paper:not([hidden])');
  await expect(visible.locator('.cx-artifact-margin-note')).toHaveCount(0);
  const trigger = visible.getByRole('button',{name:/Read annotation:/}).first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded','true');
  const detailId=await trigger.getAttribute('aria-controls');
  await expect(page.locator('[id="'+detailId+'"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded','false');

  const geometry=await artifact.evaluate(root => ({
    pageWidth:root.querySelector('.cx-artifact-paper:not([hidden])').getBoundingClientRect().width,
    artifactWidth:root.getBoundingClientRect().width,
    documentWidth:document.documentElement.scrollWidth,
    viewportWidth:window.innerWidth,
  }));
  expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.artifactWidth+1);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth+1);
});

test('pages without artifacts do not eagerly load artifact presentation',async ({page}) => {
  await page.goto('http://127.0.0.1:4321/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#viscerium-artifact-styles')).toHaveCount(0);
});
