/* Clone authored blocks without flattening their Markdown formatting. */
function tokenizeArtifactSource(source) {
// Keep one canonical Markdown-rendered source. Each visible leaf is a clone.
// Splitting text into small units preserves text, emphasis, links and note anchors.
const units = [];
let blockId = 0;
for (const block of source.children) {
  if (!block.matches('p')) {
    units.push({blockId,kind:'block',node:block.cloneNode(true)});
    blockId++;
    continue;
  }
  for (const node of block.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.match(/\S+\s*|\s+/gu) ?? [];
      let part = '', count = 0;
      for (const word of words) {
        part += word;
        if (word.trim()) count++;
        if (count >= 7) {
          units.push({blockId,kind:'p',node:document.createTextNode(part)});
          part = ''; count = 0;
        }
      }
      if (part) units.push({blockId,kind:'p',node:document.createTextNode(part)});
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.matches('.cx-artifact-source-note')) {
      units.push({blockId,kind:'p',node:node.cloneNode(true)});
    }
  }
  blockId++;
}

  return units;
}


function appendCitadelLayers(paper) {
  for (const name of ['paper-shade','paper-fold','paper-fold vertical','page-ghost']) {
    const layer=document.createElement('div');
    layer.className=name;
    layer.setAttribute('aria-hidden','true');
    paper.append(layer);
  }
  const art=document.createElementNS('http://www.w3.org/2000/svg','svg');
  art.setAttribute('class','ms-page-art');
  art.setAttribute('viewBox','0 0 900 1290');
  art.setAttribute('preserveAspectRatio','none');
  art.setAttribute('aria-hidden','true');
  art.innerHTML='<path d="M86 25 Q80 310 87 646 Q90 986 79 1250" fill="none" stroke="#745334" opacity=".12" stroke-width="11"/><path d="M90 24 Q82 311 93 646 Q95 983 85 1250" fill="none" stroke="#fff4cf" opacity=".28" stroke-width="2"/>';
  paper.append(art);
}

function appendCitadelGuides(inner) {
  for (const name of ['gutter','pricking','guidelines']) {
    const guide=document.createElement('div');
    guide.className=name;
    guide.setAttribute('aria-hidden','true');
    inner.append(guide);
  }
}

function appendCitadelScratch(inner) {
  const line=document.createElementNS('http://www.w3.org/2000/svg','svg');
  line.setAttribute('class','scratch-rubric');
  line.setAttribute('viewBox','0 0 90 12');
  line.setAttribute('aria-hidden','true');
  line.innerHTML='<path d="M1 6 Q28 5 45 4 T88 5" fill="none" stroke="#974a3b" stroke-width="1"/>';
  inner.append(line);
}

function artifactFolioHeight(preset,width) {
  if (preset === 'citadel-note') {
    return width <= 560 ? Math.max(530,Math.round(width*1.47)) : Math.round(width*1.43);
  }
  return Math.round(Math.max(width*(width<420?1.55:1.43),width<420?440:630));
}

function createArtifactPaper(root,preset,label,number,width) {
  const paper=document.createElement('article');
  paper.className='cx-artifact-paper'+(preset==='citadel-note'?' manuscript leaf':'');
  paper.dataset.condition=root.dataset.condition||'field';
  paper.dataset.hand=root.dataset.hand||'field';
  paper.dataset.ink=root.dataset.ink||'worn';
  paper.setAttribute('aria-label',label+', leaf '+number);
  if (preset === 'citadel-note') {
    paper.dataset.script=paper.dataset.hand;
    paper.dataset.wear=paper.dataset.condition;
    paper.dataset.notes='on';
    if(number===1) paper.dataset.firstLeaf='true';
    appendCitadelLayers(paper);
  }
  const height=artifactFolioHeight(preset,width);
  paper.style.setProperty('--artifact-folio-height',height+'px');
  paper.style.setProperty('--folio-height',height+'px');
  paper.dataset.baseHeight=String(height);
  const inner=document.createElement('div');
  inner.className='cx-artifact-inner'+(preset==='citadel-note'?' ms-body':'');
  if(preset==='citadel-note') appendCitadelGuides(inner);
  return {paper,inner};
}

