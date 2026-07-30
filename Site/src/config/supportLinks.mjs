import siteConfig from '../../site.config.mjs';

const repoUrl = siteConfig.githubRepoUrl;
const newIssueUrl = `${repoUrl}/issues/new`;

export const githubSupportLinks = [
  {
    title: 'Report a site bug',
    text: 'Use this for rendering problems, broken widgets, layout regressions, build oddities, or technical faults.',
    href: `${newIssueUrl}?template=bug_report.yml`,
  },
  {
    title: 'Report a typo or broken link',
    text: 'Flag spelling errors, dead links, missing redirects, or small copy fixes.',
    href: `${newIssueUrl}?template=typo_or_broken_link.yml`,
  },
  {
    title: 'Suggest a content correction',
    text: 'Use this for lore consistency issues, unclear wording, missing context, or article-level corrections.',
    href: `${newIssueUrl}?template=content_correction.yml`,
  },
  {
    title: 'Request a feature',
    text: 'Suggest new page features, navigation improvements, reference tools, or quality-of-life changes.',
    href: `${newIssueUrl}?template=feature_request.yml`,
  },
  {
    title: 'View the GitHub repository',
    text: 'Browse the source, open issues, changelog work, and public development history.',
    href: repoUrl,
  },
];

export const monetarySupportLinks = [
  {
    icon: 'kofi',
    title: 'Ko-fi',
    text: 'One-off support for hosting, tooling, references, artwork, and continued Codex development.',
  },
  {
    icon: 'patreon',
    title: 'Patreon',
    text: 'Recurring support once VISCERIUM has a proper public supporter structure.',
  },
];

export const socialLinks = [
  { label: 'Bluesky', icon: 'bluesky' },
  { label: 'Mastodon', icon: 'mastodon' },
  { label: 'Twitter / X', icon: 'twitter-x' },
  { label: 'Instagram', icon: 'instagram' },
  { label: 'Discord', icon: 'discord' },
];
