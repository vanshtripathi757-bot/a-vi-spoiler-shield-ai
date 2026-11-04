const $=id=>document.getElementById(id);
async function load(){
 const {settings={}}=await chrome.storage.local.get("settings");
 $("enabled").checked=settings.enabled!==false;$("ai").checked=settings.aiEnabled!==false;
 $("sensitivity").value=settings.sensitivity||"balanced";$("backend").value=settings.backendUrl||"";
 $("status").textContent=$("enabled").checked?"Protection enabled":"Protection disabled";
 $("dot").style.background=$("enabled").checked?"#43d18a":"#d45b67";
 const tabs=await chrome.tabs.query({active:true,currentWindow:true});
 if(tabs[0]?.id)try{const x=await chrome.tabs.sendMessage(tabs[0].id,{type:"GTA_SHIELD_GET_STATS"});$("scanned").textContent=x.scanned;$("protected").textContent=x.protectedCount;}catch{}
}
$("enabled").addEventListener("change",()=>{$("status").textContent=$("enabled").checked?"Protection enabled":"Protection disabled";$("dot").style.background=$("enabled").checked?"#43d18a":"#d45b67";});
$("save").addEventListener("click",async()=>{
 const backend=$("backend").value.trim().replace(/\/$/,"");
 if(backend&&!/^https:\/\//i.test(backend)){$("message").textContent="Use an https:// backend URL.";return;}
 await chrome.storage.local.set({settings:{enabled:$("enabled").checked,aiEnabled:$("ai").checked,sensitivity:$("sensitivity").value,backendUrl:backend}});
 $("message").textContent="Saved. Refresh YouTube to apply.";
});
load();