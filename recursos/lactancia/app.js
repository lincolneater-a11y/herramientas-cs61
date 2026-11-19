/* CS61 · Juegos de lactancia, sin dependencias y aptos para GitHub Pages.
   Las imágenes y los datos de posturas corresponden al kit gráfico entregado. */
'use strict';
(() => {
 const app=document.getElementById('app');
 const kit='kit/';
 const img=(path)=>kit+path;
 const esc=(s)=>String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const rand=n=>Math.floor(Math.random()*n);
 const shuffle=a=>[...a].sort(()=>Math.random()-.5);
 const CATS=['mitos','tecnica','conservacion','sensibilizacion'];
 const NAMES={mitos:'Mitos y creencias',tecnica:'Técnica y posturas',conservacion:'Extracción y conservación',sensibilizacion:'Sensibilización y salud',comodin:'Comodín'};
 const ICONS=['corazon','estrella','gota','flor'];
 let bank=[],posturas=[],board=[],mode='inicio',oca=null,tri=null,quiz=null;
 const taken={};
 const qFor=cat=>{
  const pool=bank.filter(q=>q.categoria===cat);
  if(!pool.length)throw new Error('No hay preguntas en '+cat);
  let available=pool.filter(q=>!taken[q.id]);
  if(!available.length){pool.forEach(q=>delete taken[q.id]);available=pool}
  const q=available[rand(available.length)];taken[q.id]=true;return q;
 };
 const qbox=(question,selected,context)=>{
  if(!question)return '';
  const isAnswered=Number.isInteger(selected),correct=isAnswered&&selected===question.correcta;
  const buttons=question.opciones.map((option,i)=>{
   const cl=isAnswered?(i===question.correcta?'correct':i===selected?'wrong':''):'';
   return `<button class="answer ${cl}" type="button" data-action="${context}" data-i="${i}" ${isAnswered?'disabled':''}><b>${String.fromCharCode(65+i)}</b>${esc(option)}</button>`;
  }).join('');
  return `<section class="q-card" aria-label="Pregunta de ${esc(NAMES[question.categoria]||'lactancia')}"><span class="tag">${esc(NAMES[question.categoria]||'Lactancia')}</span><h3>${esc(question.pregunta)}</h3><div class="answers">${buttons}</div>${isAnswered?`<div class="feedback ${correct?'':'bad'}" role="status"><strong>${correct?'¡Respuesta correcta!':'Seguimos aprendiendo'}</strong>${!correct?`<p><strong>Respuesta correcta:</strong> ${esc(question.opciones[question.correcta])}</p>`:''}<p>${esc(question.explicacion)}</p></div>`:''}</section>`;
 };
 const sectionTitle=(label,title,description)=>`<div class="section-head"><div><span class="kicker">${esc(label)}</span><h1>${esc(title)}</h1><p>${esc(description)}</p></div><button class="btn soft" type="button" data-go="inicio">← Elegir otro juego</button></div>`;
 const startBox=(title,text,action)=>`<div class="panel"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="setup"><label>Participantes<select id="players"><option value="1">1 equipo</option><option value="2" selected>2 equipos</option><option value="3">3 equipos</option><option value="4">4 equipos</option></select></label><button type="button" class="btn" data-action="${action}">Empezar a jugar</button></div></div>`;
 const teamNames=n=>Array.from({length:n},(_,i)=>`Equipo ${i+1}`);
 const assetPart=(p)=>img(p);
 function home(){app.innerHTML=`<section class="hero"><div><span class="kicker">Recursos educativos · CS61</span><h1>Aprendemos sobre lactancia jugando</h1><p class="sub">Tres actividades interactivas para familias, agentes sanitarios y equipos de salud. Sirven para proyectar o usar desde el celular.</p></div><img class="mascot" src="${assetPart('08_mascota/mascota_bienvenida.svg')}" alt="Mascota gotita de leche"></section><div class="games">
 <button class="game-card" data-go="oca" type="button"><img src="${assetPart('10_vistas_previas/tablero_oca.png')}" alt="Vista del tablero de la Oca"><h2>La Oca de la Lactancia</h2><p>Tablero de 25 casillas, dados, preguntas y turnos para hasta cuatro equipos.</p></button>
 <button class="game-card" data-go="preguntados" type="button"><img src="${assetPart('05_preguntados/ruleta/ruleta_disco.svg')}" alt="Ruleta de preguntas por categorías"><h2>Preguntados de lactancia</h2><p>Girás la ruleta, respondés por categorías y ganás medallas.</p></button>
 <button class="game-card" data-go="quiz" type="button"><img src="${assetPart('10_vistas_previas/las_5_posturas_finales.png')}" alt="Ilustraciones de cinco posiciones para amamantar"><h2>Quiz de posturas y acople</h2><p>Reconocé posiciones, compará técnicas y aprendé con imágenes del kit.</p></button></div>
 <p class="notice">Contenido educativo orientativo basado en el kit gráfico. Para su uso institucional, conviene revisar las preguntas con el equipo de salud. No solicita nombres ni datos personales.</p>`}
 function ocaPage(){
  app.innerHTML=sectionTitle('Juego 1','La Oca de la Lactancia','Avanzá hasta la casilla 25. En las casillas especiales, respondé para ganar un paso extra.')+(oca?ocaGame():startBox('Preparar el tablero','Podés jugar por equipos o de forma individual. Se utiliza un dado virtual.', 'oca-start'));
 }
 function ocaGame(){
  const s=oca,p=s.pos[s.turn];
  const pieces=s.pos.map((position,i)=>{
   const b=position>0?board[position-1]:{x:165,y:946};
   const x=b.x+(i-(s.pos.length-1)/2)*43,y=b.y+(i%2?15:-15);
   return `<div class="piece ${s.turn===i?'active':''}" style="left:${x/1920*100}%;top:${y/1080*100}%" title="Equipo ${i+1} en casilla ${position}"><img src="${assetPart('04_juego_oca/fichas/ficha_'+ICONS[i]+'.svg')}" alt=""><em>${i+1}</em></div>`;
  }).join('');
  const names=teamNames(s.pos.length);
  const scoreboard=s.pos.map((n,i)=>`<div class="team ${s.turn===i?'current':''} ${s.phase==='winner'&&s.turn===i?'winner':''}"><b>${names[i]}</b><small>Casilla ${n||'Salida'} de 25</small></div>`).join('');
  const phase=s.phase;
  let controls='';
  if(phase==='roll')controls=`<button class="btn" data-action="oca-roll">Lanzar el dado</button>`;
  if(phase==='done'||phase==='answered')controls=`<button class="btn" data-action="oca-next">Siguiente turno →</button>`;
  if(phase==='winner')controls=`<div class="feedback">¡${esc(names[s.turn])} llegó a la meta!</div><button class="btn" data-action="oca-restart">Nueva partida</button>`;
  const description=phase==='roll'?`Turno de ${names[s.turn]}. Tocá el dado para avanzar.`:phase==='question'?'Respondé la pregunta de esta casilla.':phase==='answered'?'Ya podés pasar al siguiente equipo.':phase==='winner'?'¡Juego terminado!':'Avanzaste. Ahora sigue otro equipo.';
  return `<div class="game-layout"><div><div class="board-wrap"><div class="board"><img class="board-base" src="${assetPart('04_juego_oca/tablero/tablero_oca_25.svg')}" alt="Tablero de 25 casillas: Camino de la lactancia">${pieces}</div></div><div class="rules"><strong>Reglas:</strong> lanzá el dado, avanzá las casillas indicadas y, si caés en una casilla especial, contestá. Una respuesta correcta suma una casilla extra. Gana quien llegue primero a la 25.</div></div><aside class="side"><div class="turn-box"><span class="kicker">Turno actual</span><strong>${esc(names[s.turn])}</strong><p>${esc(description)}</p><img class="dice" src="${assetPart('04_juego_oca/dados/dado_'+s.dice+'.svg')}" alt="Dado mostrando ${s.dice}"><div class="btnrow">${controls}<button class="btn soft" type="button" data-action="oca-restart">Reiniciar</button></div></div><div class="scoreboard">${scoreboard}</div>${phase==='question'||phase==='answered'?qbox(s.question,s.answer,'oca-answer'):''}</aside></div>`;
 }
 function triPage(){app.innerHTML=sectionTitle('Juego 2','Preguntados de Lactancia','Girás la ruleta, respondés y conseguís las cuatro medallas temáticas.')+(tri?triviaGame():startBox('Preparar los equipos','Cada respuesta correcta otorga la medalla de una categoría. El comodín permite conseguir una medalla pendiente.', 'tri-start'))}
 function medals(obtained){return CATS.map(cat=>`<img src="${assetPart('05_preguntados/medallas/'+cat+'_'+(obtained.includes(cat)?'ganada':'bloqueada')+'.svg')}" title="${esc(NAMES[cat])}${obtained.includes(cat)?': ganada':': pendiente'}" alt="${esc(NAMES[cat])}${obtained.includes(cat)?': ganada':': pendiente'}">`).join('')}
 function triviaGame(){
  const s=tri,names=teamNames(s.teams.length),team=s.teams[s.turn],phase=s.phase;
  const teamCards=s.teams.map((t,i)=>`<div class="team ${s.turn===i?'current':''} ${phase==='winner'&&s.turn===i?'winner':''}"><b>${names[i]} · ${t.medals.length}/4 medallas</b><div class="medals">${medals(t.medals)}</div><small>${t.points} respuestas correctas</small></div>`).join('');
  let right='';
  if(phase==='spin'||phase==='spinning')right=`<div class="panel"><span class="kicker">Turno actual</span><h2>${esc(names[s.turn])}</h2><p>${phase==='spin'?'¡Girás la ruleta para conocer tu categoría!':'La ruleta está girando…'}</p><button class="btn" data-action="tri-spin" ${phase==='spinning'?'disabled':''}>Girar la ruleta</button></div>`;
  if(phase==='question'||phase==='answered')right=`<div><p class="status-line">${s.bucket==='comodin'?'Comodín · ':''}${esc(NAMES[s.question.categoria])}</p>${qbox(s.question,s.answer,'tri-answer')}${phase==='answered'?`<div class="btnrow" style="margin-top:12px"><button class="btn" data-action="tri-next">Siguiente turno →</button></div>`:''}</div>`;
  if(phase==='winner')right=`<div class="panel results"><img src="${assetPart('08_mascota/mascota_acierto.svg')}" alt="Mascota celebrando"><h2>¡${esc(names[s.turn])} completó las cuatro medallas!</h2><p>Terminó la partida de Preguntados.</p><button class="btn" data-action="tri-restart">Volver a jugar</button></div>`;
  return `<div class="wheel-layout"><div><div class="wheel-stage"><img class="wheel-arrow" src="${assetPart('05_preguntados/ruleta/puntero.svg')}" alt="Puntero de la ruleta"><img id="wheel" class="wheel" src="${assetPart('05_preguntados/ruleta/ruleta_disco.svg')}" style="transform:rotate(${s.rotation}deg)" alt="Ruleta dividida en Mitos, Técnica, Conservación, Sensibilización y Comodín"></div><div class="btnrow"><button class="btn soft" data-action="tri-restart">Reiniciar partida</button></div><p class="rules"><strong>Reglas:</strong> cada respuesta correcta suma un punto y permite conseguir una medalla pendiente. El comodín puede otorgar una medalla faltante. Gana el primer equipo con las cuatro.</p></div><div><div class="scoreboard" style="margin-bottom:15px">${teamCards}</div>${right}</div></div>`;
 }
 const QUIZ=[
  {q:'¿Qué posición muestra esta imagen?',op:['Crianza biológica (recostada)','Cuna clásica','Pelota de rugby'],a:0,cat:'tecnica',path:'02_posturas/ilustraciones/crianza_biologica.webp',why:'La madre está semi-recostada con el bebé apoyado sobre su torso.'},
  {q:'¿Cómo se llama esta posición?',op:['Cuna cruzada','Cuna clásica','Acostada de lado'],a:1,cat:'tecnica',path:'02_posturas/ilustraciones/cuna_clasica.webp',why:'En la cuna clásica, el brazo del lado del pecho sostiene al bebé.'},
  {q:'¿Cómo se llama esta posición?',op:['Pelota de rugby','Crianza biológica','Cuna cruzada'],a:2,cat:'tecnica',path:'02_posturas/ilustraciones/cuna_cruzada.webp',why:'La cuna cruzada utiliza el brazo opuesto al pecho y acompaña cuello y hombros.'},
  {q:'¿Qué postura se observa?',op:['Pelota de rugby','Acostada de lado','Cuna clásica'],a:0,cat:'tecnica',path:'02_posturas/ilustraciones/pelota_de_rugby.webp',why:'El bebé se ubica al costado, por debajo del brazo, con los pies hacia atrás.'},
  {q:'¿Qué postura se observa?',op:['Cuna clásica','Acostada de lado','Cuna cruzada'],a:1,cat:'tecnica',path:'02_posturas/ilustraciones/acostada_de_lado.webp',why:'Madre y bebé están de costado frente a frente; luego de la toma, para dormir, bebé boca arriba en espacio seguro.'},
  {q:'La imagen representa un tipo de acople. ¿Cuál?',op:['Acople superficial','Ningún acople','Acople profundo'],a:2,cat:'tecnica',path:'03_tecnica_lactancia/acople/ilustracion_profundo.webp',why:'El acople profundo suele mostrar boca muy abierta, mentón en contacto y comodidad.'},
  {q:'¿Cuál es el acople que conviene revisar para evitar dolor y baja transferencia?',op:['El superficial','El profundo','Ambos siempre son idénticos'],a:0,cat:'tecnica',path:'03_tecnica_lactancia/acople/ilustracion_superficial.webp',why:'El acople superficial puede causar molestias y dificultar la transferencia de leche.'},
  {q:'Al comparar ambas escenas, ¿qué señal apoya un acople profundo?',op:['Boca poco abierta','Boca bien abierta y mentón en contacto','Chasquidos continuos y dolor'],a:1,cat:'tecnica',path:'03_tecnica_lactancia/acople/comparacion_acople_profundo_vs_superficial.webp',why:'Las señales se evalúan juntas; no alcanza una sola para confirmar la transferencia eficaz.'},
  {q:'¿Qué es importante para la alineación corporal del bebé?',op:['Que la cabeza esté muy girada','Que no esté apoyado','Que cabeza y tronco estén alineados y cerca de la madre'],a:2,cat:'tecnica',path:'03_tecnica_lactancia/tarjetas/alineacion_corporal.webp',why:'Acercar y alinear el cuerpo ayuda a favorecer una postura confortable.'},
  {q:'En la extracción manual, ¿qué técnica se recomienda?',op:['Presionar suavemente hacia el tórax y comprimir-soltar sin arrastrar la piel','Tirar con fuerza del pezón','Frotar la piel con intensidad'],a:0,cat:'conservacion',path:'03_tecnica_lactancia/tarjetas/extraccion_manual.webp',why:'Los dedos forman una C y realizan compresiones rítmicas suaves.'},
  {q:'En esta posición, ¿qué recomendación es importante al finalizar la toma y acostar al bebé?',op:['Dormir con almohadas sueltas','Ubicarlo boca arriba en su espacio seguro','Dormir siempre de costado'],a:1,cat:'sensibilizacion',path:'02_posturas/ilustraciones/acostada_de_lado.webp',why:'La postura para amamantar no equivale a la postura recomendada para dormir.'},
  {q:'Según el material, ¿qué signo puede acompañar un acople superficial?',op:['Comodidad durante toda la toma','Deglución eficaz sin molestias','Dolor persistente o mejillas hundidas'],a:2,cat:'tecnica',path:'03_tecnica_lactancia/acople/acople_superficial.webp',why:'El dolor persistente, los chasquidos o las mejillas hundidas justifican evaluar el acople.'},
  {q:'¿Qué señal acompaña habitualmente un acople profundo?',op:['Succión rítmica y deglución','Dolor que aumenta progresivamente','Solo la punta del pezón en la boca'],a:0,cat:'tecnica',path:'03_tecnica_lactancia/acople/acople_profundo.webp',why:'Deglución y succión rítmica, junto con confort, son señales positivas.'},
 ];
 function quizPage(){app.innerHTML=sectionTitle('Juego 3','Quiz de posturas y acople','Diez desafíos visuales con explicaciones para aprender a reconocer las imágenes.')+(quiz?quizGame():`<section class="panel"><h2>¿Reconocés las posiciones?</h2><p>Incluye cinco posiciones de amamantamiento, señales de acople, alineación y extracción manual. No se guardan datos personales.</p><button class="btn" data-action="quiz-start">Comenzar el quiz</button></section>`)}
 function quizGame(){const s=quiz;
  if(s.index>=s.questions.length)return `<section class="panel results"><img src="${assetPart(s.score>=7?'08_mascota/mascota_acierto.svg':'08_mascota/mascota_animo.svg')}" alt="Mascota de lactancia"><h2>¡Terminaste el quiz!</h2><strong>${s.score} de ${s.questions.length} respuestas correctas</strong><p>Lo importante es seguir aprendiendo y resolver dudas con el equipo de salud.</p><div class="btnrow" style="justify-content:center"><button class="btn" data-action="quiz-start">Volver a jugar</button><button class="btn alt" data-action="quiz-csv">Descargar resultado anónimo (CSV)</button></div></section>`;
  const item=s.questions[s.index],selected=s.selected;
  const q={categoria:item.cat,pregunta:item.q,opciones:item.op,correcta:item.a,explicacion:item.why};
  return `<div class="panel"><p class="status-line">Pregunta ${s.index+1} de ${s.questions.length} · ${s.score} correctas</p><div class="quiz-progress" role="progressbar" aria-valuenow="${s.index}" aria-valuemin="0" aria-valuemax="${s.questions.length}" aria-label="Progreso del quiz"><span style="width:${s.index/s.questions.length*100}%"></span></div><div class="visual-question"><img src="${assetPart(item.path)}" alt="Ilustración educativa para identificar una posición o técnica de lactancia" loading="lazy"><div>${qbox(q,selected,'quiz-answer')}${Number.isInteger(selected)?'<div class="btnrow" style="margin-top:12px"><button class="btn" data-action="quiz-next">'+(s.index===s.questions.length-1?'Ver resultado':'Siguiente pregunta →')+'</button></div>':''}</div></div></div>`
 }
 function render(){document.title=(mode==='inicio'?'Juegos sobre lactancia':mode==='oca'?'Oca de Lactancia':mode==='preguntados'?'Preguntados de Lactancia':'Quiz de Lactancia')+' · CS61'; if(mode==='oca')ocaPage();else if(mode==='preguntados')triPage();else if(mode==='quiz')quizPage();else home();}
 function goto(next){mode=['oca','preguntados','quiz'].includes(next)?next:'inicio';history.replaceState(null,'','#'+(mode==='inicio'?'inicio':mode));render();window.scrollTo({top:0,behavior:'auto'});}
 function startOca(){const n=Number(document.getElementById('players')?.value||2);oca={pos:Array.from({length:n},()=>0),turn:0,dice:1,phase:'roll',question:null,answer:null};render()}
 function ocaRoll(){if(!oca||oca.phase!=='roll')return;oca.dice=rand(6)+1;oca.pos[oca.turn]=Math.min(25,oca.pos[oca.turn]+oca.dice);let p=oca.pos[oca.turn];if(p>=25){oca.phase='winner'}else{let special=board[p-1].tipo;if(special!=='normal'){oca.question=qFor(special);oca.answer=null;oca.phase='question'}else{oca.question=null;oca.phase='done'}}render()}
 function ocaAnswer(i){if(!oca||oca.phase!=='question'||!Number.isInteger(i)||i<0||i>=3)return;oca.answer=i;if(i===oca.question.correcta)oca.pos[oca.turn]=Math.min(25,oca.pos[oca.turn]+1);oca.phase=oca.pos[oca.turn]>=25?'winner':'answered';render()}
 function ocaNext(){if(!oca||!['done','answered'].includes(oca.phase))return;oca.turn=(oca.turn+1)%oca.pos.length;oca.phase='roll';oca.question=null;oca.answer=null;render()}
 function triStart(){const n=Number(document.getElementById('players')?.value||2);tri={teams:Array.from({length:n},()=>({medals:[],points:0})),turn:0,rotation:0,phase:'spin',bucket:null,question:null,answer:null};render()}
 function triSpin(){if(!tri||tri.phase!=='spin')return;tri.phase='spinning';const idx=rand(5),bucket=[...CATS,'comodin'][idx];const current=tri.rotation%360,desired=(360-(36+idx*72))%360;tri.rotation+=(desired-current+360)%360+360*4;const wheel=document.getElementById('wheel'),button=document.querySelector('[data-action="tri-spin"]');if(button)button.disabled=true;if(wheel)wheel.style.transform=`rotate(${tri.rotation}deg)`;
  window.setTimeout(()=>{if(!tri||tri.phase!=='spinning')return;tri.bucket=bucket;let category=bucket;if(bucket==='comodin'){const missing=CATS.filter(c=>!tri.teams[tri.turn].medals.includes(c));category=missing.length?missing[rand(missing.length)]:CATS[rand(CATS.length)]}tri.question=qFor(category);tri.answer=null;tri.phase='question';render()},1720);
 }
 function triAnswer(i){if(!tri||tri.phase!=='question'||!Number.isInteger(i)||i<0||i>=3)return;tri.answer=i;if(i===tri.question.correcta){const t=tri.teams[tri.turn];t.points++;if(!t.medals.includes(tri.question.categoria))t.medals.push(tri.question.categoria)}tri.phase=tri.teams[tri.turn].medals.length===4?'winner':'answered';render()}
 function triNext(){if(!tri||tri.phase!=='answered')return;tri.turn=(tri.turn+1)%tri.teams.length;tri.phase='spin';tri.bucket=null;tri.question=null;tri.answer=null;render()}
 function quizStart(){const questions=shuffle(QUIZ).slice(0,10);quiz={index:0,score:0,selected:null,questions};render()}
 function quizAnswer(i){if(!quiz||Number.isInteger(quiz.selected)||quiz.index>=quiz.questions.length||!Number.isInteger(i)||i<0||i>=3)return;quiz.selected=i;if(i===quiz.questions[quiz.index].a)quiz.score++;render()}
 function quizNext(){if(!quiz||!Number.isInteger(quiz.selected))return;quiz.index++;quiz.selected=null;render()}
 function quizCsv(){if(!quiz||quiz.index<quiz.questions.length)return;const csv='fecha,juego,aciertos,total\n'+[new Date().toISOString(),'Quiz lactancia',quiz.score,quiz.questions.length].join(',')+'\n';const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='resultado_anonimo_quiz_lactancia.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000)}
 app.addEventListener('click',(e)=>{const button=e.target.closest('button');if(!button||!app.contains(button))return;if(button.dataset.go){goto(button.dataset.go);return}const action=button.dataset.action,i=button.dataset.i===undefined?NaN:Number(button.dataset.i);switch(action){case 'oca-start':startOca();break;case 'oca-roll':ocaRoll();break;case 'oca-answer':ocaAnswer(i);break;case 'oca-next':ocaNext();break;case 'oca-restart':oca=null;ocaPage();break;case 'tri-start':triStart();break;case 'tri-spin':triSpin();break;case 'tri-answer':triAnswer(i);break;case 'tri-next':triNext();break;case 'tri-restart':tri=null;triPage();break;case 'quiz-start':quizStart();break;case 'quiz-answer':quizAnswer(i);break;case 'quiz-next':quizNext();break;case 'quiz-csv':quizCsv();break;}});
 window.addEventListener('hashchange',()=>{const next=location.hash.replace('#','');mode=['oca','preguntados','quiz'].includes(next)?next:'inicio';render()});
 Promise.all([fetch('preguntas.json').then(r=>{if(!r.ok)throw Error('preguntas');return r.json()}),fetch('kit/09_json_datos/tablero_oca_25.json').then(r=>{if(!r.ok)throw Error('tablero');return r.json()}),fetch('kit/09_json_datos/posturas.json').then(r=>r.json())]).then(([questions,tablero,pos])=>{bank=questions;board=tablero.casillas;posturas=pos;mode=['oca','preguntados','quiz'].includes(location.hash.slice(1))?location.hash.slice(1):'inicio';render()}).catch(err=>{console.error(err);app.innerHTML='<section class="panel"><h1>No se pudieron cargar los juegos</h1><p>Revisá que se hayan subido todas las carpetas y archivos de <code>recursos/lactancia/</code> al servidor. Si abriste el HTML haciendo doble clic en Windows, abrilo mediante GitHub Pages o un servidor local.</p><button class="btn" type="button" onclick="location.reload()">Reintentar</button></section>'});
})();
