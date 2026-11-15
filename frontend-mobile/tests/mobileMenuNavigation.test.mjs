import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
import { controls } from './helpers/appearanceNativeMock.mjs';
import { history } from './helpers/appearanceRouterMock.mjs';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { MenuActionContext } = await import('../src/contexts/MenuActionContext.tsx');
const { NavigationDataContext } = await import('../src/contexts/NavigationDataContext.tsx');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { menuTabs, drawerItems } = await import('../src/features/navigation/menu.ts');
const { MenuTabBar } = await import('../src/components/navigation/MenuTabBar.tsx');
const { StudyDrawerContent } = await import('../src/components/navigation/StudyDrawerContent.tsx');
const { default: Profile } = await import('../src/app/(app)/profile.tsx');
const h = React.createElement;
const appearance = createAppearanceStore({ read: async () => null, write: async () => {} });
function render(element) {
  controls.clear();
  return renderToStaticMarkup(h(AppearanceContext.Provider, { value: { ...appearance.getSnapshot(),
    setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence } }, element));
}
test('four tabs preserve selection, emit cancellable tab events and invoke only the contextual callback', () => {
  let invoked = 0; let selected; let prevented = false;
  const props = { state: { index: 0, routes: menuTabs.map(item => ({ name: item.name, key: item.name })) }, insets: { bottom: 12 },
    emitter: { emit: () => ({ defaultPrevented: prevented }) }, navigateToTab: key => { selected = key; } };
  const action = { label: menuTabs[0].action, hidden: false, run: () => { invoked++; } };
  let html = render(h(MenuActionContext.Provider, { value: { action } }, h(MenuTabBar, props)));
  assert.equal((html.match(/role="tab"/g) ?? []).length, 4);
  assert.match(html, /aria-selected="true"/);
  assert.match(html, /aria-label="Create a goal"/);
  controls.get('Create a goal').onPress(); assert.equal(invoked, 1);
  controls.get('Tracking').onPress(); assert.equal(selected, 'tracking/index');
  prevented = true; controls.get('Validations').onPress(); assert.equal(selected, 'tracking/index');
  html = render(h(MenuActionContext.Provider, { value: { action: { ...action, hidden: true } } }, h(MenuTabBar, props)));
  assert.equal(html, '');
});
test('drawer order, unread count, profile and Settings access are functional and close before leaving', () => {
  const visited = []; let closed = 0;
  const value = { profile: { id: 1, username: 'student', presentationName: 'A long display name', bio: null },
    avatar: null, unread: 3, loading: false, error: null, retry() {} };
  const html = render(h(NavigationDataContext.Provider, { value }, h(StudyDrawerContent, {
    active: '(menu)', close: () => { closed++; }, navigate: name => visited.push(name),
  })));
  let previous = -1;
  for (const item of drawerItems) { const offset = html.indexOf(`>${item.label}`); assert.ok(offset > previous); previous = offset; }
  assert.match(html, /data-testid="unread-badge"/); assert.doesNotMatch(html, /\(3 unread\)/); assert.match(html, /avatar, initials/);
  controls.get('Menu').onPress(); assert.deepEqual(visited, ['(menu)']); assert.equal(closed, 1);
  controls.get('Open your profile, A long display name').onPress(); assert.equal(history.at(-1), '/(app)/profile');
  controls.get('Settings').onPress(); assert.equal(history.at(-1), '/(app)/settings'); assert.equal(closed, 3);
});
test('own profile uses real identity and offers editing without a duplicate logout', () => {
  const html = render(h(NavigationDataContext.Provider, { value: { profile: { id: 1, username: 'student',
    presentationName: 'Student Name', bio: 'My real biography' }, avatar: null, loading: false, error: null, retry() {} } }, h(Profile)));
  assert.match(html, /Student Name/); assert.match(html, /My real biography/); assert.doesNotMatch(html, /Sign out/);assert.match(html,/Edit Profile/);
  assert.doesNotMatch(html, /Edit profile|Online|Last seen/);
});
