const prompts = [
  'What is one thing you are grateful your body carried you through today?',
  'Describe the person you are becoming. What would they do in the next hard moment?',
  'What did a craving try to promise you today — and what do you know is actually true?',
  'Name one discomfort you handled today without running from it.',
  'What would future-you thank you for doing today?',
  'Where did you show discipline, even in a small way?',
  'What does freedom from nicotine make possible in your life?',
  'Write down three things that are already enough.',
  'What is beneath the urge right now: fatigue, loneliness, stress, boredom, or something else?',
  'Which thought can you let pass without believing it today?',
  'What did you learn from your last difficult moment?',
  'What would it look like to treat yourself with strength instead of punishment today?'
];
const workoutDefaults = ['Morning movement / walk', 'Training session', '10-minute mobility'];
const vitaminDefaults = ['Daily vitamins', 'Protein / nourishing meal', 'Sleep routine prepared'];
let state = JSON.parse(localStorage.getItem('rootQuitState') || '{}');
state.daily ||= {}; state.workouts ||= workoutDefaults; state.vitamins ||= vitaminDefaults;
const today = new Date().toISOString().slice(0,10);
const day = () => (state.daily[today] ||= { water: 0, nicotine: false, workout: {}, vitamins: {}, journal: '' });
const save = () => localStorage.setItem('rootQuitState', JSON.stringify(state));
const el = id => document.getElementById(id);
function diffDays(a,b){ return Math.max(0, Math.floor((new Date(b+'T12:00')-new Date(a+'T12:00'))/86400000)+1) }
function currentStreak(){ if(!state.quitDate) return 0; let n=0,d=new Date(today+'T12:00'); while(true){const key=d.toISOString().slice(0,10); if(!state.daily[key]?.nicotine) break;n++;d.setDate(d.getDate()-1)} return n }
function renderHeader(){
  const started=state.quitDate ? diffDays(state.quitDate,today) : 0, streak=currentStreak();
  el('streakDays').textContent=streak; el('totalWins').textContent=Object.values(state.daily).filter(x=>x.nicotine).length;
  const wins=Object.keys(state.daily).filter(k=>state.daily[k].nicotine).sort(); let best=0,run=0,prior=''; wins.forEach(k=>{if(prior && diffDays(prior,k)===2)run++;else run=1;best=Math.max(best,run);prior=k}); el('bestStreak').textContent=best;
  el('quitDateLabel').textContent=state.quitDate ? `STARTED ${new Date(state.quitDate+'T12:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}).toUpperCase()}`:'SET YOUR QUIT DATE';
  el('streakBadge').textContent=streak>=30?'FORGING FREEDOM':streak>0?'ON THE PATH':'DAY ONE';
  el('yearProgress').style.width=`${Math.min(100,started/365*100)}%`; el('yearProgressText').textContent=`${Math.min(started,365)} / 365 DAYS`;
  el('todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}).toUpperCase(); el('dayOfWeek').textContent=new Date().toLocaleDateString(undefined,{weekday:'short'}).toUpperCase();
  const btn=el('nicotineBtn');btn.classList.toggle('complete',day().nicotine);btn.querySelector('strong').textContent=day().nicotine?'Nicotine-free today. Held the line.':'I stayed nicotine-free today';
}
function taskList(container, items, key){ el(container).innerHTML=''; items.forEach((name,i)=>{const row=document.createElement('div');row.className='task'+(day()[key][i]?' done':'');row.innerHTML=`<input type="checkbox" id="${key}${i}" ${day()[key][i]?'checked':''}><label for="${key}${i}">${name}</label><button class="delete-task" aria-label="Remove ${name}">×</button>`;row.querySelector('input').onchange=e=>{day()[key][i]=e.target.checked;save();render()};row.querySelector('.delete-task').onclick=()=>{items.splice(i,1);save();render()};el(container).append(row)}) }
function renderWater(){const amount=day().water;el('waterCount').innerHTML=`${amount} <small>/ 8</small>`;el('waterGlasses').innerHTML='';for(let i=1;i<=8;i++){const b=document.createElement('button');b.className='glass '+(i<=amount?'full':'');b.title=`Set water to ${i} glasses`;b.onclick=()=>{day().water=i===amount?i-1:i;save();render()};el('waterGlasses').append(b)}el('waterMessage').textContent=amount>=8?'Hydrated. Standard met.':'Start with the next glass.'}
function render(){renderHeader();taskList('workoutList',state.workouts,'workout');taskList('vitaminList',state.vitamins,'vitamins');renderWater();const done=[day().nicotine, ...Object.values(day().workout),...Object.values(day().vitamins),day().water>=8].filter(Boolean).length;el('disciplineScore').textContent=Math.min(5,done);const jd=state.quitDate?Math.max(1,diffDays(state.quitDate,today)):1;el('journalDay').textContent=String(((jd-1)%365)+1).padStart(2,'0');el('journalPrompt').textContent=prompts[(jd-1)%prompts.length];el('journalText').value=day().journal||''}
el('nicotineBtn').onclick=()=>{if(!state.quitDate){el('settingsModal').showModal();return}day().nicotine=!day().nicotine;save();render()};
el('addWorkout').onclick=()=>{const n=prompt('What are you committing to?');if(n?.trim()){state.workouts.push(n.trim());save();render()}};
el('addVitamin').onclick=()=>{const n=prompt('Add a vitamin or foundational habit:');if(n?.trim()){state.vitamins.push(n.trim());save();render()}};
el('saveJournal').onclick=async()=>{const entry=el('journalText').value;day().journal=entry;save();const endpoint=window.ROOTED_QUIT_NOTION_ENDPOINT;if(!endpoint){el('journalStatus').textContent='Saved securely on this device.';setTimeout(()=>el('journalStatus').textContent='Your entry stays on this device.',2600);return}el('saveJournal').disabled=true;el('journalStatus').textContent='Saving to your Notion Journal…';try{const res=await fetch(`${endpoint.replace(/\/$/,'')}/journal`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:today,journalDay:Math.max(1,state.quitDate?diffDays(state.quitDate,today):1),prompt:el('journalPrompt').textContent,entry})});const data=await res.json();if(!res.ok)throw new Error(data.error);el('journalStatus').textContent='Saved to Notion + this device.'}catch(error){el('journalStatus').textContent=error.message||'Notion sync failed. Your browser copy is safe.'}finally{el('saveJournal').disabled=false;setTimeout(()=>el('journalStatus').textContent='Your entry stays on this device.',3600)}};
el('settingsBtn').onclick=()=>{el('quitDateInput').value=state.quitDate||today;el('settingsModal').showModal()};
el('saveSettings').onclick=()=>{state.quitDate=el('quitDateInput').value||today;save();render()};
el('resetData').onclick=()=>{if(confirm('Reset all ROOT data saved in this browser?')){localStorage.removeItem('rootQuitState');state={daily:{},workouts:workoutDefaults,vitamins:vitaminDefaults};el('settingsModal').close();render()}};
let timer;el('startTimer').onclick=()=>{let remaining=600;el('timerPopover').hidden=false;clearInterval(timer);const tick=()=>{el('timerDisplay').textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;if(remaining--<=0){clearInterval(timer);el('timerMessage').textContent='You made it through the wave.'}};tick();timer=setInterval(tick,1000)};el('closeTimer').onclick=()=>{clearInterval(timer);el('timerPopover').hidden=true};
render();
