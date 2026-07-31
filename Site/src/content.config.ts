import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { changelogsLoader } from 'starlight-changelogs/loader';
import { pageSiteGraphSchema } from 'starlight-site-graph/schema';
import { starlightTagsExtension } from 'starlight-tags/schema';

const stringOrStrings = z.union([z.string(), z.array(z.string())]);
const eraValue = z.enum(['CITADEL', 'SMOG', 'NEARSIGHT', 'ENTROPY', 'Universal']);
const eraOrEras = z.union([eraValue, z.array(eraValue)]);
const looseRecord = z.record(z.unknown());
const frontmatterDate = z.coerce.date();
const optionalString = z.string().nullable().optional();
const optionalNumber = z.number().nullable().optional();
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
const storytellerValueSchema = z.union([z.string(), z.array(z.string())]);
const storytellerSchema = z.object({
  version: z.literal(1),
  type: z.string(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    items: z.array(z.object({
      key: z.string(),
      label: z.string(),
      value: storytellerValueSchema,
    })),
  })),
});
const referencedInSchema = z.object({
  title: z.string(),
  href: z.string(),
  type: z.string(),
  era: eraValue.optional(),
});

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    schema: docsSchema({
      extend: pageSiteGraphSchema.merge(starlightTagsExtension).extend({
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
        entity_id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
        continuity: looseRecord.optional(),
        calendarDate: calendarDateSchema.optional(),
        calendarEndDate: calendarDateSchema.nullable().optional(),
        calendarShowcase: calendarShowcaseSchema.optional(),
        calendarBlocks: z.record(calendarShowcaseSchema).optional(),
        timeline: timelineSchema.optional(),
        timelineBlocks: z.record(timelineBlockSchema).optional(),
        timelinePage: z.boolean().optional(),
        explorationPage: z.boolean().optional(),
        searchable: z.boolean().optional(),
        date: frontmatterDate.optional(),
        published: frontmatterDate.optional(),
        updated: frontmatterDate.optional(),
        contributors: z.array(contributorReferenceSchema).optional(),
        defaultContributors: z.boolean().optional(),
        giscus: z.boolean().optional().default(true),
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
        relationships: looseRecord.optional(),
        sidebar: looseRecord.optional(),
        related: z.array(z.string()).optional(),
        referencedIn: z.array(referencedInSchema).optional(),
        storyteller: storytellerSchema.optional(),
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
};
