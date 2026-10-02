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
 * A paper-stack carousel. All real pages stay in the existing reading order.
 * The outgoing leaf animates as an inert visual copy while the next real leaf
 * waits beneath it. Fixed-height stage and absolute underlay avoid layout jumps.
 */
function makeCitadelStackSheet(page,stage) {
  const paper=page.cloneNode(true);
  paper.removeAttribute('id');
  paper.removeAttribute('aria-label');
  paper.querySelectorAll('button,[id],[aria-controls],[aria-expanded],[tabindex],[aria-live],a[href]')
    .forEach(node => {
      if(node.matches('button')) {node.remove();return;}
      for(const attr of ['id','aria-controls','aria-expanded','tabindex','aria-live','href'])
        node.removeAttribute(attr);
    });
  paper.hidden=false;
  const bounds=page.getBoundingClientRect();
  const frame=stage.getBoundingClientRect();
  const sheet=document.createElement('div');
  sheet.className='cx-citadel-stack-sheet';
  sheet.setAttribute('aria-hidden','true');
  sheet.inert=true;
  sheet.style.top=(bounds.top-frame.top)+'px';
  sheet.style.left=(bounds.left-frame.left)+'px';
  sheet.style.width=bounds.width+'px';
  sheet.style.height=bounds.height+'px';
  sheet.append(paper);
  return sheet;
}

function citadelStackKeyframes(direction,narrow) {
  const sign=direction>0?1:-1;
  const spread=narrow?12:19;
  const angle=sign*(narrow?3.4:4.8);
  return [
    {offset:0, transform:'translate(0,0) rotate(0deg) scale(1)', opacity:1},
    {offset:.34,transform:'translate('+(sign*spread*.55)+'%, -7px) rotate('+(angle*.65)+'deg) scale(.995)',opacity:1},
    {offset:.62,transform:'translate('+(sign*spread)+'%, 3px) rotate('+angle+'deg) scale(.982)',opacity:.92},
    {offset:.83,transform:'translate('+(sign*spread*.42)+'%, 9px) rotate('+(angle*.43)+'deg) scale(.976)',opacity:.52},
    {offset:1,transform:'translate('+(sign*4)+'px, 8px) rotate('+(sign*.8)+'deg) scale(.98)',opacity:0},
  ];
}

function createCitadelPageTurn({root,stage,previous,next,getPages,getCurrent,commit,positionNotes,onSettled}) {
  let active=null;

  function cancel(complete=false) {
    if(!active)return;
    const {sheet,outgoing,incoming,animation,timer,target,direction,focusedControl}=active;
    active=null;
    clearTimeout(timer);
    animation?.cancel();
    sheet.remove();
    outgoing.style.visibility='';
    outgoing.inert=false;
    incoming.style.visibility='';
    incoming.inert=false;
    incoming.classList.remove('cx-citadel-stack-target');
    incoming.hidden=true;
    stage.classList.remove('cx-citadel-stacking');
    stage.removeAttribute('aria-busy');
    delete root.dataset.pageTurning;
    if(complete){
      commit(target);
      if(focusedControl && (document.activeElement===document.body
        || document.activeElement===focusedControl)){
        const available=focusedControl.disabled
          ? (direction>0?previous:next):focusedControl;
        if(!available.disabled)available.focus({preventScroll:true});
      }
      onSettled?.();
    }
  }

  function turn(direction) {
    if(active)return false;
    const pages=getPages();
    const target=getCurrent()+direction;
    if(target<0||target>=pages.length)return false;
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      || typeof Element.prototype.animate!=='function'){
      commit(target);
      onSettled?.();
      return true;
    }
    const outgoing=pages[getCurrent()].paper;
    const incoming=pages[target].paper;
    // Underlay leaves flow immediately; outgoing retains its original layout slot.
    stage.classList.add('cx-citadel-stacking');
    incoming.classList.add('cx-citadel-stack-target');
    incoming.hidden=false;
    incoming.inert=true;
    positionNotes(outgoing);
    positionNotes(incoming);
    const sheet=makeCitadelStackSheet(outgoing,stage);
    const focusedControl=document.activeElement===previous?previous
      :document.activeElement===next?next:null;
    outgoing.style.visibility='hidden';
    outgoing.inert=true;
    stage.setAttribute('aria-busy','true');
    root.dataset.pageTurning=direction>0?'forward':'backward';
    previous.disabled=next.disabled=true;
    stage.append(sheet);
    const narrow=stage.getBoundingClientRect().width<560;
    const duration=narrow?560:780;
    const animation=sheet.animate(citadelStackKeyframes(direction,narrow),{
      duration,easing:'cubic-bezier(.42,0,.22,1)',fill:'both'
    });
    function finish(){
      if(active?.sheet===sheet)cancel(true);
    }
    const timer=setTimeout(finish,duration+240);
    active={sheet,outgoing,incoming,animation,timer,target,direction,focusedControl};
    animation.finished.then(finish).catch(()=>{});
    return true;
  }

  return {turn,cancel,isActive:()=>Boolean(active)};
}


