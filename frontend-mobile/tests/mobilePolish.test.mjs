import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { NavigationDataContext } = await import('../src/contexts/NavigationDataContext.tsx');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { StudyDrawerContent } = await import('../src/components/navigation/StudyDrawerContent.tsx');
const { GoalForm } = await import('../src/components/goals/GoalForm.tsx');
const { CreationModal } = await import('../src/components/ui/CreationModal.tsx');
const { DashboardActivity } = await import('../src/components/dashboard/DashboardActivity.tsx');
const { primaryBackTarget } = await import('../src/features/navigation/menu.ts');
const h = React.createElement;
const appearance = createAppearanceStore({ read: async () => null, write: async () => {} });
const render = element => renderToStaticMarkup(h(AppearanceContext.Provider, { value: {
  ...appearance.getSnapshot(), setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence,
} }, element));
test('compact drawer badges appear only for positive counts and leave the Notifications label unchanged', () => {
  for (const unread of [null, 0, 4, 122]) {
    const html = render(h(NavigationDataContext.Provider, { value: { profile: null, avatar: null, unread } },
      h(StudyDrawerContent, { active: 'dashboard', close() {}, navigate() {} })));
    assert.match(html, /aria-label="Notifications"/);
    assert.equal(html.includes('data-testid="unread-badge"'), unread !== null && unread > 0);
    assert.doesNotMatch(html, /\(0 unread\)|\(4 unread\)/);
    assert.match(html, /icon-resources-motion/);
  }
});
test('New Goal omits Completed; edit mode retains the existing state control', () => {
  const props = { busy: false, onSubmit: async () => true, onCancel() {} };
  assert.doesNotMatch(render(h(GoalForm, props)), /Completed|role="checkbox"/);
  assert.match(render(h(GoalForm, { ...props, initialValues: { topic: 'Math', duration: 25, frequency: 3, completed: true } })), /Completed/);
});
test('creation modal contains only supplied flow content, supports busy and unmounts when closed', () => {
  const props = { visible: true, title: 'New Goal', busy: true, onClose() {} };
  const html = render(h(CreationModal, props, h('span', null, 'Dedicated form')));
  assert.match(html, /Dedicated form/); assert.match(html, /aria-label="Back"/); assert.match(html, /disabled/);
  assert.equal(render(h(CreationModal, { ...props, visible: false }, 'Old flow')), '');
});
test('Dashboard uses a horizontal segmented period and icon-only chart controls without a refresh button', () => {
  const html = render(h(DashboardActivity, { days: 7, onDaysChange() {}, retry() {}, state: { status: 'loading' } }));
  assert.match(html, /aria-label="7 days"/); assert.match(html, /aria-label="30 days"/);
  assert.match(html, /aria-label="Bars"/); assert.match(html, /aria-label="Lines"/);
  assert.doesNotMatch(html, /Refresh activity|>Bars<|>Lines</);
});
test('primary Back recovery never overrides native history or secondary navigation', () => {
  assert.equal(primaryBackTarget(true, 'dashboard'), null);
  assert.equal(primaryBackTarget(false, 'focus-studio'), 'menu');
  assert.equal(primaryBackTarget(false, '(menu)', 'tracking/index'), 'goals');
  assert.equal(primaryBackTarget(false, '(menu)', 'goals/index'), null);
});
