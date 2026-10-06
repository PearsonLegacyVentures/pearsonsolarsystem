import {makeSeed} from '../data/seed.js';
import {validateState} from './model.js';
export const KEY='pearson-solar-system.v1';
export function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return {state:makeSeed(),error:''};const s=JSON.parse(raw);if(!validateState(s))throw Error();return {state:s,error:''}}catch{return {state:makeSeed(),error:'Saved data could not be read. Export or inspect the existing browser data before saving new changes.'}}}
export function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));return ''}catch{return 'Changes are not saved in this browser. Export a backup before leaving.'}}
export function download(s){const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='pearson-solar-system-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