function rememberOpenArtifactNote(paper) {
  if (!paper) return null;
  const button = paper.querySelector('.cx-artifact-note-trigger[aria-expanded="true"]');
  const anchor = button?.previousElementSibling;
  if (!anchor?.dataset.note) return null;
  return {note:anchor.dataset.note, text:anchor.textContent, focused:button === document.activeElement};
}

function findArtifactNotePage(pages,note) {
  if (!note) return -1;
  return pages.findIndex(page => [...page.paper.querySelectorAll('.cx-artifact-anchor')]
    .some(anchor => anchor.dataset.note === note.note && anchor.textContent === note.text));
}

function restoreOpenArtifactNote(paper,note) {
  if (!paper || !note) return;
  const anchor = [...paper.querySelectorAll('.cx-artifact-anchor')]
    .find(item => item.dataset.note === note.note && item.textContent === note.text);
  const button = anchor?.nextElementSibling;
  button?.click();
  if (note.focused) button?.focus({preventScroll:true});
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
    let pendingFontRepagination = false;
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
      if (view !== 'rendered') {pendingFontRepagination = true;return;}
      pageTurn?.cancel(true);
      const expandedNote = rememberOpenArtifactNote(pages[current]?.paper);
      const selectedUnit = pages[current]?.first ?? 0;
      const measuredWidth = Math.round(stage.getBoundingClientRect().width) || Math.min(620,Math.round(root.getBoundingClientRect().width));
      if (!measuredWidth) return;
      width = measuredWidth;
      pages = [];
      noteCount = 0;
      stage.style.minHeight='';
      stage.style.removeProperty('--citadel-stack-height');
      delete stage.dataset.stack;
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
      // Reserve the tallest rendered leaf for the entire CITADEL stack. Every
      // page change now occupies the same document-flow height.
      if(preset==='citadel-note'){
        const height=Math.ceil(Math.max(...pages.map(page=>page.paper.getBoundingClientRect().height)));
        stage.style.minHeight=(height+15)+'px';
        stage.style.setProperty('--citadel-stack-height',height+'px');
        stage.dataset.stack=pages.length>1?'multiple':'single';
      }
      for (const page of pages) prepareAnchors(page.paper);
      const preservedPage = pages.findIndex(page => page.first <= selectedUnit && page.last >= selectedUnit);
      current = Math.max(0,preservedPage);
      const notePage = findArtifactNotePage(pages,expandedNote);
      if (notePage >= 0) current = notePage;
      pages.forEach((page,index) => page.paper.setAttribute('aria-label',label + ', leaf ' + (index+1) + ' of ' + pages.length));
      render();
      restoreOpenArtifactNote(pages[current].paper,expandedNote);
    }

    function schedule(reason = 'fonts') {
      if (disposed) return;
      if (view !== 'rendered') {pendingFontRepagination = true;return;}
      if (reason === 'resize') {
        pendingFontRepagination = false;
        pageTurn?.cancel(true);
      } else if (pageTurn?.isActive()) {
        // Font metrics can settle mid-flip. Finish the physical turn first.
        pendingFontRepagination = true;
        return;
      }
      clearTimeout(scheduled);
      scheduled = setTimeout(() => {scheduled = null;paginate();},110);
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
        onSettled:() => {
          if (pendingFontRepagination) {
            pendingFontRepagination = false;
            schedule();
          }
        },
      });
    }
    function requestTurn(direction) {
      if (scheduled !== null) {
        // An earlier font event may have queued a reflow before the click.
        clearTimeout(scheduled);
        scheduled = null;
        pendingFontRepagination = true;
      }
      pageTurn.turn(direction);
    }
    function goBack() {
      if (current < 1) return;
      if (!pageTurn) {current--;render();return;}
      requestTurn(-1);
    }
    function goForward() {
      if (current >= pages.length-1) return;
      if (!pageTurn) {current++;render();return;}
      requestTurn(1);
    }
    function showRendered() {
      pageTurn?.cancel();
      view = 'rendered';render();
      if (pendingFontRepagination || Math.round(stage.getBoundingClientRect().width) !== width) {
        pendingFontRepagination = false;
        clearTimeout(scheduled);
        scheduled = null;
        paginate();
      }
    }
    function showOriginal() {
      pageTurn?.cancel();
      pendingFontRepagination ||= scheduled !== null;
      clearTimeout(scheduled);
      scheduled = null;
      view = 'original';render();
    }
    renderedButton.addEventListener('click',showRendered);
    plainButton.addEventListener('click',showOriginal);
    previous.addEventListener('click',goBack);
    next.addEventListener('click',goForward);
    stage.addEventListener('click',showNote);
    stage.addEventListener('keydown',escapeNote);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => {
      const nextWidth = Math.round(stage.getBoundingClientRect().width);
      if (nextWidth && nextWidth !== width) schedule('resize');
    }) : null;
    observer?.observe(root);
    const onRepaginate = () => schedule('fonts');
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
