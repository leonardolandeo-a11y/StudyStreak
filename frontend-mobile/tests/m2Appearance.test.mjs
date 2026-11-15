import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { files } from './helpers/appearanceFileSystemMock.mjs';
import { controls, Platform, AppState } from './helpers/appearanceNativeMock.mjs';
const { createAccountAppearanceStorage } = await import('../src/services/appearanceStorage.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { backgroundNames, createTheme, defaultAppearance } = await import('../src/features/appearance/theme.ts');
const { workspacePalette, dashboardPalette } = await import('../src/components/academic/workspacePalette.ts');
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { default: Settings } = await import('../src/app/(app)/settings.tsx');
const { StudyScene } = await import('../src/components/auth/StudyScene.tsx');
const { AppLoadingScreen } = await import('../src/components/ui/AppLoadingScreen.tsx');
const { StudyBrand } = await import('../src/components/branding/StudyBrand.tsx');
const h = React.createElement;
const root = new URL('../src/', import.meta.url);
const appearance = createAppearanceStore({ read: async () => null, write: async () => {} });
const render = component => renderToStaticMarkup(h(AppearanceContext.Provider, { value: {
  ...appearance.getSnapshot(), ready: true, setPreferences: appearance.setPreferences, retryPersistence: appearance.retryPersistence,
} }, component));
const luminance = hex => hex.slice(1).match(/../g).map(value => parseInt(value,16)/255)
  .map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4).reduce((sum,value,i) => sum+value*[.2126,.7152,.0722][i],0);
const contrast = (a,b) => (Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);

test('80 effective family/mode/system/accent combinations match Web surfaces and retain contrast', () => {
  const web = readFileSync(new URL('../../frontend-web/src/styles/tokens.css', import.meta.url),'utf8');
  let combinations = 0;
  for (const background of backgroundNames) for (const [mode,scheme] of [['light','dark'],['dark','light'],['system','light'],['system','dark']]) for (const accent of ['mint','blue','purple','orange']) {
    combinations++;
    const preferences = { ...defaultAppearance, background, mode, accent };
    const theme = createTheme(preferences, scheme), colors = theme.colors;
    const family = web.match(new RegExp(':root\\[data-background="'+background+'"\\][^{]+\\{([^}]+)'))[1];
    for (const [token,native] of [['background','background'],['surface','surface'],['surface-raised','surfaceRaised'],['surface-hover','surfaceHover'],['border','border'],['text','text'],['text-muted','muted']]) {
      const pair = family.match(new RegExp('--ss-'+token+': light-dark\\((#[a-f0-9]+), (#[a-f0-9]+)\\)'));
      assert.equal(colors[native], pair[theme.mode === 'light' ? 1 : 2]);
    }
    for (const surface of [colors.background,colors.surface,colors.surfaceRaised,colors.surfaceHover]) for (const ink of [colors.text,colors.textSecondary,colors.muted]) assert.ok(contrast(ink,surface)>=4.5, `${background}/${theme.mode} ${ink}/${surface}`);
    assert.ok(contrast(colors.primary,colors.surface)>=4.5);
    assert.ok(contrast(colors.primaryText,colors.primary)>=4.5);
    assert.deepEqual(workspacePalette(theme),colors); assert.deepEqual(dashboardPalette(theme),colors);
    assert.equal(colors.primary,createTheme({...preferences,background:'neutral'},scheme).colors.primary);
  }
  assert.equal(combinations,80);
});

test('legacy preferences migrate once without losing choices or leaking to guest/another account', async () => {
  files.clear();
  const original = JSON.stringify({ mode:'light',accent:'orange',reduceMotion:true,token:'discard' });
  files.set('test://documents/appearance/preferences-v1.json',original);
  const guest = createAccountAppearanceStorage(null), a = createAccountAppearanceStorage(101), b = createAccountAppearanceStorage(202);
  assert.equal(await guest.read(),null);
  const [first,other] = await Promise.all([a.read(),b.read()]);
  assert.deepEqual(JSON.parse(first),{mode:'light',background:'lavender',accent:'orange',reduceMotion:true});
  assert.equal(other,null); assert.equal(files.get('test://documents/appearance/preferences-v1.json'),original);
  await b.write(JSON.stringify({...defaultAppearance,background:'sky'}));
  await a.write(JSON.stringify({...defaultAppearance,background:'sage',accent:'blue'}));
  assert.equal(JSON.parse(await createAccountAppearanceStorage(101).read()).background,'sage');
  assert.equal(JSON.parse(await createAccountAppearanceStorage(202).read()).background,'sky');
  assert.equal(await guest.read(),null);
  assert.throws(()=>createAccountAppearanceStorage(0));
});