function appendArtifactHeading(inner,root,preset,number,roman) {
  const isCitadel=preset==='citadel-note';
  const header=document.createElement('div');
  header.className='cx-artifact-folio-head'+(isCitadel?' ms-header':'');
  const date=document.createElement('span');
  date.textContent=(isCitadel&&number===1?'Date: ':'')+(root.dataset.date||'');
  const folio=document.createElement('span');
  if(isCitadel) folio.className='folio';
  folio.textContent=isCitadel?'fol. '+roman(number):String(number).padStart(2,'0');
  header.append(date,folio);
  inner.append(header);
  if(number===1&&root.dataset.title) {
    // The rubric belongs to the artifact, not the parent article heading hierarchy.
    const title=document.createElement(isCitadel?'div':'h3');
    title.className='cx-artifact-title'+(isCitadel?' rubric':'');
    title.textContent=root.dataset.title;
    inner.append(title);
    if(isCitadel) appendCitadelScratch(inner);
  } else if(number>1&&isCitadel) {
    const continuation=document.createElement('div');
    continuation.className='cx-artifact-continuation folio-continuation';
    continuation.setAttribute('aria-hidden','true');
    continuation.textContent='·  ·  ·';
    inner.append(continuation);
  }
}

function appendCitadelGrit(paper) {
  const grit=document.createElement('div');
  grit.className='paper-grit';
  grit.setAttribute('aria-hidden','true');
  paper.append(grit);
}


/**
 * Turn a cloned CITADEL folio instead of moving the source document.
 * Only the real pages carry selectable text, note controls and live-region state.
 * CSS scopes the 3D sheet to CITADEL; other artifact presets still switch instantly.
 */
function makeCitadelTurnSheet(page, stage) {
  const paper = page.cloneNode(true);
  paper.removeAttribute('aria-label');
  paper.removeAttribute('id');
  paper.querySelectorAll('[id], button, [aria-controls], [aria-expanded]').forEach(node => {
    if (node.matches('button')) node.remove();
    else {
      node.removeAttribute('id');
      node.removeAttribute('aria-controls');
      node.removeAttribute('aria-expanded');
    }
  });
  paper.style.margin = '0';
  paper.style.width = '100%';
  paper.style.height = '100%';
  paper.style.minHeight = '0';
  const sheet = document.createElement('div');
  sheet.className = 'cx-citadel-turn-sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.inert = true;
  const bounds = page.getBoundingClientRect();
  const host = stage.getBoundingClientRect();
  sheet.style.top = (bounds.top - host.top) + 'px';
  sheet.style.left = (bounds.left - host.left) + 'px';
  sheet.style.width = bounds.width + 'px';
  sheet.style.height = bounds.height + 'px';
  const front = document.createElement('div');
  front.className = 'cx-citadel-turn-front';
  front.append(paper);
  const back = document.createElement('div');
  back.className = 'cx-citadel-turn-back';
  back.setAttribute('aria-hidden', 'true');
  sheet.append(front, back);
  return sheet;
}

