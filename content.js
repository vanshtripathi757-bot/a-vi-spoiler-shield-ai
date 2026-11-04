(() => {
"use strict";
if (window.__gtaShieldInstalled) return;
window.__gtaShieldInstalled = true;
const CARD = ["ytd-rich-item-renderer","ytd-video-renderer","ytd-compact-video-renderer","ytd-grid-video-renderer","ytd-reel-item-renderer","yt-lockup-view-model","ytm-shorts-lockup-view-model"].join(",");
const GAME = /\b(?:gta\s*(?:6|vi|six)|grand\s*theft\s*auto\s*(?:6|vi|six))\b/i;
const CHAR = /\b(?:lucia|jason)\b/i;
const STRONG = /\b(?:ending\s*(?:leak\w*|explained)|leaked\s*ending|story\s*leak\w*|final\s*mission|secret\s*ending|plot\s*twist\w*|character\s*death\w*|character\s*dies|gets\s*killed|is\s*killed|leaked\s*cutscene\w*|leaked\s*gameplay|gameplay\s*leak\w*|mission\s*details|full\s*story|spoiler\s*alert|spoilers?|leaks?)\b/i;
const AMBIG = /\b(?:ending\w*|finale|mission\w*|cutscene\w*|story\s*revealed|reveal\w*|betrayal|death\w*|dies|killed|plot|walkthrough|playthrough|breakdown|gameplay\s*details)\b/i;
let settings={enabled:true,aiEnabled:true,sensitivity:"balanced",backendUrl:""};
let scanned=0,protectedCount=0,frame=0;
const fingerprints=new WeakMap(),revealed=new WeakMap(),pending=new Set();
function textOf(card){
 const a=[card.innerText,card.getAttribute("aria-label"),card.getAttribute("title")];
 card.querySelectorAll("[title],[aria-label],img[alt],a#video-title").forEach(el=>{
  ["title","aria-label","alt"].forEach(k=>{const v=el.getAttribute(k);if(v)a.push(v);});
 });
 return a.filter(Boolean).join(" ").replace(/\s+/g," ").trim().slice(0,2500);
}
function local(text){
 const context=GAME.test(text)||(CHAR.test(text)&&/\b(?:vice\s*city|leonida|rockstar|gta)\b/i.test(text));
 if(!context)return "SAFE";
 if(STRONG.test(text))return "SPOILER";
 if(settings.sensitivity==="strict")return "UNCERTAIN";
 if(settings.sensitivity==="balanced"&&AMBIG.test(text))return "UNCERTAIN";
 return "SAFE";
}
function transition(oldS,newS){
 const a=oldS==="spoiler"||oldS==="uncertain",b=newS==="spoiler"||newS==="uncertain";
 if(a&&!b)protectedCount=Math.max(0,protectedCount-1);
 if(!a&&b)protectedCount++;
}
function removeOverlay(card){card.querySelector(":scope > .gta-shield-overlay")?.remove();}
function reveal(card,text){
 transition(card.dataset.gtaShieldState,"safe");
 card.dataset.gtaShieldState="safe";revealed.set(card,text);removeOverlay(card);
}
function protect(card,verdict,text){
 const state=verdict.toLowerCase();transition(card.dataset.gtaShieldState,state);
 card.dataset.gtaShieldState=state;removeOverlay(card);
 const overlay=document.createElement("div");overlay.className="gta-shield-overlay";
 const label=document.createElement("span");
 label.textContent=verdict==="SPOILER"?"Potential GTA VI spoiler":"GTA VI content shielded";
 const button=document.createElement("button");button.type="button";button.textContent="Reveal Spoiler";
 button.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();reveal(card,text);});
 overlay.append(label,button);
 if(getComputedStyle(card).position==="static")card.style.position="relative";
 card.appendChild(overlay);
}
async function classifyAI(text){
 if(!settings.aiEnabled||!settings.backendUrl)return "UNCERTAIN";
 try{
  const r=await chrome.runtime.sendMessage({type:"GTA_SHIELD_CLASSIFY",text});
  return ["SAFE","SPOILER","UNCERTAIN"].includes(r?.verdict)?r.verdict:"UNCERTAIN";
 }catch{return "UNCERTAIN";}
}
async function process(card,force=false){
 if(!(card instanceof HTMLElement)||!card.isConnected)return;
 if(!settings.enabled){transition(card.dataset.gtaShieldState,"off");card.dataset.gtaShieldState="off";removeOverlay(card);return;}
 const text=textOf(card);if(!text)return;
 if(!force&&fingerprints.get(card)===text&&card.dataset.gtaShieldState)return;
 if(!force&&revealed.get(card)===text)return;
 fingerprints.set(card,text);
 if(!card.dataset.gtaShieldSeen){card.dataset.gtaShieldSeen="1";scanned++;}
 const verdict=local(text);
 if(verdict==="SAFE"){transition(card.dataset.gtaShieldState,"safe");card.dataset.gtaShieldState="safe";removeOverlay(card);return;}
 protect(card,verdict==="SPOILER"?"SPOILER":"UNCERTAIN",text);
 // Strict mode intentionally protects every GTA VI-related card; AI must not override it.
 if(verdict==="UNCERTAIN" && settings.sensitivity !== "strict"){
  const ai=await classifyAI(text);
  if(!card.isConnected||textOf(card)!==text||revealed.get(card)===text)return;
  if(ai==="SAFE"){transition(card.dataset.gtaShieldState,"safe");card.dataset.gtaShieldState="safe";removeOverlay(card);}
  else protect(card,ai,text);
 }
}
function find(root){
 const out=new Set();
 if(root instanceof Element){const p=root.closest(CARD);if(p)out.add(p);if(root.matches(CARD))out.add(root);}
 root?.querySelectorAll?.(CARD).forEach(x=>out.add(x));return out;
}
function scan(root=document){find(root).forEach(x=>process(x));}
function queue(root){
 if(!(root instanceof Element||root instanceof Document))return;
 pending.add(root);if(frame)return;
 frame=requestAnimationFrame(()=>{frame=0;const batch=[...pending];pending.clear();batch.forEach(scan);});
}
const observer=new MutationObserver(ms=>ms.forEach(m=>{
 if(m.type==="characterData")queue(m.target.parentElement);
 else if(m.type==="attributes")queue(m.target);
 else{
  if(m.target instanceof Element)queue(m.target);
  m.addedNodes.forEach(n=>{if(n instanceof Element)queue(n);else if(n.nodeType===Node.TEXT_NODE)queue(n.parentElement);});
 }
}));
function start(){
 if(!document.documentElement)return;
 observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["title","aria-label","alt"]});
 scan();
}
async function load(){
 const x=await chrome.storage.local.get("settings");settings={...settings,...(x.settings||{})};scan();
}
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area==="local"&&changes.settings){
  settings={...settings,...(changes.settings.newValue||{})};
  document.querySelectorAll(CARD).forEach(x=>process(x,true));
 }
});
chrome.runtime.onMessage.addListener((m,s,send)=>{
 if(m?.type==="GTA_SHIELD_GET_STATS")send({scanned,protectedCount,enabled:settings.enabled,sensitivity:settings.sensitivity});
});
window.addEventListener("yt-navigate-finish",()=>setTimeout(()=>scan(),300));
if(document.documentElement){start();load();}
else{const wait=new MutationObserver(()=>{if(document.documentElement){wait.disconnect();start();load();}});wait.observe(document,{childList:true,subtree:true});}
})();