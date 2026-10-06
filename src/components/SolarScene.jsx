import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {rank, lensScore, openTasks} from '../lib/model.js';

const vertex = `
 varying vec3 vNormal;
 varying vec3 vPosition;
 void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
 }
`;
const noise = `
 float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
 float noise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
    mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
 }
 float fbm(vec3 p) { return noise(p)*.5 + noise(p*2.03)*.25 + noise(p*4.17)*.125 + noise(p*8.31)*.0625; }
`;
const worldFragment = `
 uniform vec3 baseColor;
 uniform float time;
 uniform float seed;
 uniform float sun;
 varying vec3 vNormal;
 varying vec3 vPosition;
 ${noise}
 void main() {
  vec3 p = normalize(vPosition);
  vec3 n = normalize(vNormal);
  float flow = fbm(p*3.8 + vec3(seed, time*.016, 0.));
  float clouds = fbm(p*11. + flow*2.8 + seed);
  float filaments = smoothstep(.36, .62, fbm(p*22. + flow*3.));
  float bands = .5 + .5*sin(p.y*11. + flow*6. + seed);
  vec3 light = normalize(vec3(-1.1,.48,.3));
  float day = max(dot(n,light),0.);
  float specular = pow(max(dot(n,normalize(light+vec3(0,0,1))),0.),72.);
  float rim = pow(1. - max(dot(n,vec3(0,0,1)),0.),4.);
  vec3 color = mix(baseColor*.12,baseColor*.82,flow);
  color += baseColor*(clouds*.20+bands*.065);
  color *= .18 + day*1.25;
  color += baseColor * rim * .34;
  color += vec3(.94,.97,.91) * specular * .22;
  color += baseColor * filaments * day * .065;
  if(sun > .5) {
   float granules = fbm(p*24. + vec3(time*.06,0,0));
   color = vec3(1.,.32,.055) * (1.05 + granules*.45) + vec3(.24,.17,.02)*flow;
  }
  gl_FragColor = vec4(color,1.);
 }
`;
const atmosphereFragment = `
 uniform vec3 baseColor;
 uniform float strength;
 varying vec3 vNormal;
 void main() {
  float rim = pow(1. - abs(dot(normalize(vNormal),vec3(0,0,1))),4.5);
  gl_FragColor = vec4(baseColor * strength, rim*.32);
 }
`;
const positions = [2.12,-.08,3.55,5.02,.69,2.87,4.02];