test('web storage uses separate account keys and reserves legacy ownership across reloads', async () => {
  const disk = new Map([['studystreak:appearance:v1',JSON.stringify({mode:'system',accent:'purple',reduceMotion:false})]]);
  const priorStorage = globalThis.localStorage;
  Platform.OS = 'web'; globalThis.localStorage = {getItem:key=>disk.get(key)??null,setItem:(key,value)=>disk.set(key,value)};
  try {
    const a = createAccountAppearanceStorage(11), b = createAccountAppearanceStorage(22);
    assert.equal(JSON.parse(await a.read()).accent,'purple');
    await a.write(JSON.stringify({...defaultAppearance,background:'amber'}));
    assert.equal(await b.read(),null);
    assert.equal(JSON.parse(await createAccountAppearanceStorage(11).read()).background,'amber');
    assert.equal(disk.get('studystreak:appearance:v2:legacy-owner'),'11');
  } finally { Platform.OS = 'ios'; globalThis.localStorage = priorStorage; }
});

test('native Settings previews, brand, loader and static landscape render for every family', async () => {
  for (const background of backgroundNames) {
    await appearance.setPreferences({background,mode:'dark',reduceMotion:true});
    const settings = render(h(Settings));
    for (const name of backgroundNames) for (const mode of ['light','dark']) assert.ok(settings.includes(`background-preview-${name}-${mode}`));
    assert.equal(controls.get(background[0].toUpperCase()+background.slice(1)+' background').accessibilityState.checked,true);
    const loader = render(h(AppLoadingScreen));
    assert.match(loader,/loading-steam-paused/); assert.ok(loader.includes(appearance.getSnapshot().theme.colors.background));
    assert.match(render(h(StudyBrand)),/Small sessions\. Lasting progress\./);
    for (const period of ['morning','afternoon','night']) {
      const scene = render(h(StudyScene,{period,width:390,height:844}));
      assert.match(scene,/ambient-paused/);
      if (period === 'night') { assert.match(scene,/scene-stars/); assert.doesNotMatch(scene,/scene-cloud-track/); }
      else assert.equal((scene.match(/data-testid="scene-cloud-track-/g)??[]).length,3);
      assert.doesNotMatch(scene.match(/data-testid="scene-landscape"[^>]*/)[0],/transform/);
    }
  }
});

test('account activation does not key the router and wizard removes only the textual profile shortcut', () => {
  const provider = readFileSync(new URL('contexts/AppearanceProvider.tsx',root),'utf8');
  assert.match(provider,/createAccountAppearanceStorage\(userId\)/); assert.doesNotMatch(provider,/key=/);
  const layout = readFileSync(new URL('app/_layout.tsx',root),'utf8');
  assert.ok(layout.indexOf('<AuthProvider>')<layout.indexOf('<AppearanceProvider>'));
  const wizard = readFileSync(new URL('app/(app)/(main)/(menu)/validations/index.tsx',root),'utf8');
  assert.doesNotMatch(wizard,/MemberProfileLink/);
  assert.match(wizard,/setPartner\(member\);setGoal\(null\);setRecord\(null\)/);
  assert.match(wizard,/ValidationPartnerRow/);
});


test('loading motion is enabled only in foreground with motion permitted', async () => {
  await appearance.setPreferences({reduceMotion:false});
  AppState.currentState = 'active';
  assert.match(render(h(AppLoadingScreen)), /loading-steam-running/);
  AppState.currentState = 'background';
  assert.match(render(h(AppLoadingScreen)), /loading-steam-paused/);
  AppState.currentState = 'active';
  await appearance.setPreferences({reduceMotion:true});
  assert.match(render(h(AppLoadingScreen)), /loading-steam-paused/);
});
