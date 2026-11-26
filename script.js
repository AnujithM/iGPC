const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const copyCitation=document.querySelector('#copy-citation');
if(copyCitation && navigator.clipboard?.writeText){
  copyCitation.hidden=false;
  copyCitation.addEventListener('click',async()=>{
    const entry=document.querySelector('#paper-bibtex'), status=document.querySelector('#copy-status');
    try{await navigator.clipboard.writeText(entry.textContent);status.textContent='BibTeX copied.';}
    catch{const range=document.createRange();range.selectNodeContents(entry);
      const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
      status.textContent='Citation selected. Use your device’s copy command.';}
  });
}
const heroVideo=document.querySelector('#hero-video'), heroToggle=document.querySelector('#hero-toggle');
const film=document.querySelector('#highlight-video');
const allVideos=[...document.querySelectorAll('video')];
const visibleVideos=new Set(), userPaused=new Set(), userStarted=new Set();

function playVideo(v){return v.play().catch(()=>updateVideoUI(v));}
function reconcile(v){
  if(document.hidden || !visibleVideos.has(v) || userPaused.has(v) || (reducedMotion.matches && !userStarted.has(v))){
    v.pause();return;
  }
  if(v.paused && !v.ended)playVideo(v);
}
function toggleVideo(v){
  if(v.paused){userPaused.delete(v);userStarted.add(v);if(v.ended)v.currentTime=0;playVideo(v);}
  else{userPaused.add(v);v.pause();}
}
function updateVideoUI(v){
  const label=v.paused?(v.ended?'Replay':'Play'):'Pause';
  if(v===heroVideo){
    heroToggle.querySelector('.hero-toggle-label').textContent=label+' background';
    heroToggle.querySelector('.pause-icon').textContent=v.paused?'▶':'Ⅱ';
    heroToggle.setAttribute('aria-label',label+' background video');return;
  }
  const bar=v.parentElement.querySelector('.media-strip');if(!bar)return;
  const play=bar.querySelector('.media-toggle');
  play.textContent=v.paused?'▶':'Ⅱ';play.setAttribute('aria-label',label+' video');
  const seek=bar.querySelector('input');
  if(Number.isFinite(v.duration)&&v.duration>0){
    seek.disabled=false;seek.max=v.duration;seek.value=v.currentTime;
    seek.setAttribute('aria-valuetext',Math.floor(v.currentTime)+' of '+Math.ceil(v.duration)+' seconds');
  }
  const sound=bar.querySelector('.media-sound');
  if(sound){sound.textContent=v.muted?'Unmute':'Mute';sound.setAttribute('aria-label',sound.textContent+' project film');}
  const err=v.parentElement.querySelector('.video-error');if(err)err.hidden=!v.error;
}
function mediaButton(className,label,action){
  const b=document.createElement('button');b.type='button';b.className=className;b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;
}
for(const v of allVideos){
  v.muted=true;
  if(v!==heroVideo){
    const wrap=v.parentElement, bar=document.createElement('div');bar.className='media-strip';
    bar.setAttribute('role','group');bar.setAttribute('aria-label',v.getAttribute('aria-label')+' controls');
    const play=mediaButton('media-toggle','Play video',()=>toggleVideo(v));
    const seek=document.createElement('input');seek.type='range';seek.min=0;seek.max=1;seek.step='.1';seek.value=0;seek.disabled=true;
    seek.setAttribute('aria-label','Seek video');seek.addEventListener('input',()=>{if(Number.isFinite(v.duration))v.currentTime=Number(seek.value);});
    bar.append(play,seek);
    if(v===film)bar.append(mediaButton('media-sound','Unmute project film',()=>{v.muted=!v.muted;updateVideoUI(v);}));
    if(document.fullscreenEnabled){
      const fs=mediaButton('media-fullscreen','Toggle full screen',()=>{
        const operation=document.fullscreenElement?document.exitFullscreen():wrap.requestFullscreen();operation.catch(()=>{});
      });fs.textContent='⛶';bar.append(fs);
    }
    wrap.append(bar);v.controls=false;
  }
  for(const e of ['playing','pause','ended','error','loadedmetadata','timeupdate','volumechange'])v.addEventListener(e,()=>updateVideoUI(v));
  updateVideoUI(v);
}
heroToggle.addEventListener('click',()=>toggleVideo(heroVideo));
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const {target,intersectionRatio} of entries){
      if(intersectionRatio>=.20)visibleVideos.add(target);else visibleVideos.delete(target);
      reconcile(target);
    }
  },{threshold:[0,.20]});
  allVideos.forEach(v=>observer.observe(v));
}else{
  const check=()=>allVideos.forEach(v=>{const r=v.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)visibleVideos.add(v);else visibleVideos.delete(v);reconcile(v);});
  window.addEventListener('scroll',check,{passive:true});check();
}
document.addEventListener('visibilitychange',()=>allVideos.forEach(reconcile));
reducedMotion.addEventListener('change',()=>{userStarted.clear();allVideos.forEach(reconcile);});

