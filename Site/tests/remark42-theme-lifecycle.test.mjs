import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const commentsUrl = new URL('../src/components/Comments.astro', import.meta.url);
const comments = readFileSync(commentsUrl, 'utf8');

test('Remark42 snapshots the site theme at mount and does not switch theme at runtime', () => {
  assert.match(comments, /theme:\s*this\.currentTheme\(\)/);
  assert.doesNotMatch(comments, /changeTheme/);
  assert.doesNotMatch(comments, /themeObserver/);
  assert.doesNotMatch(comments, /attributeFilter:\s*\['data-theme'\]/);
});

test('lazy mounting still reads the latest site theme before Remark42 is created', () => {
  assert.match(comments, /private currentTheme\(\): 'light' \| 'dark'/);
  assert.match(comments, /void this\.mount\(generation\)/);
  assert.match(comments, /this\.instance = api\.createInstance\(config\)/);
});