export default function SolarScene({ventures, tasks, lens, selected, onSelect, paused, resetKey}) {
 const host = useRef(null), labels = useRef({}), controlsRef = useRef(null), connectors = useRef({});
 const live = useRef({ventures,tasks,lens,selected,onSelect,paused});
 live.current = {ventures,tasks,lens,selected,onSelect,paused};
 const [failed,setFailed] = useState(false);
 const ids = ventures.map(v=>v.id).join('|');
 useEffect(()=>{controlsRef.current?.reset()},[resetKey]);

 useEffect(()=>{
  let renderer, composer, controls, bloom, resize, frame;
  let disposed = false, interaction = false;
  const resources = [], track = resource => (resources.push(resource),resource);
  const el = host.current;
  try {
   const scene = new THREE.Scene();scene.background=new THREE.Color('#080a0b');
   const camera = new THREE.PerspectiveCamera(37,1,.1,200);
   camera.position.set(0,21,31);
   renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
   renderer.setClearColor('#080a0b',0);
   renderer.toneMapping = THREE.ACESFilmicToneMapping;
   renderer.toneMappingExposure = 1.3;
   el.appendChild(renderer.domElement);
   controls = new OrbitControls(camera,renderer.domElement);
   controlsRef.current = controls;
   controls.enableDamping = true;
   controls.dampingFactor = .055;
   controls.enablePan = false;
   controls.minDistance = 25;
   controls.maxDistance = 60;
   controls.minPolarAngle = .25;
   controls.maxPolarAngle = Math.PI*.465;
   controls.saveState();
   controls.addEventListener('start',()=>{interaction=true});
   controls.addEventListener('end',()=>{interaction=false});
   composer = new EffectComposer(renderer);
   composer.addPass(new RenderPass(scene,camera));
   bloom = new UnrealBloomPass(new THREE.Vector2(1,1),.9,.75,1.05);
   composer.addPass(bloom);

   // Deterministic sparse particles: a quiet orbital field, rather than a star wallpaper.
   let randomSeed = 715;
   const random = ()=>{randomSeed=randomSeed*16807%2147483647;return (randomSeed-1)/2147483646};
   const vertices=[];
   for(let i=0;i<1050;i++) {
    const a=random()*Math.PI*2, r=4+random()*24;
    vertices.push(Math.cos(a)*r,(random()-.5)*3,Math.sin(a)*r);
   }
   const dustGeometry=track(new THREE.BufferGeometry());
   dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
   const dustMaterial=track(new THREE.PointsMaterial({color:'#bdb791',size:.026,transparent:true,opacity:.44,depthWrite:false}));
   const dust=new THREE.Points(dustGeometry,dustMaterial);scene.add(dust);
   const sphere=track(new THREE.SphereGeometry(1,64,48));
   function makeWorld(color,seed,sun=0) {
    const group=new THREE.Group();
    const material=track(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:worldFragment,
     uniforms:{baseColor:{value:new THREE.Color(color)},time:{value:0},seed:{value:seed},sun:{value:sun}}}));
    const mesh=new THREE.Mesh(sphere,material);group.add(mesh);
    const atmosphereMaterial=track(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:atmosphereFragment,
     uniforms:{baseColor:{value:new THREE.Color(color)},strength:{value:1.3}},transparent:true,
     side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    const atmosphere=new THREE.Mesh(sphere,atmosphereMaterial);atmosphere.scale.setScalar(1.045);group.add(atmosphere);
    scene.add(group);return {group,mesh,material,atmosphereMaterial};
   }
   const core=makeWorld('#ffc881',1,1);core.group.scale.setScalar(1.15);
   // Soft radiance around the nucleus, rendered in scene coordinates.
   const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;
   const ctx=glowCanvas.getContext('2d');
   if(ctx) {
    const g=ctx.createRadialGradient(128,128,12,128,128,128);
    g.addColorStop(0,'rgba(255,191,95,.7)');g.addColorStop(.17,'rgba(230,135,38,.35)');
    g.addColorStop(.45,'rgba(141,83,24,.13)');g.addColorStop(1,'rgba(80,49,12,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
    const texture=track(new THREE.CanvasTexture(glowCanvas));
    const glow=new THREE.Sprite(track(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.65})));
    glow.scale.set(11,11,1);scene.add(glow);
   }
   const circle=Array.from({length:193},(_,i)=>new THREE.Vector3(Math.cos(i/192*Math.PI*2),0,Math.sin(i/192*Math.PI*2)));
   const worlds=ventures.map((v,i)=>{
    const body=makeWorld(v.color,i*13+3);
    const orbit=new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(circle)),
     track(new THREE.LineBasicMaterial({color:'#adac8a',transparent:true,opacity:.075})));
    scene.add(orbit);
    const ring=new THREE.Mesh(track(new THREE.RingGeometry(1.31,1.322,128)),
     track(new THREE.MeshBasicMaterial({color:v.color,side:THREE.DoubleSide,transparent:true,opacity:.38,depthWrite:false})));
    ring.rotation.x=-Math.PI/2+.23;ring.rotation.z=.14*i;body.group.add(ring);
    const moonGroup=new THREE.Group();body.group.add(moonGroup);
    v.projects.forEach(()=>moonGroup.add(new THREE.Mesh(track(new THREE.SphereGeometry(.068,16,12)),
     track(new THREE.MeshBasicMaterial({color:v.color,transparent:true,opacity:.66})))));
    body.mesh.userData.id=v.id;
    return {...body,id:v.id,i,orbit,ring,moonGroup,distance:6+i*2.1,size:1,angle:positions[i%positions.length]};
   });

   const pointer=new THREE.Vector2(),ray=new THREE.Raycaster();let down=null;
   const pointerDown=e=>{down=[e.clientX,e.clientY]};
   const pointerUp=e=>{
    if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;
    const r=renderer.domElement.getBoundingClientRect();
    pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
    ray.setFromCamera(pointer,camera);
    const hit=ray.intersectObjects(worlds.map(w=>w.mesh))[0];
    if(hit)live.current.onSelect(hit.object.userData.id);
   };
   const contextLost=e=>{e.preventDefault();cancelAnimationFrame(frame);setFailed(true)};
   renderer.domElement.addEventListener('pointerdown',pointerDown);
   renderer.domElement.addEventListener('pointerup',pointerUp);
   renderer.domElement.addEventListener('webglcontextlost',contextLost);
   resize=new ResizeObserver(()=>{
    if(disposed)return;const w=el.clientWidth,h=el.clientHeight;
    camera.aspect=w/h;camera.zoom=Math.min(.88,Math.max(.43,camera.aspect/1.85));
    camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h);
   });resize.observe(el);

   let time=0,elapsed=0,last=0,previousSelected=selected,travel=0;
   const projected=new THREE.Vector3(),target=new THREE.Vector3(),center=new THREE.Vector3(),edge=new THREE.Vector3(),right=new THREE.Vector3();
   function animate(ms) {
    if(disposed)return;frame=requestAnimationFrame(animate);
    if(document.hidden){last=ms;return}
    const dt=Math.min((ms-last)/1000,.04);last=ms;elapsed+=dt;
    const st=live.current;if(!st.paused)time+=dt;
    if(st.selected!==previousSelected){previousSelected=st.selected;travel=st.paused?0:1.2}
    const ordered=rank(st.ventures,st.tasks,st.lens),blend=1-Math.exp(-dt*3.8);
    const occupied=[];
    core.material.uniforms.time.value=time;core.mesh.rotation.y=time*.025;
    dust.rotation.y=time*.006;
    // Selected world first so its label has the strongest visual claim.
    const labelOrder=[...worlds].sort((a,b)=>Number(b.id===st.selected)-Number(a.id===st.selected));
    for(const w of worlds) {
     const v=st.ventures.find(x=>x.id===w.id);if(!v)continue;
     const index=ordered.findIndex(x=>x.id===w.id),count=openTasks(v,st.tasks).length;
     const score=lensScore(v,st.tasks,st.lens);
     const normalized=st.lens==='tasks'?Math.min(score/10,1):score/100;
     const targetDistance=v.status==='park'?18.2+(w.i%2)*.7:6+index*2.1;
     w.distance=THREE.MathUtils.lerp(w.distance,targetDistance,blend);
     w.size=THREE.MathUtils.lerp(w.size,.66+normalized*1.48,blend);
     const a=w.angle+time*.004+Math.sin(time*.018+w.i)*.025;
     w.group.position.set(Math.cos(a)*w.distance,Math.sin(time*.25+w.i)*.06,Math.sin(a)*w.distance);
     const arrival=st.paused?1:THREE.MathUtils.smoothstep(elapsed-w.i*.065,0,.9);
     w.group.scale.setScalar(w.size*Math.max(arrival,.01));
     w.mesh.rotation.y=time*(.017+v.scores.urgency*.006);
     w.material.uniforms.time.value=time;
     w.atmosphereMaterial.uniforms.strength.value=.65+v.scores.mental*.12;
     w.orbit.scale.setScalar(w.distance);w.orbit.material.opacity=w.id===st.selected?.24:.048;
     w.ring.scale.setScalar(1+count*.024);w.ring.material.opacity=w.id===st.selected?.5:.18;
     w.moonGroup.visible=w.id===st.selected;
     w.moonGroup.children.forEach((m,j)=>{const a=time*.075+j*Math.PI*2/w.moonGroup.children.length;m.position.set(Math.cos(a)*1.65,.16,Math.sin(a)*1.65)});
    }
    if(travel>0&&!interaction) {
     const active=worlds.find(w=>w.id===st.selected);
     if(active){target.copy(active.group.position).multiplyScalar(.12);target.y=0;controls.target.lerp(target,1-Math.exp(-dt*2.8));}
     travel-=dt;
    }
    controls.update();
    for(const w of labelOrder) {
     const label=labels.current[w.id];if(!label)continue;
     center.copy(w.group.position).project(camera);
     right.setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(w.size);
     edge.copy(w.group.position).add(right).project(camera);
     const cx=(center.x*.5+.5)*el.clientWidth,cy=(-center.y*.5+.5)*el.clientHeight;
     const radius=Math.abs(edge.x-center.x)*el.clientWidth*.5;
     const width=label.offsetWidth,height=label.offsetHeight;
     const side=w.i===0||w.i===2?-1:w.i===1||w.i===4?1:0;
     let x=cx+(side?(radius+width/2+13)*side:0);
     let y=side?cy+height/2:cy-radius-11;
     const unclamped=x;
     x=THREE.MathUtils.clamp(x,width/2+10,el.clientWidth-width/2-10);
     if(side&&Math.abs(x-unclamped)>width*.22){x=THREE.MathUtils.clamp(cx,width/2+10,el.clientWidth-width/2-10);y=cy-radius-12;}
     y=THREE.MathUtils.clamp(y,65,el.clientHeight-25);
     for(let attempt=0;attempt<3;attempt++) {
      if(!occupied.some(r=>Math.abs(x-r.x)<(width+r.width)/2+6&&Math.abs(y-r.y)<(height+r.height)/2+5))break;
      y=THREE.MathUtils.clamp(y-height-8,65,el.clientHeight-25);
     }
     const connector=connectors.current[w.id];
     if(connector){const ly=y-height/2;const dx=x-cx,dy=ly-cy,len=Math.hypot(dx,dy)||1;
      connector.setAttribute('d',`M ${cx+dx/len*(radius+3)} ${cy+dy/len*(radius+3)} L ${x} ${ly}`);
      connector.style.opacity=w.id===st.selected?'.38':'.12';}
     occupied.push({x,y,width,height});
     label.style.transform=`translate(-50%,-100%) translate(${Math.round(x)}px,${Math.round(y)}px)`;
     label.style.visibility=center.z>1?'hidden':'visible';label.style.opacity=String(st.paused?1:Math.min(1,elapsed/.9));
     label.style.zIndex=w.id===st.selected?'4':'2';
    }
    const coreLabel=labels.current.core;
    if(coreLabel){projected.set(0,-1.25,0).project(camera);coreLabel.style.transform=`translate(-50%,0) translate(${(projected.x*.5+.5)*el.clientWidth}px,${(-projected.y*.5+.5)*el.clientHeight+6}px)`;}
    composer.render();
   }
   frame=requestAnimationFrame(animate);
   return ()=>{
    disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();controlsRef.current=null;
    renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);
    renderer.domElement.removeEventListener('webglcontextlost',contextLost);resources.forEach(r=>r.dispose());
    bloom.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();
   };
  } catch(error) {
   setFailed(true);cancelAnimationFrame(frame);resize?.disconnect();controls?.dispose();
   bloom?.dispose();composer?.dispose();renderer?.dispose();renderer?.domElement?.remove();resources.forEach(r=>r.dispose());
   console.warn('3D view unavailable; venture controls remain available.',error.message);
  }
 },[ids]);

 return <div className="scene-host" ref={host} aria-label="Interactive 3D venture map">
  {failed?<div className="scene-fallback"><span>YOUR PERSPECTIVE, STILL INTACT</span><h2>3D isn’t available on this device.</h2><p>Use the venture dock or Priority view to explore the same rankings and next moves.</p></div>:
   <div className="planet-labels"><svg className="planet-connectors" aria-hidden="true">{ventures.map(v=><path key={v.id} ref={el=>connectors.current[v.id]=el} fill="none" stroke={v.color} strokeWidth=".7"/>)}</svg>{ventures.map(v=><button key={v.id} ref={el=>labels.current[v.id]=el}
    className={'planet-label '+(selected===v.id?'selected':'')} style={{'--world':v.color}}
    onClick={()=>onSelect(v.id)} aria-pressed={selected===v.id}><span><i className="label-marker"/>{v.short}</span>
    <small>{v.status==='park'?'Parked for now':openTasks(v,tasks).length+' missions · '+Math.round(lensScore(v,tasks,lens))+(lens==='tasks'?' open':' / 100')}</small>
   </button>)}<div className="core-label" ref={el=>labels.current.core=el}>AMAR PEARSON<small>ONE SOURCE OF ENERGY</small></div></div>}
 </div>;
}
