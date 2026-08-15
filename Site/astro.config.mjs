import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import starlightChangelogs, { makeChangelogsSidebarLinks } from 'starlight-changelogs';
import starlightGiscus from 'starlight-giscus';
import starlightScrollToTop from 'starlight-scroll-to-top';
import siteGraph from 'starlight-site-graph/integration';
import starlightTags from 'starlight-tags';
import starlightTelescope from 'starlight-telescope';
import { buildSitemapLastmodMap, sitemapPathname } from './src/lib/sitemap-lastmod.mjs';
import { buildSidebar } from './sidebar.mjs';
import siteConfig from './site.config.mjs';

const siteDir = path.dirname(fileURLToPath(import.meta.url));
const sitemapLastmodByPathname = await buildSitemapLastmodMap(path.join(siteDir, 'src/content/docs'));

const feedHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'alternate',
      type: 'application/rss+xml',
      title: `${siteConfig.feeds?.title ?? siteConfig.title} RSS`,
      href: '/rss.xml',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'alternate',
      type: 'application/atom+xml',
      title: `${siteConfig.feeds?.title ?? siteConfig.title} Atom`,
      href: '/atom.xml',
    },
  },
];

const fontStylesheetUrl = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400&family=Source+Serif+4:opsz,wght@8..60,400..900&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
const fontHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossorigin: '',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'stylesheet',
      href: fontStylesheetUrl,
      media: 'print',
      onload: "this.onload=null;this.media='all'",
    },
  },
];

const webmentionHead = siteConfig.webmentions?.enabled
  ? [
      siteConfig.webmentions.endpoint
        ? {
            tag: 'link',
            attrs: {
              rel: 'webmention',
              href: siteConfig.webmentions.endpoint,
            },
          }
        : undefined,
      siteConfig.webmentions.pingbackEndpoint
        ? {
            tag: 'link',
            attrs: {
              rel: 'pingback',
              href: siteConfig.webmentions.pingbackEndpoint,
            },
          }
        : undefined,
    ].filter(Boolean)
  : [];

const faviconPath = '/favicons/viscerium-favicon.svg';

