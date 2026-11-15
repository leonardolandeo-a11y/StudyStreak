import './helpers/appearanceTestLoader.mjs';
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readdirSync, readFileSync } from 'node:fs';
import ts from 'typescript';
import { View } from './helpers/appearanceNativeMock.mjs';
const { AppearanceContext } = await import('../src/contexts/AppearanceContext.ts');
const { createAppearanceStore } = await import('../src/features/appearance/appearanceStore.ts');
const { AcademicHeading } = await import('../src/components/academic/Academic.tsx');
const { RecordedSummary } = await import('../src/components/study/RecordedSummary.tsx');
const h=React.createElement,store=createAppearanceStore({read:async()=>null,write:async()=>{}});
const render=child=>renderToStaticMarkup(h(AppearanceContext.Provider,{value:{...store.getSnapshot(),setPreferences:store.setPreferences}},child));
test('native host guard reproduces strings, whitespace, numbers and fragments rejected by Fabric',()=>{
 for(const child of [' ', 'stray',0,h(React.Fragment,null,' ')])assert.throws(()=>render(h(View,null,child)),/Text strings must be rendered within a <Text> component/);
});
test('shared heading renders with and without art, and zero timestamps never escape Text',()=>{
 for(const art of [undefined,h(View,{testID:'art'})])for(const title of ['Profile','Settings','Goals','Resources','Tracking','Validations','Notifications','Focus Studio','Study Rooms','Daily record'])assert.doesNotThrow(()=>render(h(AcademicHeading,{title,eyebrow:'STUDY',art})));
 for(const updatedAt of [undefined,0,1700000000000])assert.doesNotThrow(()=>render(h(RecordedSummary,{minutes:0,sessions:0,pending:0,updatedAt})));
});
test('all TSX routes and shared components have no literal text outside Text/Link',()=>{
 const errors=[];
 function scan(directory){for(const file of readdirSync(directory,{withFileTypes:true})){
  const url=new URL(file.name+(file.isDirectory()?'/':''),directory);
  if(file.isDirectory())scan(url);else if(file.name.endsWith('.tsx')){
   const ast=ts.createSourceFile(url.pathname,readFileSync(url,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
   function visit(node){
    if(ts.isJsxText(node)&&node.text.length&&(!node.text.includes('\n')||node.text.trim())){
     const parent=node.parent,tag=ts.isJsxElement(parent)?parent.openingElement.tagName.getText(ast):'Fragment';
     if(!['Text','Link'].includes(tag))errors.push(`${url.pathname}:${ast.getLineAndCharacterOfPosition(node.pos).line+1} ${JSON.stringify(node.text)}`);
    }
    ts.forEachChild(node,visit);
   }visit(ast);
  }
 }}scan(new URL('../src/',import.meta.url));assert.deepEqual(errors,[]);
});
