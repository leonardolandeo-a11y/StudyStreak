import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import test from 'node:test';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { DifficultyBadge, DifficultySelector } = await import('../src/components/goals/GoalDifficulty.tsx');
const { GoalForm } = await import('../src/components/goals/GoalForm.tsx');
const { RecordedCalendar } = await import('../src/components/dashboard/RecordedCalendar.tsx');
const h = React.createElement;
test('difficulty uses four named original faces and explicit neutral historical state in every appearance', async()=>{
 const store=createAppearanceStore({read:async()=>null,write:async()=>{}});
 for(const mode of ['dark','light','system'])for(const accent of ['mint','blue','purple','orange']){
  store.setPreferences({mode,accent});
  const render=element=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},element));
  for(const [value,label,face] of [['TRIVIAL','Intrascendente','difficultyTrivial'],['EASY','Fácil','difficultyEasy'],['INTERMEDIATE','Intermedio','difficultyIntermediate'],['HARD','Difícil','difficultyHard']]){
   const badge=render(h(DifficultyBadge,{value}));assert.match(badge,new RegExp(label));assert.match(badge,new RegExp(face));
   const selector=render(h(DifficultySelector,{value,disabled:false,onChange(){}}));assert.equal((selector.match(/role="radio"/g)||[]).length,4);assert.equal((selector.match(/aria-checked="true"/g)||[]).length,1);
  }
  assert.match(render(h(DifficultyBadge,{})),/Sin dificultad/);
  const form=render(h(GoalForm,{busy:false,onSubmit:async()=>true,onCancel(){},initialValues:{topic:'Legacy',frequency:3,duration:25,completed:false}}));assert.equal((form.match(/aria-checked="true"/g)||[]).length,0);
  const calendar=render(h(RecordedCalendar,{activity:[{date:'2026-11-12',minutes:0,sessions:0}]}));assert.match(calendar,/2026-11-12: 0 minutes/);assert.match(calendar,/Previous activity month/);
 }
});
