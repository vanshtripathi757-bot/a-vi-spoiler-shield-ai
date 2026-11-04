const DEFAULTS={enabled:true,aiEnabled:true,sensitivity:"balanced",backendUrl:""};
chrome.runtime.onInstalled.addListener(async()=>{
 const v=await chrome.storage.local.get("settings");
 if(!v.settings)await chrome.storage.local.set({settings:DEFAULTS});
});
chrome.runtime.onMessage.addListener((m,s,send)=>{
 if(m?.type!=="GTA_SHIELD_CLASSIFY")return;
 (async()=>{
  const v=await chrome.storage.local.get("settings");
  const settings={...DEFAULTS,...(v.settings||{})};
  const base=String(settings.backendUrl||"").trim().replace(/\/$/,"");
  if(!base)return {verdict:"UNCERTAIN"};
  try{
   const r=await fetch(base+"/api/classify",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({text:String(m.text||"").slice(0,2500)}),signal:AbortSignal.timeout(12000)});
   if(!r.ok)throw new Error("HTTP "+r.status);
   const data=await r.json();
   if(!["SAFE","SPOILER","UNCERTAIN"].includes(data.verdict))throw new Error("Invalid verdict");
   return data;
  }catch(e){console.warn("GTA Shield backend unavailable",e);return {verdict:"UNCERTAIN"};}
 })().then(send).catch(()=>send({verdict:"UNCERTAIN"}));
 return true;
});