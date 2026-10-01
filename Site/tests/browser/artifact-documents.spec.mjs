import { test, expect } from '@playwright/test';

const articleUrl = 'http://127.0.0.1:4321/myrkildicary/myrkild/';

async function openArtifact(page, width) {
  await page.setViewportSize({width,height:900});
  await page.goto(articleUrl,{waitUntil:'domcontentloaded'});
  const artifact = page.locator('.cx-artifact[data-preset="citadel-note"]');
  await expect(artifact).toHaveAttribute('data-artifact-installed','true');
  await page.evaluate(async () => { await document.fonts.ready; });
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


test('approved V3 manuscript materials remain fixed across light and dark website themes', async ({page}) => {
  const artifact = await openArtifact(page,1365);
  const result=await artifact.evaluate(root => {
    const pageEl=root.querySelector('.cx-artifact-paper:not([hidden])');
    const heading=pageEl.querySelector('.rubric');
    const writing=pageEl.querySelector('.ms-prose');
    const ui=root.querySelector('.cx-artifact-view button[aria-pressed="false"]');
    const selected=root.querySelector('.cx-artifact-view button[aria-pressed="true"]');
    const snapshot=()=>{
      const paper=getComputedStyle(pageEl);
      return {
        ink:getComputedStyle(writing).color,
        rubricColor:getComputedStyle(heading).color,
        rubricFont:getComputedStyle(heading).fontFamily,
        paperBackground:paper.backgroundImage,
        paperMask:paper.maskImage||paper.webkitMaskImage,
        idleControl:getComputedStyle(ui).color,
        selectedText:getComputedStyle(selected).color,
        selectedBackground:getComputedStyle(selected).backgroundColor,
        textureCount:pageEl.querySelectorAll('.paper-shade,.paper-fold,.paper-grit,.guidelines').length,
      };
    };
    const first=snapshot();
    const initialTheme=document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme','light');
    const light=snapshot();
    document.documentElement.setAttribute('data-theme','dark');
    const dark=snapshot();
    if(initialTheme===null)document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme',initialTheme);
    return {first,light,dark};
  });
  for (const theme of [result.light,result.dark]) {
    expect(theme.ink).toBe('rgb(55, 39, 30)');
    expect(theme.rubricColor).toBe('rgb(146, 67, 59)');
    expect(theme.rubricFont).toContain('Eagle Lake');
    expect(theme.paperBackground).toContain('citadel-parchment.webp');
    expect(theme.paperMask).toContain('citadel-edge-mask.svg');
    expect(theme.textureCount).toBeGreaterThanOrEqual(5);
  }
  expect(result.light.ink).toBe(result.dark.ink);
  expect(result.light.rubricColor).toBe(result.dark.rubricColor);
  expect(result.light.paperBackground).toBe(result.dark.paperBackground);
  expect(result.light.idleControl).not.toBe(result.dark.idleControl);
  expect(result.light.selectedText).toBe(result.dark.selectedText);
});


test('artifact buttons use site era fills and background hover in both website themes', async ({page}) => {
  const artifact=await openArtifact(page,1365);
  // Check colour endpoints without sampling the deliberate 140ms UI transition.
  await page.addStyleTag({content: '.cx-artifact .cx-artifact-view button, .cx-artifact .cx-artifact-pager button {transition: none !important;}'});
  for (const theme of ['dark','light']) {
    await page.evaluate(theme => document.documentElement.setAttribute('data-theme',theme),theme);
    const mode=artifact.locator('.cx-artifact-view button[aria-pressed="true"]');
    const idle=artifact.locator('.cx-artifact-view button[aria-pressed="false"]');
    const next=artifact.getByRole('button',{name:'Next leaf'});
    const previous=artifact.getByRole('button',{name:'Previous leaf'});
    const state=await artifact.evaluate(root => {
      const active=root.querySelector('.cx-artifact-view button[aria-pressed="true"]');
      const inactive=root.querySelector('.cx-artifact-view button[aria-pressed="false"]');
      const next=root.querySelector('.cx-artifact-pager button:not(:disabled)');
      const disabled=root.querySelector('.cx-artifact-pager button:disabled');
      const style=node=>getComputedStyle(node);
      const expected=document.createElement('span');
      expected.style.backgroundColor='var(--era-e1-button)';
      root.append(expected);
      const eraFill=style(expected).backgroundColor;
      expected.style.backgroundColor='var(--era-e1-button-hover)';
      const eraHover=style(expected).backgroundColor;
      expected.remove();
      return {
        eraFill,eraHover,
        active:style(active).backgroundColor,
        idle:style(inactive).backgroundColor,
        next:style(next).backgroundColor,
        disabled:style(disabled).backgroundColor,
        radius:style(active).borderRadius,
        nextRadius:style(next).borderRadius,
        border:style(active).borderTopWidth,
      };
    });
    expect(state.active).toBe(state.eraFill);
    expect(state.active).not.toBe(state.idle);
    expect(state.radius).toBe('999px');
    expect(state.nextRadius).toBe('999px');
    expect(state.border).toBe('0px');
    await idle.hover();
    await expect.poll(() => idle.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe(state.eraHover);
    await next.hover();
    await expect.poll(() => next.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe(state.eraHover);
    expect(await previous.evaluate(node=>getComputedStyle(node).backgroundColor)).toBe(state.disabled);
    await mode.focus();
    await page.keyboard.press('Tab');
    await expect(idle).toBeFocused();
    expect(await idle.evaluate(node=>getComputedStyle(node).outlineStyle)).not.toBe('none');
  }
});

test('artifact button identities match each document era regardless of parent article', async ({page}) => {
  const artifact=await openArtifact(page,1365);
  await page.addStyleTag({content: '.cx-artifact .cx-artifact-view button {transition: none !important;}'});
  const mapped=await artifact.evaluate(root => {
    const original=root.dataset.preset;
    const active=root.querySelector('.cx-artifact-view button[aria-pressed="true"]');
    const probe=document.createElement('span');
    root.append(probe);
    const results=[];
    for (const [preset,token] of [
      ['citadel-note','--era-e1-button'],
      ['smog-dispatch','--era-e2-button'],
      ['nearsight-terminal','--era-e3-button'],
      ['entropy-diagnostic','--era-e4-button'],
    ]) {
      root.dataset.preset=preset;
      probe.style.backgroundColor='var('+token+')';
      results.push({
        preset,actual:getComputedStyle(active).backgroundColor,
        expected:getComputedStyle(probe).backgroundColor,
      });
    }
    root.dataset.preset=original;
    probe.remove();
    return results;
  });
  for (const {actual,expected} of mapped) expect(actual).toBe(expected);
});


test('CITADEL leaves turn as inert 3D paper, then reveal the correct page in both directions', async ({page}) => {
  const artifact = await openArtifact(page,1365);
  const stage = artifact.locator('.cx-artifact-stage');
  const next = artifact.getByRole('button',{name:'Next leaf'});
  const previous = artifact.getByRole('button',{name:'Previous leaf'});

  await next.click();
  await expect(artifact).toHaveAttribute('data-page-turning','forward');
  const sheet = stage.locator(':scope > .cx-citadel-turn-sheet');
  // Sample one animation frame atomically; the overlay must disappear on completion.
  const animation = await stage.evaluate(element => {
    const sheet = element.querySelector(':scope > .cx-citadel-turn-sheet');
    const artifact = element.closest('.cx-artifact');
    return {
      active: !!sheet,
      busy: element.getAttribute('aria-busy'),
      front: sheet?.querySelectorAll('.cx-citadel-turn-front > .manuscript').length ?? 0,
      back: sheet?.querySelectorAll('.cx-citadel-turn-back').length ?? 0,
      inert: sheet?.inert ?? false,
      interactiveCopies: sheet?.querySelectorAll('[id],button,[aria-controls]').length ?? -1,
      buttonsDisabled: [...artifact.querySelectorAll('.cx-artifact-pager button')].every(button => button.disabled),
    };
  });
  expect(animation).toMatchObject({
    active:true,busy:'true',front:1,back:1,inert:true,
    interactiveCopies:0,buttonsDisabled:true,
  });

  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 2 /');
  await expect(stage).not.toHaveAttribute('aria-busy','true');
  await expect(sheet).toHaveCount(0);
  await expect(stage.locator(':scope > .cx-artifact-paper:not([hidden])')).toHaveCount(1);

  await previous.click();
  await expect(artifact).toHaveAttribute('data-page-turning','backward');
  const reversePlacement = await stage.evaluate(element => {
    const turning = element.querySelector(':scope > .cx-citadel-turn-sheet');
    const currentLeaf = [...element.querySelectorAll(':scope > .cx-artifact-paper')]
      .find(paper => !paper.hidden && !paper.classList.contains('cx-citadel-turn-target'));
    return {turnTop:Number.parseFloat(turning.style.top),
      currentTop:currentLeaf.getBoundingClientRect().top-element.getBoundingClientRect().top};
  });
  expect(Math.abs(reversePlacement.turnTop-reversePlacement.currentTop)).toBeLessThan(3);
  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 1 /');
  await expect(sheet).toHaveCount(0);
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
});

test('CITADEL turn cancels cleanly on Original text and responsive repagination', async ({page}) => {
  const artifact = await openArtifact(page,1365);
  const stage = artifact.locator('.cx-artifact-stage');
  await artifact.getByRole('button',{name:'Next leaf'}).click();
  await expect(stage.locator('.cx-citadel-turn-sheet')).toHaveCount(1);
  await artifact.getByRole('button',{name:'Original text'}).click();
  await expect(stage.locator('.cx-citadel-turn-sheet')).toHaveCount(0);
  await expect(artifact.locator('.cx-artifact-source')).toBeVisible();
  await expect(stage).not.toHaveAttribute('aria-busy','true');

  await artifact.getByRole('button',{name:'Manuscript'}).click();
  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 1 /');
  await artifact.getByRole('button',{name:'Next leaf'}).click();
  await page.setViewportSize({width:390,height:850});
  await expect(stage.locator('.cx-citadel-turn-sheet')).toHaveCount(0);
  await expect(stage).not.toHaveAttribute('aria-busy','true');
  await expect(artifact.locator('.cx-artifact-paper:not([hidden])')).toHaveCount(1);
  const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  expect(docWidth).toBeLessThanOrEqual(390);
});

test('reduced-motion CITADEL uses instant navigation without a turn overlay', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  const artifact = await openArtifact(page,390);
  await artifact.getByRole('button',{name:'Next leaf'}).click();
  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 2 /');
  await expect(artifact.locator('.cx-citadel-turn-sheet')).toHaveCount(0);
  await expect(artifact).not.toHaveAttribute('data-page-turning','forward');
  await artifact.getByRole('button',{name:'Previous leaf'}).click();
  await expect(artifact.locator('.cx-artifact-count')).toContainText('Leaf 1 /');
});