function createCitadelPageTurn({root,stage,previous,next,getPages,getCurrent,commit,positionNotes}) {
  let active = null;
  function cancel() {
    if (!active) return;
    const {sheet,outgoing,incoming,oldMinHeight,animation,timer} = active;
    active = null;
    clearTimeout(timer);
    animation?.cancel();
    sheet.remove();
    outgoing.style.visibility = '';
    incoming.style.visibility = '';
    incoming.classList.remove('cx-citadel-turn-target');
    incoming.inert = false;
    incoming.hidden = true;
    stage.style.minHeight = oldMinHeight;
    stage.classList.remove('cx-citadel-turning');
    stage.removeAttribute('aria-busy');
    delete root.dataset.pageTurning;
  }

  function turn(direction) {
    if (active) return false;
    const pages = getPages();
    const from = getCurrent();
    const target = from + direction;
    if (target < 0 || target >= pages.length) return false;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      || typeof Element.prototype.animate !== 'function') {
      commit(target);
      return true;
    }

    const outgoing = pages[from].paper;
    const incoming = pages[target].paper;
    incoming.classList.add('cx-citadel-turn-target');
    incoming.hidden = false;
    positionNotes(outgoing);
    positionNotes(incoming);
    const sheet = makeCitadelTurnSheet(direction > 0 ? outgoing : incoming, stage);
    const oldMinHeight = stage.style.minHeight;
    const taller = Math.max(outgoing.getBoundingClientRect().height,incoming.getBoundingClientRect().height);
    stage.style.minHeight = taller + 'px';
    stage.classList.add('cx-citadel-turning');
    stage.setAttribute('aria-busy', 'true');
    root.dataset.pageTurning = direction > 0 ? 'forward' : 'backward';
    // The outgoing page stays in document flow, keeping the reader's scroll position.
    // The incoming page waits beneath it and is never exposed to keyboard focus mid-turn.
    incoming.inert = true;
    incoming.style.visibility = direction > 0 ? 'visible' : 'hidden';
    outgoing.style.visibility = direction > 0 ? 'hidden' : 'visible';
    const focusedControl = document.activeElement === previous ? previous
      : document.activeElement === next ? next : null;
    previous.disabled = next.disabled = true;
    stage.append(sheet);

    const narrow = stage.getBoundingClientRect().width < 560;
    const forward = narrow
      ? [{transform:'rotateY(0deg)',opacity:1},{transform:'rotateY(-82deg)',opacity:1,offset:.68},
          {transform:'rotateY(-108deg)',opacity:0}]
      : [{transform:'rotateY(0deg)'},{transform:'rotateY(-180deg)'}];
    const backward = narrow
      ? [{transform:'rotateY(-108deg)',opacity:0},{transform:'rotateY(-82deg)',opacity:1,offset:.32},
          {transform:'rotateY(0deg)',opacity:1}]
      : [{transform:'rotateY(-180deg)'},{transform:'rotateY(0deg)'}];
    const animation = sheet.animate(direction > 0 ? forward : backward,{
      duration:narrow ? 610 : 880,
      easing:'cubic-bezier(.645,.045,.355,1)',
      fill:'both',
    });
    function finish() {
      if (!active || active.sheet !== sheet) return;
      cancel();
      incoming.inert = false;
      commit(target);
      // Disabling the pressed control during the animation can blur keyboard focus.
      if (focusedControl && (document.activeElement === document.body
        || document.activeElement === focusedControl)) {
        const destination = focusedControl.disabled ? (direction > 0 ? previous : next) : focusedControl;
        if (!destination.disabled) destination.focus({preventScroll:true});
      }
    }
    const timer = setTimeout(finish,narrow ? 760 : 1030);
    active = {sheet,outgoing,incoming,oldMinHeight,animation,timer};
    animation.finished.then(finish).catch(() => {});
    return true;
  }
  return {turn,cancel};
}

let artifactInstanceSequence = 0;

