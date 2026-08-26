import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader, i18nLoader } from '@astrojs/starlight/loaders';
import { docsSchema, i18nSchema } from '@astrojs/starlight/schema';
import { changelogsLoader } from 'starlight-changelogs/loader';
import { starlightTagsExtension } from 'starlight-tags/schema';
import { ENTITY_ID_PATTERN } from './lib/era-context.mjs';
import { frontmatterDate } from './lib/frontmatter-date.mjs';
import defaultTranslations from './content/i18n/en-GB.json';

const stringOrStrings = z.union([z.string(), z.array(z.string())]);
const eraValue = z.enum(['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY', 'Universal']);
const eraOrEras = z.union([eraValue, z.array(eraValue)]);
const entityIdSchema = z.string().regex(ENTITY_ID_PATTERN);
const contentWarningValue = z.enum([
  'strong-language',
  'partial-nudity',
  'nudity',
  'sexual-themes',
  'sexual-content',
  'sexualised-violence',
  'sexual-violence',
  'graphic-violence',
  'blood',
  'gore',
  'body-horror',
  'disturbing-imagery',
  'torture',
  'abuse',
  'self-harm',
  'suicide',
  'substance-use',
  'discrimination',
]);
const contentWarningsSchema = z.array(contentWarningValue);
const looseRecord = z.record(z.unknown());
const optionalString = z.string().nullable().optional();
const optionalNumber = z.number().nullable().optional();
const continuitySchema = z.object({
  entityId: entityIdSchema,
  hub: z.string(),
  editions: z.object({
    CITADEL: z.string().optional(),
    SMOG: z.string().optional(),
    NEARSIGHT: z.string().optional(),
    ENTROPY: z.string().optional(),
    Universal: z.string().optional(),
  }),
});
const relationshipObjectSchema = z.object({
  target: z.string().optional(),
  to: z.string().optional(),
  ref: z.string().optional(),
  article: z.string().optional(),
  title: z.string().optional(),
  label: z.string().optional(),
  since: z.string().optional(),
  until: z.string().optional(),
  era: eraValue.optional(),
  description: z.string().optional(),
  note: z.string().optional(),
  directed: z.boolean().optional(),
}).passthrough().refine(
  (entry) => [entry.target, entry.to, entry.ref, entry.article, entry.title]
    .some((value) => typeof value === 'string' && value.trim().length > 0),
  { message: 'Relationship metadata must include target, to, ref, article, or title.' },
);
const relationshipEntrySchema = z.union([z.string(), relationshipObjectSchema]);
const relationshipValueSchema = z.union([relationshipEntrySchema, z.array(relationshipEntrySchema)]);
const relationshipsSchema = z.record(relationshipValueSchema);
const navigationSchema = z.object({
  section: z.enum([
    'relationships',
    'events',
    'nations',
    'international-groups',
    'professions',
    'bestiary',
    'flora-fungi',
    'weapons-armour',
    'transportation',
  ]).optional(),
  order: z.number().int().optional(),
  parent: z.string().optional(),
  hidden: z.boolean().optional(),
});
const calendarDateSchema = z.object({
  calendar: z.string(),
  year: z.number().int(),
  month: z.string().optional(),
  day: z.number().int().optional(),
  intercalaryDay: z.string().optional(),
  precision: z.enum(['day', 'month', 'year']).optional(),
  certainty: z.enum(['exact', 'approximate', 'disputed', 'legendary']).optional(),
  displayCalendars: z.array(z.string()).optional(),
});
const timelineSchema = z.object({
  kind: z.enum(['milestone', 'event', 'period', 'era']).optional(),
  importance: z.enum(['landmark', 'major', 'standard', 'minor', 'incidental']).optional(),
  categories: z.array(z.string()).optional(),
  lanes: z.array(z.string()).optional(),
  global: z.enum(['auto', 'include', 'exclude']).optional(),
  era: z.literal('auto').optional(),
  order: z.number().int().optional(),
  visualToken: z.string().optional(),
  allowGapAfter: z.boolean().optional(),
  defaultViewport: z.object({
    startDay: z.number().int().optional(),
    endDay: z.number().int().optional(),
    paddingDays: z.number().int().nonnegative().optional(),
  }).optional(),
});
const timelineBlockSchema = z.object({
  timeline: z.enum(['super', 'citadel', 'smog', 'nearsight', 'entropy']),
  defaultCalendar: z.string().optional(),
  laneMode: z.enum(['unified', 'lane', 'category']).optional(),
  showFilters: z.boolean().optional(),
  showMinimap: z.boolean().optional(),
  showLegend: z.boolean().optional(),
  compact: z.boolean().optional(),
});
const calendarEventLinkSchema = z.union([
  z.string(),
  z.object({
    href: z.string().optional(),
    article: z.string().optional(),
    label: z.string().optional(),
  }),
]);
const calendarEventLinksSchema = z.record(calendarEventLinkSchema);
const calendarShowcaseSchema = z.object({
  calendar: z.string(),
  year: z.number().int().optional(),
  eventLinks: calendarEventLinksSchema.optional(),
  observanceLinks: calendarEventLinksSchema.optional(),
  links: calendarEventLinksSchema.optional(),
});
const contributorReferenceSchema = z.union([
  z.string(),
  z.object({
    id: z.string(),
    role: z.string().optional(),
    roles: z.array(z.string()).optional(),
  }),
]);
const referencedInSchema = z.object({
  title: z.string(),
  href: z.string(),
  type: z.string(),
  era: eraValue.optional(),
});
const visceriumI18nSchema = z.object(Object.fromEntries(
  Object.keys(defaultTranslations)
    .filter((key) => key.startsWith('viscerium.'))
    .map((key) => [key, z.string()]),
)).partial();

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: starlightTagsExtension.extend({
        status: optionalString,
        slug: optionalString,
        sourcePath: optionalString,
        type: optionalString,
        pronunciation: optionalString,
        icon: optionalString,
        sidebarIcon: optionalString,
        titleIcon: optionalString,
        eraStyle: optionalString,
        eraId: optionalString,
        entity_id: entityIdSchema.optional(),
        continuity: continuitySchema.optional(),
        navigation: navigationSchema.optional(),
        calendarDate: calendarDateSchema.optional(),
        calendarEndDate: calendarDateSchema.nullable().optional(),
        calendarShowcase: calendarShowcaseSchema.optional(),
        calendarBlocks: z.record(calendarShowcaseSchema).optional(),
        timeline: timelineSchema.optional(),
        timelineBlocks: z.record(timelineBlockSchema).optional(),
        timelinePage: z.boolean().optional(),
        explorationPage: z.boolean().optional(),
        searchable: z.boolean().optional(),
        created: frontmatterDate.optional(),
        date: frontmatterDate.optional(),
        published: frontmatterDate.optional(),
        updated: frontmatterDate.optional(),
        contributors: z.array(contributorReferenceSchema).optional(),
        defaultContributors: z.boolean().optional(),
        giscus: z.boolean().optional(),
        era: eraOrEras.optional(),
        eras: z.array(eraValue).optional(),
        faction: stringOrStrings.optional(),
        character: stringOrStrings.optional(),
        participants: stringOrStrings.optional(),
        location: stringOrStrings.optional(),
        species: stringOrStrings.optional(),
        occupation: stringOrStrings.optional(),
        alignment: stringOrStrings.optional(),
        capital: stringOrStrings.optional(),
        territory: stringOrStrings.optional(),
        tags: z.array(z.string()).optional(),
        aliases: z.array(z.string()).optional(),
        contentWarnings: contentWarningsSchema.optional(),
        sensitiveMedia: z.boolean().optional(),
        image: optionalString,
        headerImage: optionalString,
        imagePage: optionalString,
        imageTitle: optionalString,
        imageDescription: optionalString,
        imageText: optionalString,
        decorativeImage: z.boolean().optional(),
        asset: optionalString,
        alt: optionalString,
        credit: optionalString,
        artist: optionalString,
        editor: optionalString,
        source: optionalString,
        sourceUrl: optionalString,
        license: optionalString,
        rights: optionalString,
        usage: optionalString,
        mapId: optionalString,
        width: optionalNumber,
        height: optionalNumber,
        map: looseRecord.optional(),
        relationships: relationshipsSchema.optional(),
        sidebar: looseRecord.optional(),
        related: z.array(z.string()).optional(),
        links: z.array(z.string()).optional(),
        referencedIn: z.array(referencedInSchema).optional(),
        references: z.array(referencedInSchema).optional(),
      }),
    }),
  }),
  changelogs: defineCollection({
    loader: changelogsLoader([
      {
        provider: 'keep-a-changelog',
        base: 'releases',
        title: 'VISCERIUM Codex',
        changelog: './CHANGELOG.md',
        pageSize: 10,
      },
    ]),
  }),
  i18n: defineCollection({
    loader: i18nLoader(),
    schema: i18nSchema({ extend: visceriumI18nSchema }),
  }),
};