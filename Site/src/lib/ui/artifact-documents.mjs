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
    function makePaper(number, folioWidth) {
      const paper = document.createElement('article');
      paper.className = 'cx-artifact-paper' + (preset === 'citadel-note' ? ' manuscript leaf' : '');
      if (preset === 'citadel-note') {
        paper.dataset.script = root.dataset.hand || 'field';
        paper.dataset.wear = root.dataset.condition || 'field';
        paper.dataset.notes = 'on';
        if (number === 1) paper.dataset.firstLeaf = 'true';
        for (const name of ['paper-shade','paper-fold','paper-fold vertical','page-ghost']) {
          const layer = document.createElement('div');
          layer.className = name;
          layer.setAttribute('aria-hidden','true');
          paper.append(layer);
        }
        const artwork = document.createElementNS('http://www.w3.org/2000/svg','svg');
        artwork.setAttribute('class','ms-page-art');
        artwork.setAttribute('viewBox','0 0 900 1290');
        artwork.setAttribute('preserveAspectRatio','none');
        artwork.setAttribute('aria-hidden','true');
        artwork.innerHTML = '<path d="M86 25 Q80 310 87 646 Q90 986 79 1250" fill="none" stroke="#745334" opacity=".12" stroke-width="11"/><path d="M90 24 Q82 311 93 646 Q95 983 85 1250" fill="none" stroke="#fff4cf" opacity=".28" stroke-width="2"/>';
        paper.append(artwork);
      }
      paper.dataset.condition = root.dataset.condition || 'field';
      paper.dataset.hand = root.dataset.hand || 'field';
      paper.dataset.ink = root.dataset.ink || 'worn';
      paper.setAttribute('aria-label',label + ', leaf ' + number);
      const height = preset === 'citadel-note'
        ? (folioWidth <= 560 ? Math.max(530,Math.round(folioWidth * 1.47)) : Math.round(folioWidth * 1.43))
        : Math.round(Math.max(folioWidth * (folioWidth < 420 ? 1.55 : 1.43), folioWidth < 420 ? 440 : 630));
      paper.style.setProperty('--artifact-folio-height',height + 'px');
      paper.style.setProperty('--folio-height',height + 'px');
      paper.dataset.baseHeight = String(height);
      const inner = document.createElement('div');
      inner.className = 'cx-artifact-inner' + (preset === 'citadel-note' ? ' ms-body' : '');
      if (preset === 'citadel-note') {
        for (const name of ['gutter','pricking','guidelines']) {
          const mark = document.createElement('div');
          mark.className = name;
          mark.setAttribute('aria-hidden','true');
          inner.append(mark);
        }
      }
      const header = document.createElement('div');
      header.className = 'cx-artifact-folio-head' + (preset === 'citadel-note' ? ' ms-header' : '');
      const date = document.createElement('span');
      date.textContent = (preset === 'citadel-note' && number === 1 ? 'Date: ' : '') + (root.dataset.date || '');
      const folio = document.createElement('span');
      if (preset === 'citadel-note') folio.className = 'folio';
      folio.textContent = preset === 'citadel-note' ? 'fol. ' + roman(number) : String(number).padStart(2,'0');
      header.append(date,folio);
      inner.append(header);
      if (number === 1 && root.dataset.title) {
        // Decorative artifact rubric is not a heading in the surrounding article.
        const title = document.createElement(preset === 'citadel-note' ? 'div' : 'h3');
        title.className = 'cx-artifact-title' + (preset === 'citadel-note' ? ' rubric' : '');
        title.textContent = root.dataset.title;
        inner.append(title);
        if (preset === 'citadel-note') {
          const scratch = document.createElementNS('http://www.w3.org/2000/svg','svg');
          scratch.setAttribute('class','scratch-rubric');
          scratch.setAttribute('viewBox','0 0 90 12');
          scratch.setAttribute('aria-hidden','true');
          scratch.innerHTML = '<path d="M1 6 Q28 5 45 4 T88 5" fill="none" stroke="#974a3b" stroke-width="1"/>';
          inner.append(scratch);
        }
      } else if (number > 1 && preset === 'citadel-note') {
        const continuation = document.createElement('div');
        continuation.className = 'cx-artifact-continuation' + (preset === 'citadel-note' ? ' folio-continuation' : '');
        continuation.setAttribute('aria-hidden','true');
        continuation.textContent = '·  ·  ·';
        inner.append(continuation);
      }
      const prose = document.createElement('div');
      prose.className = 'cx-artifact-prose' + (preset === 'citadel-note' ? ' ms-prose' : '');
      inner.append(prose);
      paper.append(inner);
      if (preset === 'citadel-note') {
        const grit = document.createElement('div');
        grit.className = 'paper-grit';
        grit.setAttribute('aria-hidden','true');
        paper.append(grit);
      }
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

    function goBack() {if (current>0) {current--;render();}}
    function goForward() {if (current<pages.length-1) {current++;render();}}
    function showRendered() {
      view='rendered'; render();
      if (Math.round(stage.getBoundingClientRect().width) !== width) paginate();
    }
    function showOriginal() {view='original';render();}
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
