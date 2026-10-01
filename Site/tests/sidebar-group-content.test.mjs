import test from 'node:test';
import assert from 'node:assert/strict';
import { sidebarGroupContent } from '../src/lib/sidebar-group-content.mjs';

const overview = {
  type: 'link',
  label: '[Icon:local article] Overview',
  href: '/eras/citadel/professions/',
  isCurrent: true,
};

test('overview-only folders can link directly to their article', () => {
  const state = sidebarGroupContent([overview]);
  assert.deepEqual(state.visibleEntries, []);
  assert.equal(state.overviewOnlyLink, overview);
  assert.equal(state.overviewOnlyLink.href, '/eras/citadel/professions/');
});

test('populated folders keep normal navigation and hide the redundant Overview row', () => {
  const article = { type: 'link', label: 'Blacksmith', href: '/blacksmith/' };
  const state = sidebarGroupContent([overview, article]);
  assert.deepEqual(state.visibleEntries, [article]);
  assert.equal(state.overviewOnlyLink, undefined);
});

test('truly empty folders are not mistaken for overview-only folders', () => {
  assert.deepEqual(sidebarGroupContent([]), {
    visibleEntries: [],
    overviewOnlyLink: undefined,
  });
});

test('nested groups remain visible even when they have no direct article links', () => {
  const group = { type: 'group', label: 'Subcategory', entries: [] };
  const state = sidebarGroupContent([overview, group]);
  assert.deepEqual(state.visibleEntries, [group]);
  assert.equal(state.overviewOnlyLink, undefined);
});
