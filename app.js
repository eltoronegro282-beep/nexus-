const $ = (id) => document.getElementById(id);
const STORAGE = {tasks:"nexus_tasks_v1", reminders:"nexus_reminders_v1"};
let tasks = JSON.parse(localStorage.getItem(STORAGE.tasks) || "[]");
let reminders = JSON.parse(localStorage.getItem(STORAGE.reminders) || "[]");
let history = [];
let recognition = null;
let toastTimer;

function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2800)}
function updateClock(){const now=new Date();$("clock").textContent=now.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});$("date").textContent=now.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
updateClock();setInterval(updateClock,1000);

document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  $(btn.dataset.view+"View").classList.add("active");
  $("pageTitle").textContent={assistant:"Asistente personal",tasks:"Mis tareas",reminders:"Recordatorios"}[btn.dataset.view];
}));

function addMessage(role,text){
  const wrap=document.createElement("div");wrap.className=`message ${role}`;
  const avatar=document.createElement("div");avatar.className="message-avatar";avatar.textContent=role==="assistant"?"N":"T";
  const bubble=document.createElement("div");bubble.className="bubble";
  if(role==="assistant"){const b=document.createElement("b");b.textContent="NEXUS";bubble.appendChild(b)}
  const p=document.createElement("p");p.textContent=text;bubble.appendChild(p);
  wrap.append(avatar,bubble);$("chatMessages").appendChild(wrap);$("chatMessages").scrollTop=$("chatMessages").scrollHeight;return wrap;
}
function speak(text){
  if(!("speechSynthesis" in window)){toast("Tu navegador no admite voz sintetizada.");return}
  speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text.slice(0,1800));utterance.lang="es-AR";utterance.rate=0.96;utterance.pitch=0.82;
  const voices=speechSynthesis.getVoices();const spanish=voices.find(v=>v.lang.toLowerCase().startsWith("es") && /male|masculino|jorge|diego|pablo/i.test(v.name))||voices.find(v=>v.lang.toLowerCase().startsWith("es"));if(spanish)utterance.voice=spanish;speechSynthesis.speak(utterance);
}
async function sendMessage(){
  const input=$("messageInput"),text=input.value.trim();if(!text)return;
  addMessage("user",text);input.value="";$("sendButton").disabled=true;$("sendButton").textContent="Pensando…";
  const loading=addMessage("assistant","Estoy pensando…");
  const controller=new AbortController();
  const timeoutId=setTimeout(()=>controller.abort(),30000);
  try{
    const response=await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:text,history:history.slice(-8)}),
      signal:controller.signal
    });
    let data;
    try{data=await response.json()}catch{throw new Error(`El servidor respondió con un formato inesperado (HTTP ${response.status}). Revisá que la función chat esté desplegada.`)}
    if(!response.ok)throw new Error(data.error||`Error del servidor (HTTP ${response.status}).`);
    if(loading?.isConnected)loading.remove();
    const answer=data.reply||"No recibí una respuesta.";
    addMessage("assistant",answer);
    history.push({role:"user",content:text},{role:"assistant",content:answer});history=history.slice(-12);
    speak(answer);
  }catch(err){
    if(loading?.isConnected)loading.remove();
    let message;
    if(err.name==="AbortError")message="La solicitud tardó más de 30 segundos. Revisá que la función chat esté publicada y que el servicio de IA esté configurado.";
    else if(err instanceof TypeError)message="No pude conectar con Netlify. Comprobá tu conexión y que la función chat esté desplegada.";
    else message=err.message||"Ocurrió un error inesperado.";
    addMessage("assistant",`No pude responder: ${message}`);
  }finally{
    clearTimeout(timeoutId);
    $("sendButton").disabled=false;
    $("sendButton").innerHTML='Enviar <span>➤</span>';
  }
}
$("sendButton").addEventListener("click",sendMessage);
$("messageInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage()}});
$("clearChat").addEventListener("click",()=>{$("chatMessages").innerHTML="";history=[];addMessage("assistant","Conversación limpia. ¿En qué puedo ayudarte?")});

const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SpeechRecognition){
  recognition=new SpeechRecognition();recognition.lang="es-AR";recognition.interimResults=true;recognition.continuous=false;
  recognition.onstart=()=>{$("micButton").classList.add("listening");$("voiceStatus").textContent="Escuchando… hablá ahora"};
  recognition.onend=()=>{$("micButton").classList.remove("listening");$("voiceStatus").textContent="Voz lista"};
  recognition.onerror=e=>{$("voiceStatus").textContent="No se pudo usar el micrófono: "+e.error};
  recognition.onresult=e=>{let text="";for(let i=e.resultIndex;i<e.results.length;i++)text+=e.results[i][0].transcript;$("messageInput").value=text;if(e.results[e.results.length-1].isFinal){$("voiceStatus").textContent="Dictado listo; presioná Enviar"}};
  $("micButton").addEventListener("click",()=>{try{recognition.start()}catch(e){toast("El micrófono ya está activo.")}});
}else{$("micButton").disabled=true;$("voiceStatus").textContent="Este navegador no admite dictado por voz. Abrí NEXUS en Google Chrome y permite el micrófono.";$("micButton").title="Dictado por voz no disponible en este navegador"}

