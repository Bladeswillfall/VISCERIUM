const FIELD_CONFIG = {
  fauna: [
    { id: 'encounter', title: 'Encounter', fields: [
      ['signs_of_presence', 'Signs of presence'],
      ['encounter_behaviour', 'Encounter behaviour'],
      ['threat_level', 'Threat'],
    ] },
    { id: 'ecology', title: 'Ecology', fields: [
      ['ecology_summary', 'Ecological relationships'],
    ] },
    { id: 'people', title: 'People and culture', fields: [
      ['human_relevance', 'Why people care'],
      ['cultural_significance', 'Cultural significance'],
    ] },
    { id: 'story', title: 'Story pressure', fields: [
      ['story_complication', 'Complication'],
    ] },
  ],
  flora: [
    { id: 'identification', title: 'Identification', fields: [
      ['identification', 'Identification'],
      ['signs_of_presence', 'Signs of presence'],
    ] },
    { id: 'ecology', title: 'Growth and ecology', fields: [
      ['growth_conditions', 'Growth conditions'],
      ['ecological_relationships', 'Ecological relationships'],
    ] },
    { id: 'people', title: 'Use and meaning', fields: [
      ['human_relevance', 'Practical value'],
      ['hazards', 'Hazards'],
      ['cultural_significance', 'Cultural significance'],
    ] },
    { id: 'story', title: 'Story pressure', fields: [
      ['story_complication', 'Complication'],
    ] },
  ],
  fungi: [
    { id: 'identification', title: 'Identification', fields: [
      ['identification', 'Identification'],
      ['signs_of_presence', 'Signs of presence'],
    ] },
    { id: 'ecology', title: 'Fruiting and spread', fields: [
      ['fruiting_conditions', 'Fruiting conditions'],
      ['spread', 'Spread'],
    ] },
    { id: 'people', title: 'Use and exposure', fields: [
      ['human_relevance', 'Practical value'],
      ['hazards', 'Exposure risks'],
      ['cultural_significance', 'Cultural significance'],
    ] },
    { id: 'story', title: 'Story pressure', fields: [
      ['story_complication', 'Complication'],
    ] },
  ],
  item: [
    { id: 'use', title: 'Use', fields: [
      ['primary_use', 'Primary use'],
      ['limitations', 'Limitations'],
    ] },
    { id: 'construction', title: 'Construction and access', fields: [
      ['materials', 'Materials'],
      ['construction', 'Construction'],
      ['availability', 'Availability'],
      ['common_users', 'Common users'],
    ] },
    { id: 'culture', title: 'Meaning', fields: [
      ['cultural_significance', 'Cultural significance'],
    ] },
    { id: 'story', title: 'Story pressure', fields: [
      ['story_complication', 'Complication'],
    ] },
  ],
  'myrkild-unit': [
    { id: 'presence', title: 'Presence', fields: [
      ['signs_of_presence', 'Signs'],
      ['encounter_context', 'Encounter context'],
    ] },
    { id: 'behaviour', title: 'Behaviour and counterplay', fields: [
      ['tactics', 'Tactics'],
      ['weaknesses', 'Counterplay'],
      ['human_relevance', 'What informed people know'],
    ] },
    { id: 'story', title: 'Consequences', fields: [
      ['story_complication', 'Beyond combat'],
    ] },
  ],
  location: [
    { id: 'experience', title: 'Experience', fields: [
      ['approach_signs', 'Approach signs'],
      ['first_impression', 'First impression'],
      ['sensory_signature', 'Sensory signature'],
    ] },
    { id: 'use', title: 'Use', fields: [
      ['why_people_come', 'Why people come'],
      ['ordinary_activity', 'Ordinary activity'],
    ] },
    { id: 'knowledge', title: 'Knowledge', fields: [
      ['outsider_knowledge', 'What outsiders know'],
      ['local_knowledge', 'What locals know'],
    ] },
    { id: 'story', title: 'Local pressure', fields: [
      ['local_tension', 'Current tension'],
      ['story_complication', 'Complication'],
    ] },
  ],
  faction: [
    { id: 'presence', title: 'Presence', fields: [
      ['recognisable_presence', 'Recognisable presence'],
      ['encounter_context', 'How people encounter them'],
      ['public_reputation', 'Public reputation'],
    ] },
    { id: 'agenda', title: 'Agenda', fields: [
      ['current_wants', 'Current wants'],
      ['current_pressures', 'Current pressures'],
      ['preferred_methods', 'Preferred methods'],
    ] },
    { id: 'reach', title: 'Reach', fields: [
      ['resources_and_reach', 'Resources and reach'],
      ['operational_limits', 'Operational limits'],
    ] },
    { id: 'friction', title: 'Internal friction', fields: [
      ['internal_tensions', 'Internal tensions'],
    ] },
    { id: 'story', title: 'Consequences of involvement', fields: [
      ['story_complication', 'Complication'],
    ] },
  ],
};

function normaliseValue(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (Array.isArray(value)) {
    const values = value
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return values.length ? values : undefined;
  }
  return undefined;
}

export function buildStorytellerProjection(data = {}) {
  const type = typeof data.type === 'string' ? data.type.trim().toLowerCase() : '';
  const config = FIELD_CONFIG[type];
  if (!config) return undefined;

  const sections = config.flatMap((section) => {
    const items = section.fields.flatMap(([key, label]) => {
      const value = normaliseValue(data[key]);
      return value === undefined ? [] : [{ key, label, value }];
    });
    return items.length ? [{ id: section.id, title: section.title, items }] : [];
  });

  if (!sections.length) return undefined;
  return { version: 1, type, sections };
}

export const STORYTELLER_TYPES = Object.freeze(Object.keys(FIELD_CONFIG));