export function installArtifactDocuments(scope = document) {
  const widgets = [];
  const roman = (n) => {
    const values = ['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'];
    return values[n - 1] ?? String(n);
  };

  for (const root of scope.querySelectorAll('.cx-artifact:not([data-artifact-installed])')) {
    const source = root.querySelector(':scope > .cx-artifact-source');
    if (!source) continue;
    const noteIdPrefix = 'cx-artifact-' + (++artifactInstanceSequence) + '-note-';
    root.dataset.artifactInstalled = 'true';

    const preset = root.dataset.preset || 'citadel-note';
    const label = {
      'citadel-note': 'Manuscript',
      'smog-dispatch': 'Dispatch',
      'nearsight-terminal': 'Terminal',
      'entropy-diagnostic': 'Diagnostic',
    }[preset] ?? 'Artifact';

    const toolbar = document.createElement('div');
    toolbar.className = 'cx-artifact-toolbar';
    const modes = document.createElement('div');
    modes.className = 'cx-artifact-view';
    modes.setAttribute('role', 'group');
    modes.setAttribute('aria-label', 'Artifact presentation');
    const renderedButton = document.createElement('button');
    const plainButton = document.createElement('button');
    renderedButton.type = plainButton.type = 'button';
    renderedButton.textContent = label;
    plainButton.textContent = 'Original text';
    modes.append(renderedButton, plainButton);
    const meta = document.createElement('span');
    meta.className = 'cx-artifact-view-meta';
    meta.textContent = root.dataset.date || '';
    toolbar.append(modes, meta);

    const stage = document.createElement('div');
    stage.className = 'cx-artifact-stage' + (preset === 'citadel-note' ? ' leaves' : '');
    stage.setAttribute('aria-label', label + ' leaves');
    const pager = document.createElement('div');
    pager.className = 'cx-artifact-pager';
    const caption = document.createElement('span');
    caption.textContent = root.dataset.title || 'Document';
    const actions = document.createElement('div');
    actions.className = 'cx-artifact-actions';
    const previous = document.createElement('button');
    const next = document.createElement('button');
    const counter = document.createElement('span');
    counter.className = 'cx-artifact-count';
    counter.setAttribute('aria-live','polite');
    previous.textContent = '←'; next.textContent = '→';
    previous.type = next.type = 'button';
    previous.setAttribute('aria-label','Previous leaf');
    next.setAttribute('aria-label','Next leaf');
    actions.append(previous,counter,next);
    pager.append(caption,actions);
    source.before(toolbar,stage,pager);

    const units = tokenizeArtifactSource(source);

    let pages = [], current = 0, view = 'rendered', width = 0, scheduled = null, noteCount = 0, disposed = false;
    let pageTurn = null;
    function makePaper(number, folioWidth) {
      const {paper,inner}=createArtifactPaper(root,preset,label,number,folioWidth);
      appendArtifactHeading(inner,root,preset,number,roman);
      const prose=document.createElement('div');
      prose.className='cx-artifact-prose'+(preset==='citadel-note'?' ms-prose':'');
      inner.append(prose);
      paper.append(inner);
      if(preset==='citadel-note') appendCitadelGrit(paper);
      stage.append(paper);
      return {paper,prose};
    }

    function appendUnit(leaf,unit) {
      if (unit.kind === 'block') {
        leaf.prose.append(unit.node.cloneNode(true));
        return;
      }
      let p = leaf.prose.lastElementChild;
      if (!p || p.dataset.block !== String(unit.blockId)) {
        p = document.createElement('p');
        p.dataset.block = String(unit.blockId);
        leaf.prose.append(p);
      }
      p.append(unit.node.cloneNode(true));
    }

    function undoUnit(leaf,unit) {
      const last = leaf.prose.lastElementChild;
      if (unit.kind === 'block') { last?.remove(); return; }
      last?.lastChild?.remove();
      if (last && !last.childNodes.length) last.remove();
    }

    function overflows(leaf) {
      return leaf.prose.getBoundingClientRect().bottom >
        leaf.paper.getBoundingClientRect().bottom - Math.max(24, leaf.paper.clientWidth * .055);
    }

    function prepareAnchors(paper) {
      for (const anchor of paper.querySelectorAll('.cx-artifact-anchor[data-note]')) {
        const note = anchor.dataset.note;
        const id = noteIdPrefix + (++noteCount);
        const button = document.createElement('button');
        button.className = 'cx-artifact-note-trigger' + (preset === 'citadel-note' ? ' ms-note-trigger' : '');
        button.type = 'button';
        button.textContent = '✣';
        button.setAttribute('aria-label','Read annotation: ' + note);
        button.setAttribute('aria-expanded','false');
        button.setAttribute('aria-controls',id);
        const detail = document.createElement('span');
        detail.id = id;
        detail.className = 'cx-artifact-inline-note' + (preset === 'citadel-note' ? ' ms-inline-note' : '');
        detail.setAttribute('role','note');
        detail.hidden = true;
        detail.textContent = note;
        if (preset === 'citadel-note') anchor.classList.add('ms-note-anchor');
        anchor.after(button,detail);
      }
    }

    function drawMarginNotes(paper) {
      paper.querySelectorAll('.cx-artifact-margin-note').forEach(note => note.remove());
      if (paper.clientWidth < (preset === 'citadel-note' ? 560 : 460)) return;
      const body = paper.querySelector('.cx-artifact-inner');
      const anchors = [...paper.querySelectorAll('.cx-artifact-anchor[data-note]')];
      const target = anchors.map(anchor => ({
        anchor,
        top: anchor.getBoundingClientRect().top - paper.getBoundingClientRect().top,
      })).sort((a,b) => a.top-b.top);
      let nextAvailable = 45;
      for (const item of target) {
        const aside = document.createElement('aside');
        aside.className = 'cx-artifact-margin-note' + (preset === 'citadel-note' ? ' ms-aside' : '');
        aside.setAttribute('aria-hidden','true');
        aside.textContent = item.anchor.dataset.note;
        body.append(aside);
        const bound = paper.clientHeight - aside.offsetHeight - 29;
        const top = Math.max(item.top,nextAvailable,42);
        if (top > bound) {aside.remove();continue;}
        aside.style.top = top + 'px';
        nextAvailable = top + aside.offsetHeight + 11;
      }
    }

    function render() {
      pages.forEach((page,index) => {
        page.paper.hidden = view !== 'rendered' || index !== current;
      });
      stage.hidden = pager.hidden = view !== 'rendered';
      source.hidden = view === 'rendered';
      renderedButton.setAttribute('aria-pressed',String(view === 'rendered'));
      plainButton.setAttribute('aria-pressed',String(view !== 'rendered'));
      previous.disabled = current === 0;
      next.disabled = current >= pages.length - 1;
      counter.textContent = 'Leaf ' + (pages.length ? current + 1 : 0) + ' / ' + pages.length;
      meta.textContent = [root.dataset.date,pages.length ? pages.length + ' leaves' : ''].filter(Boolean).join('  /  ');
      if (view === 'rendered' && pages[current]) {
        requestAnimationFrame(() => {if (!disposed) drawMarginNotes(pages[current].paper);});
      }
    }

    function paginate() {
      if (disposed) return;
      pageTurn?.cancel();
      const selectedUnit = pages[current]?.first ?? 0;
      const measuredWidth = Math.round(stage.getBoundingClientRect().width) || Math.min(620,Math.round(root.getBoundingClientRect().width));
      if (!measuredWidth) return;
      width = measuredWidth;
      pages = [];
      noteCount = 0;
      stage.replaceChildren();
      if (!units.length) {render(); return;}
      let leaf = makePaper(1,width), pageFirst = 0, onPage = 0;
      for (let i=0;i<units.length;i++) {
        const unit = units[i];
        appendUnit(leaf,unit);
        if (overflows(leaf) && onPage) {
          undoUnit(leaf,unit);
          pages.push({...leaf,first:pageFirst,last:i-1});
          leaf = makePaper(pages.length+1,width);
          pageFirst = i;onPage = 0;
          appendUnit(leaf,unit);
        }
        if (overflows(leaf)) {
          // An indivisible element must grow its leaf rather than lose content.
          const contentBottom = leaf.prose.getBoundingClientRect().bottom - leaf.paper.getBoundingClientRect().top;
          const height = Math.ceil(contentBottom + Math.max(35, width * .07));
          leaf.paper.style.setProperty('--artifact-folio-height',height + 'px');
          leaf.paper.style.setProperty('--folio-height',height + 'px');
          leaf.paper.dataset.baseHeight = String(height);
        }
        onPage++;
      }
      pages.push({...leaf,first:pageFirst,last:units.length-1});
      for (const page of pages) prepareAnchors(page.paper);
      const preservedPage = pages.findIndex(page => page.first <= selectedUnit && page.last >= selectedUnit);
      current = Math.max(0,preservedPage);
      pages.forEach((page,index) => page.paper.setAttribute('aria-label',label + ', leaf ' + (index+1) + ' of ' + pages.length));
      render();
    }

    function schedule() {
      if (disposed) return;
      pageTurn?.cancel();
      clearTimeout(scheduled);
      scheduled = setTimeout(paginate,110);
    }

    function showNote(event) {
      const button = event.target.closest('.cx-artifact-note-trigger');
      if (!button || !stage.contains(button)) return;
      const detail = document.getElementById(button.getAttribute('aria-controls'));
      if (!detail) return;
      const isOpening = detail.hidden;
      const paper = button.closest('.cx-artifact-paper');
      for (const other of paper.querySelectorAll('.cx-artifact-inline-note')) other.hidden = true;
      for (const other of paper.querySelectorAll('.cx-artifact-note-trigger')) other.setAttribute('aria-expanded','false');
      detail.hidden = !isOpening;
      button.setAttribute('aria-expanded',String(isOpening));
      if (isOpening) {
        const contentBottom = paper.querySelector('.cx-artifact-prose').getBoundingClientRect().bottom - paper.getBoundingClientRect().top;
        paper.style.setProperty('--artifact-folio-height',Math.max(Number(paper.dataset.baseHeight),Math.ceil(contentBottom+38))+'px');
        paper.style.setProperty('--folio-height',Math.max(Number(paper.dataset.baseHeight),Math.ceil(contentBottom+38))+'px');
      } else {
        paper.style.setProperty('--artifact-folio-height',paper.dataset.baseHeight+'px');
        paper.style.setProperty('--folio-height',paper.dataset.baseHeight+'px');
      }
      requestAnimationFrame(() => drawMarginNotes(paper));
    }

    function escapeNote(event) {
      if (event.key !== 'Escape') return;
      const button = stage.querySelector('.cx-artifact-note-trigger[aria-expanded="true"]');
      if (button) {button.click();button.focus();}
    }

    // CITADEL turns a physical-looking folio. The other eras retain instant changes.
    if (preset === 'citadel-note') {
      pageTurn = createCitadelPageTurn({
        root,stage,previous,next,
        getPages:() => pages,
        getCurrent:() => current,
        commit:index => {current = index;render();},
        positionNotes:drawMarginNotes,
      });
    }
    function goBack() {
      if (current < 1) return;
      if (!pageTurn) {current--;render();return;}
      pageTurn.turn(-1);
    }
    function goForward() {
      if (current >= pages.length-1) return;
      if (!pageTurn) {current++;render();return;}
      pageTurn.turn(1);
    }
    function showRendered() {
      pageTurn?.cancel();
      view='rendered'; render();
      if (Math.round(stage.getBoundingClientRect().width) !== width) paginate();
    }
    function showOriginal() {pageTurn?.cancel();view='original';render();}
    renderedButton.addEventListener('click',showRendered);
    plainButton.addEventListener('click',showOriginal);
    previous.addEventListener('click',goBack);
    next.addEventListener('click',goForward);
    stage.addEventListener('click',showNote);
    stage.addEventListener('keydown',escapeNote);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      const nextWidth = Math.round(stage.getBoundingClientRect().width);
      if (nextWidth && nextWidth !== width) schedule();
    }) : null;
    observer?.observe(root);
    const onRepaginate = () => schedule();
    stage.addEventListener('artifact:repaginate',onRepaginate);
    widgets.push(() => {
      stage.removeEventListener('artifact:repaginate',onRepaginate);
      disposed=true;
      pageTurn?.cancel();
      observer?.disconnect();
      clearTimeout(scheduled);
      renderedButton.removeEventListener('click',showRendered);
      plainButton.removeEventListener('click',showOriginal);
      previous.removeEventListener('click',goBack);
      next.removeEventListener('click',goForward);
      stage.removeEventListener('click',showNote);
      stage.removeEventListener('keydown',escapeNote);
      toolbar.remove();stage.remove();pager.remove();source.hidden=false;
      delete root.dataset.artifactInstalled;
    });
    paginate();
  }
  // Individual widgets observe width. Late font loads need a second pagination
  // after browser font metrics settle; dispatch an event to the installed roots.
  const onFonts = () => {
    for (const root of scope.querySelectorAll('.cx-artifact[data-artifact-installed]')) {
      root.dispatchEvent(new Event('artifact:fonts-loaded'));
    }
  };
  const fontListeners = [];
  for (const root of scope.querySelectorAll('.cx-artifact[data-artifact-installed]')) {
    const listener = () => {
      const stage = root.querySelector('.cx-artifact-stage');
      // Changing width by a fraction of a pixel is not enough: request
      // rerender through each widget's existing event listener.
      stage?.dispatchEvent(new Event('artifact:repaginate'));
    };
    root.addEventListener('artifact:fonts-loaded',listener);
    fontListeners.push([root,listener]);
  }
  if (document.fonts) {
    document.fonts.ready.then(onFonts);
    document.fonts.addEventListener?.('loadingdone',onFonts);
  }
  return () => {
    if (document.fonts) document.fonts.removeEventListener?.('loadingdone',onFonts);
    for (const [root,listener] of fontListeners) root.removeEventListener('artifact:fonts-loaded',listener);
    for (const dispose of widgets) dispose();
  };
}