// Actual edit points in the silent 30 fps reel. One media clock keeps the
// film, bounce and wave together across pause, seek and wraparound.
const scenes = [
  { start: 0, focus: '22%' },
  { start: 8, focus: '74%' },
];
const sceneBar = document.querySelector('.hero-timeline span');
let sceneIndex = -1;
// Twenty uninterrupted bounces per 19-second reel, including across its loop.
const orbDuration = 950;
function scrubbed(selector, frames) {
  const target = document.querySelector(selector);
  if (!target.animate) return null;
  const anim = target.animate(frames, {duration: orbDuration, fill: 'both'});
  anim.pause();
  return anim;
}
const orb = scrubbed('.brand-orb', [
  {offset: 0, transform:'translateY(0) scale(1)', easing:'ease-out'},
  {offset:.39, transform:'translateY(-.16em) scale(1)', easing:'ease-in'},
  {offset:.82, transform:'translateY(.066em) scale(.98,1.04)', easing:'ease-out'},
  {offset:.87, transform:'translateY(.066em) scale(1.09,.91)', easing:'ease-in'},
  {offset: 1, transform:'translateY(0) scale(1)'},
]);
const wave = scrubbed('.orb-wave', [
  {offset:0, opacity:0, transform:'scale(.7)'}, {offset:.81, opacity:0, transform:'scale(.7)'},
  {offset:.85, opacity:.55, transform:'scale(1)'}, {offset:1, opacity:0, transform:'scale(2.2,1.4)'},
]);
let previousOrbTime = -1;
function syncHero(t) {
  let index = 0;
  for (let i=1; i<scenes.length && scenes[i].start<=t; i++) index = i;
  const scene = scenes[index];
  if (index !== sceneIndex) {
    sceneIndex = index;
    heroVideo.style.setProperty('--scene-focus', scene.focus);
  }
  const ms = reducedMotion.matches ? orbDuration : (t * 1000) % orbDuration;
  if (ms !== previousOrbTime) {
    if (orb) orb.currentTime = ms;
    if (wave) wave.currentTime = ms;
    previousOrbTime = ms;
  }
  const end = scenes[index+1]?.start ?? heroVideo.duration;
  if (Number.isFinite(end)) sceneBar.style.transform = `scaleX(${Math.max(0, Math.min(1,(t-scene.start)/(end-scene.start)))})`;
}
['loadedmetadata','timeupdate','seeked'].forEach(name => heroVideo.addEventListener(name, () => syncHero(heroVideo.currentTime)));
if ('requestVideoFrameCallback' in heroVideo) {
  const frame = (_, meta) => { syncHero(meta.mediaTime); heroVideo.requestVideoFrameCallback(frame); };
  heroVideo.requestVideoFrameCallback(frame);
}
reducedMotion.addEventListener('change', () => syncHero(heroVideo.currentTime));
syncHero(0);

document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => {
  film.dataset.pendingSeek = button.dataset.seek;
  const seek = () => { if (film.dataset.pendingSeek !== undefined) { film.currentTime = Number(film.dataset.pendingSeek); delete film.dataset.pendingSeek; } };
  if (film.readyState >= 1) seek();
  else film.addEventListener('loadedmetadata', seek, { once: true });
  userPaused.delete(film);userStarted.add(film);playVideo(film);
  document.querySelector('#highlight').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
}));

const dialog = document.querySelector('#figure-dialog');
document.querySelectorAll('[data-figure]').forEach(button => button.addEventListener('click', () => {
  dialog.querySelector('img').src = button.dataset.figure;
  dialog.querySelector('img').alt = button.dataset.caption;
  dialog.querySelector('p').textContent = button.dataset.caption;
  dialog.showModal();
}));
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); }
});

const navLinks = [...document.querySelectorAll('.nav-links a')];
const header = document.querySelector('.site-header');
const progress = document.querySelector('.scroll-progress span');
function updateScroll() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  const range = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${range > 0 ? window.scrollY / range : 0})`;
  const section = [...document.querySelectorAll('section[id]')].filter(el => el.getBoundingClientRect().top < innerHeight * .4).pop();
  navLinks.forEach(link => { if (section && link.hash === '#' + section.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
}
window.addEventListener('scroll', updateScroll, { passive: true });
updateScroll();
const railFrame=document.getElementById('rail-playground');
if(railFrame && 'IntersectionObserver' in window){
  let railVisible=false;
  const notify=()=>railFrame.contentWindow?.postMessage({type:'igpc:rail-visible',visible:railVisible&&!document.hidden},location.origin);
  new IntersectionObserver(([entry])=>{railVisible=entry.isIntersecting;notify();}).observe(railFrame);
  railFrame.addEventListener('load',notify);document.addEventListener('visibilitychange',notify);
}

if ('IntersectionObserver' in window) {
  if (!reducedMotion.matches) document.documentElement.classList.add('enhanced');
  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveals.unobserve(entry.target); }
  }), { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(el => reveals.observe(el));
}
