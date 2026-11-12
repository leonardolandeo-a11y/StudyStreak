import './helpers/appearanceTestLoader.mjs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const {AppearanceContext}=await import('../src/contexts/AppearanceContext.ts');
const {createAppearanceStore}=await import('../src/features/appearance/appearanceStore.ts');
const {BarChart}=await import('../src/components/study/BarChart.tsx');
const h=React.createElement;
test('zero, sparse and dense charts retain exact values without tall empty tracks',()=>{
 const store=createAppearanceStore({read:async()=>null,write:async()=>{}});
 const render=items=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences,retryPersistence:store.retryPersistence}},h(BarChart,{items,label:'Recorded'})));
 assert.match(render([]),/No recorded time/);
 const zero=render([{label:'Day',value:0}]);assert.match(zero,/Day: 0.0 min/);assert.match(zero,/width:0%/);assert.doesNotMatch(zero,/recorded-chart-column/);
 const sparse=render(Array.from({length:24},(_,i)=>({label:String(i),value:i===12?25:0})));assert.match(sparse,/All 24 recorded values/);assert.match(sparse,/12: 25.0 min/);assert.doesNotMatch(sparse,/recorded-chart-column/);
 const dense=render(Array.from({length:24},(_,i)=>({label:String(i),value:i+1})));assert.equal((dense.match(/data-testid="recorded-chart-column"/g)||[]).length,24);assert.match(dense,/height:112px/);assert.doesNotMatch(dense,/NaN|Infinity/);
});