function saveTasks(){localStorage.setItem(STORAGE.tasks,JSON.stringify(tasks));renderTasks()}
function renderTasks(){
  const list=$("taskList");list.innerHTML="";
  if(!tasks.length){list.innerHTML='<div class="empty-state">Todavía no tienes tareas. Agrega la primera.</div>';return}
  tasks.forEach(task=>{const row=document.createElement("div");row.className="task-item"+(task.done?" done":"");const check=document.createElement("input");check.type="checkbox";check.checked=task.done;check.addEventListener("change",()=>{task.done=check.checked;saveTasks()});const label=document.createElement("span");label.className="task-text";label.textContent=task.text;const del=document.createElement("button");del.className="delete-btn";del.textContent="×";del.title="Eliminar tarea";del.addEventListener("click",()=>{tasks=tasks.filter(t=>t.id!==task.id);saveTasks()});row.append(check,label,del);list.append(row)})
}
$("taskForm").addEventListener("submit",e=>{e.preventDefault();const text=$("taskInput").value.trim();if(!text)return;tasks.unshift({id:crypto.randomUUID(),text,done:false});$("taskInput").value="";saveTasks();toast("Tarea agregada")});
renderTasks();

function saveReminders(){localStorage.setItem(STORAGE.reminders,JSON.stringify(reminders));renderReminders()}
function renderReminders(){
  const list=$("reminderList");list.innerHTML="";
  if(!reminders.length){list.innerHTML='<div class="empty-state">No hay recordatorios programados.</div>';return}
  reminders.sort((a,b)=>a.when-b.when).forEach(r=>{const row=document.createElement("div");row.className="task-item";const label=document.createElement("span");label.className="task-text";label.textContent=`${r.text} · ${new Date(r.when).toLocaleString("es-AR")}`;const del=document.createElement("button");del.className="delete-btn";del.textContent="×";del.addEventListener("click",()=>{reminders=reminders.filter(x=>x.id!==r.id);saveReminders()});row.append(label,del);list.append(row)})
}
$("reminderForm").addEventListener("submit",async e=>{e.preventDefault();const text=$("reminderText").value.trim(),when=new Date($("reminderTime").value).getTime();if(!text||!Number.isFinite(when)||when<=Date.now()){toast("Elegí una fecha y hora futuras.");return}
  if("Notification" in window && Notification.permission==="default"){try{await Notification.requestPermission()}catch{}}
  reminders.push({id:crypto.randomUUID(),text,when,fired:false});$("reminderText").value="";$("reminderTime").value="";saveReminders();toast("Recordatorio creado")
});
function checkReminders(){const now=Date.now();reminders.forEach(r=>{if(!r.fired&&r.when<=now){r.fired=true;toast("Recordatorio: "+r.text);if("Notification" in window&&Notification.permission==="granted")new Notification("NEXUS · Recordatorio",{body:r.text});speak("Recordatorio. "+r.text)}});localStorage.setItem(STORAGE.reminders,JSON.stringify(reminders))}
renderReminders();setInterval(checkReminders,15000);
