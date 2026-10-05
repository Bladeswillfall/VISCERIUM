export const HOME_LANGUAGES = [
  { locale: 'en-GB', route: '', nativeLabel: 'English', englishLabel: 'English', flag: 'gb' },
  { locale: 'fr-FR', route: 'fr', nativeLabel: 'Français', englishLabel: 'French', flag: 'fr' },
  { locale: 'de-DE', route: 'de', nativeLabel: 'Deutsch', englishLabel: 'German', flag: 'de' },
  { locale: 'es', route: 'es', nativeLabel: 'Español', englishLabel: 'Spanish' },
  { locale: 'zh', route: 'zh', nativeLabel: '中文', englishLabel: 'Chinese' },
  { locale: 'ru', route: 'ru', nativeLabel: 'Русский', englishLabel: 'Russian' },
  { locale: 'ja', route: 'ja', nativeLabel: '日本語', englishLabel: 'Japanese' },
];

export const HOME_TRANSLATIONS = {
  'en-GB': {
    meta: {
      title: 'VISCERIUM Codex',
      description: 'One timeline, four eras, infinite stories. Enter the public worldbuilding codex for VISCERIUM.',
    },
    languageMenu: { trigger: 'Choose language', panel: 'Homepage language' },
    hero: {
      eyebrow: 'Choose an age. Enter the same world.',
      deck: 'One timeline. Four eras. Infinite stories.',
      start: 'Start here',
      explore: 'Explore the four eras',
      scrollHint: 'Swipe or scroll through the ages',
      erasLabel: 'The four eras of VISCERIUM. On medium screens, scroll horizontally to explore them.',
    },
    eras: [
      {
        number: 'Era I',
        name: 'CITADEL',
        tags: 'Steel · Bone · Early gunpowder',
        description: 'A medieval age of walled realms, ritualised Resonance and horrors still mistaken for folklore.',
        action: 'Explore CITADEL',
      },
      {
        number: 'Era II',
        name: 'SMOG',
        tags: 'Industry · Trenches · Occult machinery',
        description: 'Civilisation industrialises its wars faster than it learns from them, filling the old world with soot, engines and inherited grief.',
        action: 'Explore SMOG',
      },
      {
        number: 'Era III',
        name: 'NEARSIGHT',
        tags: 'Satellites · Exoskeletons · Cassette futurism',
        description: 'Humanity believes the world is finally observable while the real enemy remains beyond its field of view.',
        action: 'Explore NEARSIGHT',
      },
      {
        number: 'Era IV',
        name: 'ENTROPY',
        tags: 'Orbital war · Altered flesh · Extinction',
        description: 'The old struggle escapes Errack and reveals the scale of what has always surrounded the Degel System.',
        action: 'Explore ENTROPY',
      },
    ],
    routes: {
      eyebrow: 'Choose your route',
      heading: 'Enter with the context you want.',
      lead: 'Start with the guided primer, the wider system, or the history that connects every era.',
      cards: [
        { title: 'Start Here', description: 'The essential primer to VISCERIUM, the Degel System and its four eras.', action: 'Recommended first' },
        { title: 'The Degel System', description: 'Begin with the star system whose worlds, wounds and hidden structures contain the greater struggle.', action: 'Enter the setting' },
        { title: 'The Timeline', description: 'Follow the inherited events that connect CITADEL, SMOG, NEARSIGHT and ENTROPY.', action: 'Trace the history' },
      ],
    },
    continuum: {
      eyebrow: 'One wounded history',
      heading: 'The world advances. The struggle does not.',
      lead: 'VISCERIUM follows one secondary world across millennia rather than resetting the setting whenever its technology changes.',
      body: [
        'Kingdoms become republics. Rituals become sciences. Old superstitions survive inside military doctrine, industry and orbital infrastructure. Resonance, incursion and mortal ambition remain the connective tissue.',
        'The four gateways are not separate universes. They are four moments in the same history, each carrying the damage, discoveries and lies of the age before it.',
      ],
    },
    recent: {
      title: 'Recent articles',
      intro: 'New entries and revised records from across the VISCERIUM Codex.',
      expand: 'Expand to grid',
      collapse: 'Return to carousel',
      navigation: 'Article carousel navigation',
      previous: 'Scroll to previous article',
      next: 'Scroll to next article',
      latest: 'Latest Codex articles',
      read: 'Read article',
      railHint: 'Drag cards, swipe, scroll or use the arrows to browse.',
      gridHint: 'All recent cards are visible.',
      mobileHint: 'Era treatments in the compact article list.',
      universal: 'UNIVERSAL',
      era: 'ERA',
    },
  },
  'fr-FR': {
    meta: {
      title: 'Codex VISCERIUM',
      description: 'Une chronologie, quatre ères, une infinité d’histoires. Entrez dans le codex public de l’univers de VISCERIUM.',
    },
    languageMenu: { trigger: 'Choisir la langue', panel: 'Langue de la page d’accueil' },
    hero: {
      eyebrow: 'Choisissez une époque. Entrez dans le même monde.',
      deck: 'Une chronologie. Quatre ères. Une infinité d’histoires.',
      start: 'Commencer ici',
      explore: 'Explorer les quatre ères',
      scrollHint: 'Balayez ou faites défiler les époques',
      erasLabel: 'Les quatre ères de VISCERIUM. Sur les écrans moyens, faites défiler horizontalement pour les explorer.',
    },
    eras: [
      {
        number: 'Ère I', name: 'CITADEL', tags: 'Acier · Os · Premières armes à poudre',
        description: 'Une époque médiévale de royaumes fortifiés, de Resonance ritualisée et d’horreurs encore prises pour du folklore.',
        action: 'Explorer CITADEL',
      },
      {
        number: 'Ère II', name: 'SMOG', tags: 'Industrie · Tranchées · Machines occultes',
        description: 'La civilisation industrialise ses guerres plus vite qu’elle n’en tire les leçons, couvrant l’ancien monde de suie, de moteurs et d’un deuil hérité.',
        action: 'Explorer SMOG',
      },
      {
        number: 'Ère III', name: 'NEARSIGHT', tags: 'Satellites · Exosquelettes · Rétrofuturisme à cassette',
        description: 'L’humanité croit enfin pouvoir observer le monde, tandis que le véritable ennemi reste hors de son champ de vision.',
        action: 'Explorer NEARSIGHT',
      },
      {
        number: 'Ère IV', name: 'ENTROPY', tags: 'Guerre orbitale · Chair altérée · Extinction',
        description: 'L’ancien conflit s’échappe d’Errack et révèle l’ampleur de ce qui a toujours entouré le système Degel.',
        action: 'Explorer ENTROPY',
      },
    ],
    routes: {
      eyebrow: 'Choisissez votre voie',
      heading: 'Entrez avec le contexte qui vous convient.',
      lead: 'Commencez par l’introduction guidée, le système dans son ensemble ou l’histoire qui relie chaque ère.',
      cards: [
        { title: 'Commencer ici', description: 'L’introduction essentielle à VISCERIUM, au système Degel et à ses quatre ères.', action: 'Recommandé en premier' },
        { title: 'Le système Degel', description: 'Commencez par le système stellaire dont les mondes, les blessures et les structures cachées abritent le conflit plus vaste.', action: 'Entrer dans l’univers' },
        { title: 'La chronologie', description: 'Suivez les événements hérités qui relient CITADEL, SMOG, NEARSIGHT et ENTROPY.', action: 'Suivre l’histoire' },
      ],
    },
    continuum: {
      eyebrow: 'Une seule histoire meurtrie',
      heading: 'Le monde avance. Le conflit demeure.',
      lead: 'VISCERIUM suit un même monde secondaire pendant des millénaires au lieu de réinitialiser l’univers chaque fois que sa technologie change.',
      body: [
        'Les royaumes deviennent des républiques. Les rituels deviennent des sciences. Les anciennes superstitions survivent dans la doctrine militaire, l’industrie et les infrastructures orbitales. La Resonance, l’incursion et l’ambition mortelle restent le fil conducteur.',
        'Les quatre portes ne sont pas des univers séparés. Ce sont quatre moments d’une même histoire, chacun portant les dégâts, les découvertes et les mensonges de l’époque précédente.',
      ],
    },
    recent: {
      title: 'Articles récents', intro: 'Nouvelles entrées et dossiers révisés dans le Codex VISCERIUM.',
      expand: 'Afficher en grille', collapse: 'Revenir au carrousel', navigation: 'Navigation du carrousel d’articles',
      previous: 'Faire défiler vers l’article précédent', next: 'Faire défiler vers l’article suivant', latest: 'Derniers articles du Codex',
      read: 'Lire l’article', railHint: 'Faites glisser les cartes, balayez, faites défiler ou utilisez les flèches.',
      gridHint: 'Toutes les cartes récentes sont visibles.', mobileHint: 'Traitement des ères dans la liste compacte des articles.', universal: 'UNIVERSEL', era: 'ÈRE',
    },
  },
  'de-DE': {
    meta: {
      title: 'VISCERIUM-Kodex',
      description: 'Eine Zeitlinie, vier Epochen, unendlich viele Geschichten. Betritt den öffentlichen Worldbuilding-Kodex von VISCERIUM.',
    },
    languageMenu: { trigger: 'Sprache wählen', panel: 'Sprache der Startseite' },
    hero: {
      eyebrow: 'Wähle ein Zeitalter. Betritt dieselbe Welt.',
      deck: 'Eine Zeitlinie. Vier Epochen. Unendlich viele Geschichten.',
      start: 'Hier beginnen', explore: 'Die vier Epochen erkunden', scrollHint: 'Wische oder scrolle durch die Zeitalter',
      erasLabel: 'Die vier Epochen von VISCERIUM. Auf mittelgroßen Bildschirmen horizontal scrollen, um sie zu erkunden.',
    },
    eras: [
      { number: 'Epoche I', name: 'CITADEL', tags: 'Stahl · Knochen · Frühe Feuerwaffen', description: 'Ein mittelalterliches Zeitalter ummauerter Reiche, ritualisierter Resonance und Schrecken, die noch immer für Folklore gehalten werden.', action: 'CITADEL erkunden' },
      { number: 'Epoche II', name: 'SMOG', tags: 'Industrie · Schützengräben · Okkulte Maschinen', description: 'Die Zivilisation industrialisiert ihre Kriege schneller, als sie aus ihnen lernt, und füllt die alte Welt mit Ruß, Maschinen und vererbter Trauer.', action: 'SMOG erkunden' },
      { number: 'Epoche III', name: 'NEARSIGHT', tags: 'Satelliten · Exoskelette · Kassettenfuturismus', description: 'Die Menschheit glaubt, die Welt sei endlich vollständig beobachtbar, während der wahre Feind außerhalb ihres Sichtfelds bleibt.', action: 'NEARSIGHT erkunden' },
      { number: 'Epoche IV', name: 'ENTROPY', tags: 'Orbitalkrieg · Verändertes Fleisch · Aussterben', description: 'Der alte Konflikt verlässt Errack und offenbart das Ausmaß dessen, was das Degel-System schon immer umgeben hat.', action: 'ENTROPY erkunden' },
    ],
    routes: {
      eyebrow: 'Wähle deinen Einstieg', heading: 'Steige mit dem Kontext ein, den du möchtest.',
      lead: 'Beginne mit der geführten Einführung, dem größeren System oder der Geschichte, die alle Epochen verbindet.',
      cards: [
        { title: 'Hier beginnen', description: 'Die grundlegende Einführung in VISCERIUM, das Degel-System und seine vier Epochen.', action: 'Als Erstes empfohlen' },
        { title: 'Das Degel-System', description: 'Beginne mit dem Sternensystem, dessen Welten, Wunden und verborgene Strukturen den größeren Konflikt enthalten.', action: 'Die Welt betreten' },
        { title: 'Die Zeitlinie', description: 'Verfolge die überlieferten Ereignisse, die CITADEL, SMOG, NEARSIGHT und ENTROPY verbinden.', action: 'Die Geschichte verfolgen' },
      ],
    },
    continuum: {
      eyebrow: 'Eine verwundete Geschichte', heading: 'Die Welt schreitet voran. Der Konflikt bleibt.',
      lead: 'VISCERIUM begleitet eine einzige Sekundärwelt über Jahrtausende, statt das Setting bei jedem technologischen Wandel zurückzusetzen.',
      body: [
        'Königreiche werden zu Republiken. Rituale werden zu Wissenschaften. Alte Aberglauben überleben in Militärdoktrin, Industrie und orbitaler Infrastruktur. Resonance, Invasion und sterbliche Ambition bleiben die verbindenden Kräfte.',
        'Die vier Tore sind keine getrennten Universen. Sie sind vier Momente derselben Geschichte, und jeder trägt die Schäden, Entdeckungen und Lügen des vorherigen Zeitalters weiter.',
      ],
    },
    recent: {
      title: 'Neueste Artikel', intro: 'Neue Einträge und überarbeitete Aufzeichnungen aus dem VISCERIUM-Kodex.',
      expand: 'Als Raster anzeigen', collapse: 'Zum Karussell zurückkehren', navigation: 'Navigation im Artikelkarussell',
      previous: 'Zum vorherigen Artikel scrollen', next: 'Zum nächsten Artikel scrollen', latest: 'Neueste Kodex-Artikel',
      read: 'Artikel lesen', railHint: 'Ziehe die Karten, wische, scrolle oder nutze die Pfeile.', gridHint: 'Alle aktuellen Karten sind sichtbar.',
      mobileHint: 'Epochen-Darstellung in der kompakten Artikelliste.', universal: 'UNIVERSELL', era: 'EPOCHE',
    },
  },
  es: {
    meta: { title: 'Códice VISCERIUM', description: 'Una línea temporal, cuatro eras, historias infinitas. Entra en el códice público de creación de mundo de VISCERIUM.' },
    languageMenu: { trigger: 'Elegir idioma', panel: 'Idioma de la página de inicio' },
    hero: {
      eyebrow: 'Elige una era. Entra en el mismo mundo.', deck: 'Una línea temporal. Cuatro eras. Historias infinitas.',
      start: 'Empieza aquí', explore: 'Explora las cuatro eras', scrollHint: 'Desliza o desplázate por las eras',
      erasLabel: 'Las cuatro eras de VISCERIUM. En pantallas medianas, desplázate horizontalmente para explorarlas.',
    },
    eras: [
      { number: 'Era I', name: 'CITADEL', tags: 'Acero · Hueso · Pólvora temprana', description: 'Una era medieval de reinos amurallados, Resonance ritualizada y horrores que todavía se confunden con el folclore.', action: 'Explorar CITADEL' },
      { number: 'Era II', name: 'SMOG', tags: 'Industria · Trincheras · Maquinaria oculta', description: 'La civilización industrializa sus guerras más rápido de lo que aprende de ellas, llenando el viejo mundo de hollín, motores y duelo heredado.', action: 'Explorar SMOG' },
      { number: 'Era III', name: 'NEARSIGHT', tags: 'Satélites · Exoesqueletos · Futurismo de casete', description: 'La humanidad cree que por fin puede observar el mundo por completo, mientras el verdadero enemigo permanece fuera de su campo de visión.', action: 'Explorar NEARSIGHT' },
      { number: 'Era IV', name: 'ENTROPY', tags: 'Guerra orbital · Carne alterada · Extinción', description: 'El antiguo conflicto escapa de Errack y revela la escala de lo que siempre ha rodeado al sistema Degel.', action: 'Explorar ENTROPY' },
    ],
    routes: {
      eyebrow: 'Elige tu ruta', heading: 'Entra con el contexto que quieras.', lead: 'Empieza con la guía inicial, el sistema más amplio o la historia que conecta cada era.',
      cards: [
        { title: 'Empieza aquí', description: 'La guía esencial de VISCERIUM, el sistema Degel y sus cuatro eras.', action: 'Recomendado primero' },
        { title: 'El sistema Degel', description: 'Empieza por el sistema estelar cuyos mundos, heridas y estructuras ocultas contienen el conflicto mayor.', action: 'Entrar en el mundo' },
        { title: 'La línea temporal', description: 'Sigue los acontecimientos heredados que conectan CITADEL, SMOG, NEARSIGHT y ENTROPY.', action: 'Seguir la historia' },
      ],
    },
    continuum: {
      eyebrow: 'Una historia herida', heading: 'El mundo avanza. El conflicto no.',
      lead: 'VISCERIUM sigue un solo mundo secundario durante milenios, en vez de reiniciar el escenario cada vez que cambia su tecnología.',
      body: [
        'Los reinos se convierten en repúblicas. Los rituales se convierten en ciencias. Las antiguas supersticiones sobreviven dentro de la doctrina militar, la industria y la infraestructura orbital. Resonance, la incursión y la ambición mortal siguen siendo el tejido que lo conecta todo.',
        'Las cuatro puertas no son universos separados. Son cuatro momentos de la misma historia, y cada uno arrastra el daño, los descubrimientos y las mentiras de la era anterior.',
      ],
    },
    recent: {
      title: 'Artículos recientes', intro: 'Nuevas entradas y registros revisados de todo el Códice VISCERIUM.',
      expand: 'Expandir a cuadrícula', collapse: 'Volver al carrusel', navigation: 'Navegación del carrusel de artículos', previous: 'Ir al artículo anterior', next: 'Ir al artículo siguiente', latest: 'Últimos artículos del Códice',
      read: 'Leer artículo', railHint: 'Arrastra las tarjetas, desliza, desplázate o usa las flechas.', gridHint: 'Todas las tarjetas recientes están visibles.', mobileHint: 'Tratamiento de eras en la lista compacta de artículos.', universal: 'UNIVERSAL', era: 'ERA',
    },
  },
  zh: {
    meta: { title: 'VISCERIUM 世界设定典籍', description: '一条时间线，四个时代，无数故事。进入 VISCERIUM 的公开世界设定典籍。' },
    languageMenu: { trigger: '选择语言', panel: '首页语言' },
    hero: {
      eyebrow: '选择一个时代。进入同一个世界。', deck: '一条时间线。四个时代。无数故事。', start: '从这里开始', explore: '探索四个时代', scrollHint: '滑动或滚动浏览各个时代',
      erasLabel: 'VISCERIUM 的四个时代。在中等尺寸屏幕上，可横向滚动进行探索。',
    },
    eras: [
      { number: '时代 I', name: 'CITADEL', tags: '钢铁 · 白骨 · 早期火药', description: '一个由城墙王国、仪式化 Resonance 与仍被误认为民间传说的恐怖共同构成的中世纪时代。', action: '探索 CITADEL' },
      { number: '时代 II', name: 'SMOG', tags: '工业 · 战壕 · 神秘机械', description: '文明将战争工业化的速度超过了从战争中吸取教训的速度，让旧世界充满煤烟、引擎与代代相传的悲痛。', action: '探索 SMOG' },
      { number: '时代 III', name: 'NEARSIGHT', tags: '卫星 · 外骨骼 · 磁带未来主义', description: '人类相信世界终于可以被完整观测，而真正的敌人仍停留在视野之外。', action: '探索 NEARSIGHT' },
      { number: '时代 IV', name: 'ENTROPY', tags: '轨道战争 · 异变血肉 · 灭绝', description: '古老的斗争离开 Errack，并揭示一直包围着 Degel 星系之物的真正规模。', action: '探索 ENTROPY' },
    ],
    routes: {
      eyebrow: '选择你的入口', heading: '带着你想要的背景进入。', lead: '你可以从引导式入门、整个星系，或连接四个时代的历史开始。',
      cards: [
        { title: '从这里开始', description: 'VISCERIUM、Degel 星系及其四个时代的核心入门。', action: '建议首先阅读' },
        { title: 'Degel 星系', description: '从这个恒星系统开始。它的世界、创伤与隐藏结构承载着更大的斗争。', action: '进入世界设定' },
        { title: '时间线', description: '追踪连接 CITADEL、SMOG、NEARSIGHT 与 ENTROPY 的历史事件。', action: '追溯历史' },
      ],
    },
    continuum: {
      eyebrow: '一段受创的历史', heading: '世界不断前进。斗争从未停止。',
      lead: 'VISCERIUM 讲述同一个架空世界跨越数千年的变化，而不是每当技术改变时就重新设定世界。',
      body: [
        '王国变成共和国。仪式变成科学。古老迷信继续存在于军事理论、工业与轨道基础设施中。Resonance、入侵与凡人的野心始终贯穿其中。',
        '四个入口并不是彼此分离的宇宙。它们是同一段历史中的四个时刻，每个时代都继承了前一个时代留下的创伤、发现与谎言。',
      ],
    },
    recent: {
      title: '最新文章', intro: 'VISCERIUM 典籍中的新条目与修订记录。', expand: '展开为网格', collapse: '返回轮播', navigation: '文章轮播导航', previous: '滚动到上一篇文章', next: '滚动到下一篇文章', latest: '最新典籍文章',
      read: '阅读文章', railHint: '拖动卡片、滑动、滚动或使用箭头浏览。', gridHint: '所有最新卡片均已显示。', mobileHint: '紧凑文章列表中的时代样式。', universal: '通用', era: '时代',
    },
  },
  ru: {
    meta: { title: 'Кодекс VISCERIUM', description: 'Одна временная линия, четыре эпохи, бесконечное множество историй. Войдите в открытый кодекс мира VISCERIUM.' },
    languageMenu: { trigger: 'Выбрать язык', panel: 'Язык главной страницы' },
    hero: {
      eyebrow: 'Выберите эпоху. Войдите в тот же мир.', deck: 'Одна временная линия. Четыре эпохи. Бесконечное множество историй.', start: 'Начать здесь', explore: 'Исследовать четыре эпохи', scrollHint: 'Листайте или прокручивайте эпохи',
      erasLabel: 'Четыре эпохи VISCERIUM. На экранах среднего размера прокручивайте по горизонтали, чтобы исследовать их.',
    },
    eras: [
      { number: 'Эпоха I', name: 'CITADEL', tags: 'Сталь · Кость · Ранний порох', description: 'Средневековая эпоха окружённых стенами государств, ритуальной Resonance и ужасов, которые всё ещё принимают за фольклор.', action: 'Исследовать CITADEL' },
      { number: 'Эпоха II', name: 'SMOG', tags: 'Промышленность · Окопы · Оккультные машины', description: 'Цивилизация ставит войны на промышленную основу быстрее, чем учится на них, заполняя старый мир сажей, машинами и унаследованным горем.', action: 'Исследовать SMOG' },
      { number: 'Эпоха III', name: 'NEARSIGHT', tags: 'Спутники · Экзоскелеты · Кассетный футуризм', description: 'Человечество верит, что мир наконец полностью наблюдаем, пока настоящий враг остаётся за пределами поля зрения.', action: 'Исследовать NEARSIGHT' },
      { number: 'Эпоха IV', name: 'ENTROPY', tags: 'Орбитальная война · Изменённая плоть · Вымирание', description: 'Старый конфликт покидает Errack и показывает масштаб того, что всегда окружало систему Degel.', action: 'Исследовать ENTROPY' },
    ],
    routes: {
      eyebrow: 'Выберите путь', heading: 'Войдите с тем объёмом контекста, который вам нужен.', lead: 'Начните с вводного материала, всей системы или истории, связывающей каждую эпоху.',
      cards: [
        { title: 'Начать здесь', description: 'Основное введение в VISCERIUM, систему Degel и её четыре эпохи.', action: 'Рекомендуется сначала' },
        { title: 'Система Degel', description: 'Начните со звёздной системы, чьи миры, раны и скрытые структуры заключают в себе более масштабный конфликт.', action: 'Войти в сеттинг' },
        { title: 'Временная линия', description: 'Проследите события прошлого, которые связывают CITADEL, SMOG, NEARSIGHT и ENTROPY.', action: 'Проследить историю' },
      ],
    },
    continuum: {
      eyebrow: 'Одна израненная история', heading: 'Мир движется вперёд. Борьба остаётся.', lead: 'VISCERIUM показывает один вторичный мир на протяжении тысячелетий, а не сбрасывает сеттинг каждый раз, когда меняется технология.',
      body: [
        'Королевства становятся республиками. Ритуалы становятся науками. Старые суеверия сохраняются в военной доктрине, промышленности и орбитальной инфраструктуре. Resonance, вторжения и смертные амбиции по-прежнему связывают всё воедино.',
        'Четыре входа не ведут в разные вселенные. Это четыре момента одной истории, каждый из которых несёт ущерб, открытия и ложь предыдущей эпохи.',
      ],
    },
    recent: {
      title: 'Недавние статьи', intro: 'Новые материалы и обновлённые записи из Кодекса VISCERIUM.', expand: 'Развернуть в сетку', collapse: 'Вернуться к карусели', navigation: 'Навигация по карусели статей', previous: 'Перейти к предыдущей статье', next: 'Перейти к следующей статье', latest: 'Последние статьи Кодекса',
      read: 'Читать статью', railHint: 'Перетаскивайте карточки, листайте, прокручивайте или используйте стрелки.', gridHint: 'Все недавние карточки видны.', mobileHint: 'Оформление эпох в компактном списке статей.', universal: 'УНИВЕРСАЛЬНОЕ', era: 'ЭПОХА',
    },
  },
  ja: {
    meta: { title: 'VISCERIUM コーデックス', description: 'ひとつの時間軸、四つの時代、無数の物語。VISCERIUM の公開世界設定コーデックスへ。' },
    languageMenu: { trigger: '言語を選択', panel: 'ホームページの言語' },
    hero: {
      eyebrow: '時代を選ぶ。同じ世界へ入る。', deck: 'ひとつの時間軸。四つの時代。無数の物語。', start: 'ここから始める', explore: '四つの時代を探索する', scrollHint: 'スワイプまたはスクロールして時代をたどる',
      erasLabel: 'VISCERIUM の四つの時代。中サイズの画面では横にスクロールして探索できます。',
    },
    eras: [
      { number: '時代 I', name: 'CITADEL', tags: '鋼 · 骨 · 初期の火薬', description: '城壁に囲まれた国家、儀式化された Resonance、そして今なお民間伝承と誤解される恐怖が存在する中世の時代。', action: 'CITADEL を探索する' },
      { number: '時代 II', name: 'SMOG', tags: '工業 · 塹壕 · オカルト機械', description: '文明は戦争から学ぶより速く戦争を工業化し、旧世界を煤、機械、受け継がれた悲嘆で満たしていく。', action: 'SMOG を探索する' },
      { number: '時代 III', name: 'NEARSIGHT', tags: '衛星 · 外骨格 · カセット・フューチャリズム', description: '人類は世界をついに観測できるようになったと信じるが、本当の敵は視野の外に残っている。', action: 'NEARSIGHT を探索する' },
      { number: '時代 IV', name: 'ENTROPY', tags: '軌道戦争 · 変質した肉体 · 絶滅', description: '古い闘争は Errack を離れ、Degel System を常に取り囲んでいたものの規模を明らかにする。', action: 'ENTROPY を探索する' },
    ],
    routes: {
      eyebrow: '入口を選ぶ', heading: '必要な背景知識から入る。', lead: '案内付きの入門、より広い星系、または全時代をつなぐ歴史から始められます。',
      cards: [
        { title: 'ここから始める', description: 'VISCERIUM、Degel System、そして四つの時代を知るための基本入門。', action: '最初におすすめ' },
        { title: 'Degel System', description: 'より大きな闘争を抱える世界、傷跡、隠された構造を持つ恒星系から始めます。', action: '世界設定へ入る' },
        { title: '時間軸', description: 'CITADEL、SMOG、NEARSIGHT、ENTROPY を結ぶ継承された出来事をたどります。', action: '歴史をたどる' },
      ],
    },
    continuum: {
      eyebrow: '傷を負ったひとつの歴史', heading: '世界は進む。闘争は終わらない。', lead: 'VISCERIUM は、技術が変わるたびに設定をリセットするのではなく、ひとつの架空世界を数千年にわたって追います。',
      body: [
        '王国は共和国になる。儀式は科学になる。古い迷信は軍事教義、産業、軌道インフラの中に残り続ける。Resonance、侵入、そして人間の野心が歴史をつなぎ続ける。',
        '四つの入口は別々の宇宙ではありません。同じ歴史の四つの瞬間であり、それぞれが前の時代の損傷、発見、嘘を引き継いでいます。',
      ],
    },
    recent: {
      title: '最近の記事', intro: 'VISCERIUM コーデックスの新規項目と改訂された記録。', expand: 'グリッド表示にする', collapse: 'カルーセルに戻る', navigation: '記事カルーセルのナビゲーション', previous: '前の記事へスクロール', next: '次の記事へスクロール', latest: '最新のコーデックス記事',
      read: '記事を読む', railHint: 'カードをドラッグ、スワイプ、スクロールするか、矢印を使って閲覧できます。', gridHint: '最近のカードをすべて表示しています。', mobileHint: 'コンパクトな記事一覧での時代別表示。', universal: 'ユニバーサル', era: '時代',
    },
  },
};

export function getHomeTranslation(locale = 'en-GB') {
  return HOME_TRANSLATIONS[locale] ?? HOME_TRANSLATIONS['en-GB'];
}

export function homepageHref(route) {
  return route ? `/${route}/` : '/';
}