const faviconHead = [
  {
    tag: 'link',
    attrs: {
      rel: 'icon',
      type: 'image/svg+xml',
      href: faviconPath,
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'shortcut icon',
      href: faviconPath,
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'mask-icon',
      href: '/favicons/viscerium-mask.svg',
      color: '#000000',
    },
  },
  {
    tag: 'link',
    attrs: {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  },
  {
    tag: 'meta',
    attrs: {
      name: 'theme-color',
      content: '#000000',
    },
  },
];

const ga4MeasurementId = siteConfig.analytics?.ga4?.measurementId ?? '';
const ga4Enabled = siteConfig.analytics?.ga4?.enabled === true;
const ga4Head = ga4Enabled
  ? [
      {
        tag: 'script',
        attrs: {
          type: 'text/partytown',
          async: true,
          src: `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`,
        },
      },
      {
        tag: 'script',
        attrs: {
          type: 'text/partytown',
          id: 'ga4-init',
          'data-ga4-measurement-id': ga4MeasurementId,
        },
        content: `
          const measurementId = document
            .getElementById('ga4-init')
            .getAttribute('data-ga4-measurement-id');

          window.dataLayer = window.dataLayer || [];
          function gtag() {
            dataLayer.push(arguments);
          }

          gtag('js', new Date());
          gtag('config', measurementId);
        `,
      },
    ]
  : [];

const cloudflareAnalyticsToken = siteConfig.analytics?.cloudflare?.token ?? '';
const cloudflareAnalyticsHead = siteConfig.analytics?.cloudflare?.enabled
  ? [
      {
        tag: 'script',
        attrs: {
          type: 'module',
          src: `https://static.cloudflareinsights.com/beacon.min.js?token=${encodeURIComponent(cloudflareAnalyticsToken)}`,
        },
      },
    ]
  : [];

const searchVerificationHead = siteConfig.searchVerification?.google
  ? [
      {
        tag: 'meta',
        attrs: {
          name: 'google-site-verification',
          content: siteConfig.searchVerification.google,
        },
      },
    ]
  : [];

const { enabled: giscusEnabled, ...giscusConfig } = siteConfig.giscus;

const sidebar = [
  ...(await buildSidebar()),
  {
    label: 'Releases',
    collapsed: false,
    items: [
      ...makeChangelogsSidebarLinks([
        {
          type: 'latest',
          base: 'releases',
          label: 'Latest release',
        },
        {
          type: 'all',
          base: 'releases',
          label: 'All releases',
        },
      ]),
    ],
  },
];

export default defineConfig({
  site: siteConfig.site,
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
  },
  integrations: [
    starlight({
      title: siteConfig.title,
      description: siteConfig.description,
      pagefind: false,
      routeMiddleware: './src/route-data.ts',
      customCss: [
        'katex/dist/katex.min.css',
        './src/styles/ion-layers.css',
        './src/styles/color-tokens.css',
        './src/styles/ion-theme.css',
        './src/styles/ion-expressive-code.css',
        './src/styles/typography.css',
        './src/styles/article-pages.css',
        './src/styles/codex-ui.css',
        './src/styles/navigation.css',
        './src/styles/header-controls.css',
        './src/styles/maps.css',
        './src/styles/relationships.css',
        './src/styles/exploration-pages.css',
        './src/styles/calendar.css',
        './src/styles/category-index.css',
        './src/styles/support.css',
        './src/styles/layout.css',
        './src/styles/a11y.css',
        './src/styles/era-styles.css',
        'starlight-site-graph/styles/layers.css',
        'starlight-site-graph/styles/common.css',
        'starlight-site-graph/styles/starlight.css',
        './src/styles/graph.css',
      ],
      components: {
        Header: './src/components/CodexHeader.astro',
        Sidebar: './src/components/IonSidebar.astro',
        Footer: './src/components/StarlightFooter.astro',
        PageFrame: './src/components/CodexPageFrame.astro',
        PageSidebar: './src/components/CodexPageSidebar.astro',
        PageTitle: './src/components/CodexPageTitle.astro',
        TwoColumnContent: './src/components/CodexTwoColumnContent.astro',
      },
      editLink: {
        baseUrl: `${siteConfig.githubRepoUrl}/edit/main/Vault/Lore/`,
      },
      plugins: [
        starlightTags({ onInlineTagsNotFound: 'create' }),
        starlightChangelogs(),
        ...(giscusEnabled ? [starlightGiscus(giscusConfig)] : []),
        starlightScrollToTop(),
        starlightTelescope({
          shortcut: {
            key: 'k',
            ctrl: true,
            meta: true,
            shift: false,
            alt: false,
          },
        }),
      ],
      sidebar,
      head: [...feedHead, ...fontHead, ...webmentionHead, ...faviconHead, ...ga4Head, ...cloudflareAnalyticsHead, ...searchVerificationHead],
      social: [{ icon: 'github', label: 'GitHub', href: siteConfig.githubRepoUrl }],
    }),
    siteGraph({
      starlight: true,
      overridePageSidebar: false,
      graphConfig: {
        tagRenderMode: 'node',
        renderArrows: false,
        enableDrag: true,
        enableZoom: true,
        enablePan: true,
        labelMutedOpacity: 0.18,
        labelAdjacentOpacity: 0.9,
        nodeDefaultStyle: {
          shape: 'circle',
          shapeSize: 7,
          shapeColor: 'nodeColor',
          strokeWidth: 0,
          colliderScale: 1,
          nodeScale: 1,
          neighborScale: 1,
        },
        nodeCurrentStyle: {
          shapeColor: 'nodeColorCurrent',
          nodeScale: 1.3,
        },
        tagDefaultStyle: {
          shape: 'circle',
          shapeSize: 5,
          shapeColor: 'nodeColorTag',
          strokeWidth: 0,
          colliderScale: 1,
          nodeScale: 0.85,
          neighborScale: 0.75,
        },
      },
    }),
    sitemap({
      serialize(item) {
        const lastmod = sitemapLastmodByPathname.get(sitemapPathname(item.url));
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
    mdx(),
    ...(ga4Enabled
      ? [
          partytown({
            config: {
              forward: ['dataLayer.push'],
            },
          }),
        ]
      : []),
  ],
});
