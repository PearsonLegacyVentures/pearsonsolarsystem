import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {rank,lensScore,openTasks} from '../lib/model.js';
const vertex=`varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragment=`uniform vec3 baseColor;uniform float time;uniform float seed;uniform float sun;varying vec3 vNormal;varying vec3 vPosition;
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return noise(p)*.5+noise(p*2.1)*.25+noise(p*4.3)*.125+noise(p*8.7)*.0625;}
void main(){vec3 p=normalize(vPosition);float n=fbm(p*5.+vec3(seed,time*.013,0));float bands=sin(p.y*25.+n*13.+seed);float storm=fbm(p*15.+n*3.);vec3 col=baseColor*(.45+.55*n+.20*bands);col=mix(col,baseColor*1.65,storm*.36);float lit=max(dot(normalize(vNormal),normalize(vec3(-.7,1.,1.))),0.);float rim=pow(1.-max(dot(normalize(vNormal),vec3(0,0,1)),0.),3.);if(sun>.5){col=baseColor*(.8+n*.7)+vec3(.45,.2,.05)*bands*.2;}else{col*=.14+lit*1.35;col+=baseColor*rim*.5;}gl_FragColor=vec4(col,1.);}`;
const atmosphereFragment=`uniform vec3 baseColor;uniform float strength;varying vec3 vNormal;void main(){float f=pow(1.-abs(dot(normalize(vNormal),vec3(0,0,1))),3.);gl_FragColor=vec4(baseColor*strength,f*.38);}`;
const angles=[2.6,.55,4.0,5.35,1.4,3.2,4.55];
export default function SolarScene({ventures,tasks,lens,selected,onSelect,paused,resetKey}){
 const host=useRef(null),labelRefs=useRef({}),live=useRef({ventures,tasks,lens,selected,onSelect,paused});live.current={ventures,tasks,lens,selected,onSelect,paused};
 const [failed,setFailed]=useState(false);const controlRef=useRef(null);const ids=ventures.map(v=>v.id).join('|');
 useEffect(()=>{controlRef.current?.reset()},[resetKey]);
 useEffect(()=>{
  let renderer,composer,controls,frame,resize,disposed=false;const el=host.current;const tracked=[];const keep=x=>(tracked.push(x),x);
  try{
   const scene=new THREE.Scene();scene.background=new THREE.Color('#080b13');scene.fog=new THREE.FogExp2('#080b13',.006);
   const camera=new THREE.PerspectiveCamera(42,1,.1,220);camera.position.set(0,29,24);
   renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setSize(el.clientWidth,el.clientHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;el.appendChild(renderer.domElement);
   controls=new OrbitControls(camera,renderer.domElement);controlRef.current=controls;controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=false;controls.minDistance=14;controls.maxDistance=58;controls.minPolarAngle=.08;controls.maxPolarAngle=Math.PI*.47;controls.saveState();
   composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new THREE.Vector2(el.clientWidth,el.clientHeight),.65,.7,.82);composer.addPass(bloom);
   const starVertices=[];let rng=713;const random=()=>{rng=(rng*16807)%2147483647;return (rng-1)/2147483646};for(let i=0;i<1800;i++){starVertices.push((random()-.5)*155,(random()-.5)*100-10,(random()-.5)*155)}
   const sg=keep(new THREE.BufferGeometry());sg.setAttribute('position',new THREE.Float32BufferAttribute(starVertices,3));const sm=keep(new THREE.PointsMaterial({color:'#aeb6dd',size:.065,sizeAttenuation:true,transparent:true,opacity:.68}));scene.add(new THREE.Points(sg,sm));
   const sphere=keep(new THREE.SphereGeometry(1,48,32));
   function world(color,seed,sun=0){const group=new THREE.Group();const material=keep(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,uniforms:{baseColor:{value:new THREE.Color(color)},time:{value:0},seed:{value:seed},sun:{value:sun}}}));const mesh=new THREE.Mesh(sphere,material);group.add(mesh);const at=keep(new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:atmosphereFragment,uniforms:{baseColor:{value:new THREE.Color(color)},strength:{value:sun?2:1.4}},transparent:true,side:THREE.BackSide,blending:THREE.AdditiveBlending,depthWrite:false}));const halo=new THREE.Mesh(sphere,at);halo.scale.setScalar(1.12);group.add(halo);scene.add(group);return {group,mesh,material,at};}
   const core=world('#ffc983',1,1);core.group.scale.setScalar(.85);
   const circlePoints=r=>Array.from({length:161},(_,i)=>new THREE.Vector3(Math.cos(i/160*Math.PI*2)*r,0,Math.sin(i/160*Math.PI*2)*r));
   const worlds=ventures.map((v,i)=>{
    const body=world(v.color,3+i*11);const orbitGeometry=keep(new THREE.BufferGeometry().setFromPoints(circlePoints(1)));const orbitMaterial=keep(new THREE.LineBasicMaterial({color:v.color,transparent:true,opacity:.11}));const orbit=new THREE.LineLoop(orbitGeometry,orbitMaterial);scene.add(orbit);
    const loadRingGeometry=keep(new THREE.RingGeometry(1.35,1.38,96));const loadRingMaterial=keep(new THREE.MeshBasicMaterial({color:v.color,side:THREE.DoubleSide,transparent:true,opacity:.45,depthWrite:false}));const loadRing=new THREE.Mesh(loadRingGeometry,loadRingMaterial);loadRing.rotation.x=-Math.PI/2;body.group.add(loadRing);
    const moonGroup=new THREE.Group();body.group.add(moonGroup);v.projects.forEach((p,j)=>{const moon=new THREE.Mesh(keep(new THREE.SphereGeometry(.095,12,8)),keep(new THREE.MeshBasicMaterial({color:v.color})));moon.userData.project=p;moonGroup.add(moon)});
    body.mesh.userData.ventureId=v.id;return {...body,orbit,orbitMaterial,moonGroup,loadRing,loadRingMaterial,id:v.id,i,distance:4+i*1.55,angle:angles[i%angles.length],size:.6};
   });
   const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
   const pointerDown=e=>{down=[e.clientX,e.clientY]};const pointerUp=e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hit=raycaster.intersectObjects(worlds.map(w=>w.mesh))[0];if(hit)live.current.onSelect(hit.object.userData.ventureId)};
   renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);
   const onLost=e=>{e.preventDefault();cancelAnimationFrame(frame);setFailed(true)};renderer.domElement.addEventListener('webglcontextlost',onLost);
   resize=new ResizeObserver(()=>{if(disposed)return;const w=el.clientWidth,h=el.clientHeight;camera.aspect=w/h;camera.zoom=Math.min(1,Math.max(.56,camera.aspect/1.15));camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h)});resize.observe(el);
   let t=0,last=0;const pos=new THREE.Vector3();
   function animate(ms){if(disposed)return;frame=requestAnimationFrame(animate);if(document.hidden){last=ms;return}const dt=Math.min((ms-last)/1000,.04);last=ms;if(!live.current.paused)t+=dt;controls.update();const st=live.current,ordered=rank(st.ventures,st.tasks,st.lens);
    core.material.uniforms.time.value=t;core.mesh.rotation.y=t*.08;
    for(const w of worlds){const v=st.ventures.find(x=>x.id===w.id);if(!v)continue;const index=ordered.findIndex(x=>x.id===w.id),value=lensScore(v,st.tasks,st.lens),count=openTasks(v,st.tasks).length;const normalized=st.lens==='tasks'?Math.min(value/10,1):value/100;const targetDistance=v.status==='park'?13.2+(w.i%2)*1.1:4.2+index*1.52;w.distance=THREE.MathUtils.lerp(w.distance,targetDistance,.025);w.size=THREE.MathUtils.lerp(w.size,.46+normalized*.68,.035);const a=w.angle+Math.sin(t*.025+w.i)*.055;w.group.position.set(Math.cos(a)*w.distance,Math.sin(t*.3+w.i)*.07,Math.sin(a)*w.distance);w.group.scale.setScalar(w.size);w.mesh.rotation.y=t*(.065+v.scores.urgency*.008);w.material.uniforms.time.value=t;w.orbit.scale.setScalar(w.distance);w.orbitMaterial.opacity=w.id===st.selected?.27:.075;w.loadRingMaterial.opacity=w.id===st.selected?.8:.35;w.loadRing.scale.setScalar(1+count*.018);w.at.uniforms.strength.value=.7+v.scores.mental*.12;w.moonGroup.visible=w.id===st.selected;w.moonGroup.children.forEach((m,j)=>{const ma=t*.13+j*Math.PI*2/w.moonGroup.children.length;m.position.set(Math.cos(ma)*2.15,.18,Math.sin(ma)*2.15)});
     const label=labelRefs.current[w.id];if(label){pos.copy(w.group.position);pos.y+=w.size+ .55;pos.project(camera);label.style.transform=`translate(-50%, -100%) translate(${Math.round(THREE.MathUtils.clamp((pos.x*.5+.5)*el.clientWidth,label.offsetWidth/2+8,el.clientWidth-label.offsetWidth/2-8))}px,${Math.round(THREE.MathUtils.clamp((-pos.y*.5+.5)*el.clientHeight,130,el.clientHeight-45))}px)`;label.style.visibility=pos.z>1?'hidden':'visible';label.style.zIndex=String(Math.round((1-pos.z)*100));}
    }
    const coreLabel=labelRefs.current.core;if(coreLabel){pos.set(0,1.1,0).project(camera);coreLabel.style.transform=`translate(-50%, -50%) translate(${(pos.x*.5+.5)*el.clientWidth}px,${(-pos.y*.5+.5)*el.clientHeight+45}px)`;}composer.render();
   }frame=requestAnimationFrame(animate);
   return ()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();controlRef.current=null;renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',onLost);tracked.forEach(x=>x.dispose());bloom.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();};
  }catch(e){setFailed(true);cancelAnimationFrame(frame);resize?.disconnect();controls?.dispose();composer?.dispose();renderer?.dispose();renderer?.domElement?.remove();tracked.forEach(x=>x.dispose());console.warn('3D view unavailable; the venture list remains available.',e.message);}
 },[ids]);
 return <div className="scene-host" ref={host} aria-label="Interactive 3D venture map">
 {failed?<div className="scene-fallback"><span>THE MAP IS STILL YOURS</span><h2>3D isn’t available on this device.</h2><p>Use the venture list and Priority view to explore the same rankings and next moves.</p></div>:<div className="planet-labels">{ventures.map(v=><button className={'planet-label '+(selected===v.id?'selected':'')} style={{'--world':v.color}} key={v.id} ref={e=>labelRefs.current[v.id]=e} onClick={()=>onSelect(v.id)} aria-pressed={selected===v.id}><span>{v.short}</span><small>{v.status==='park'?'PARKED':openTasks(v,tasks).length+' OPEN'}</small></button>)}<div className="core-label" ref={e=>labelRefs.current.core=e}>AMAR PEARSON<small>YOUR ATTENTION IS FINITE</small></div></div>}
 </div>
}
