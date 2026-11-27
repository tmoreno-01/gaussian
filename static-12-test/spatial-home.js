/* LifeAfterLogic — interactive Gaussian-splat homepage
   Six public 3D captures arranged as a slowly orbiting spatial study.
   The scene data remains volumetric; no video panels or image cards are used. */
(() => {
  "use strict";

  const home = document.getElementById("home");
  const canvasRoot = document.getElementById("spatial-canvas-root");
  const errorBox = document.getElementById("spatial-error");
  if (!home || !canvasRoot || !errorBox) return;
  const signal = name => window.dispatchEvent(new Event("lifeafterlogic:" + name));

  const originalCaptures = [
    { id: "3582f3b0-565e-443f-9165-3571c0721fbc", scale: .62, y: -.14, tilt: -.035 },
    { id: "1a487b86-38a7-466d-856b-5d9ad2f84fab", scale: .64, y: .22, tilt: .045 },
    { id: "b101171b-cf5f-4669-ab44-d9fa39e69898", scale: .60, y: -.28, tilt: .025 },
    { id: "9c6e8bac-3b79-4f39-a605-58999d33c33c", scale: .72, y: .30, tilt: -.055 },
    { id: "94f2efd7-f65d-4b7f-b455-536e95643bad", scale: .60, y: -.10, tilt: .035 },
    { id: "3adabd81-8ef0-4257-92cb-a2929ef8aa8a", scale: .68, y: .16, tilt: -.025 }
  ];

  // Never fill missing slots with duplicate captures.
  const seen = new Set(originalCaptures.map(c=>c.id.toLowerCase()));
  const overrides = new URLSearchParams(location.search).getAll("capture").map(value=>{
    const m=value.match(/^(?:https:\/\/lumalabs\.ai\/capture\/)?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i);
    return m ? m[1].toLowerCase() : null;
  }).filter(id=>{if(!id||seen.has(id))return false;seen.add(id);return true;}).slice(0,6);
  const extras = overrides.map((id,j)=>({
    id, scale:[.46,.54,.48,.58,.44,.52][j],
    y:[1.18,.92,1.42,1.05,1.25,.84][j],
    tilt:[.11,-.08,.06,-.13,.09,-.05][j], outer:true
  }));
  const sixOnly = new URLSearchParams(location.search).get("count") === "6" || extras.length===0;
  const captures = originalCaptures;
  const countLabel = document.getElementById("capture-count");
  if(countLabel)countLabel.textContent = "Loading graffiti captures…";
  const touchDevice = matchMedia("(any-pointer: coarse)").matches;
  const allLocalSlots = [{"id":"f0137e7f","name":"Freeman Alley","author":"matousekfoto","url":"https://superspl.at/scene/f0137e7f","licensed":true},{"id":"f4897475","name":"Artillery Passage","author":"David Fletcher","url":"https://superspl.at/scene/f4897475","licensed":true,"fullDetail":true,"orientation":"z-flip"},{"id":"suvilahti-skatepark","name":"Suvilahti DIY — cropped skatepark","author":"flyAR","url":"https://flyar.fi/work/suvilahti-diy-project-eternal","localOnly":true,"fullDetail":true,"orientation":"none"}];
  const localSlots = touchDevice ? allLocalSlots.filter(item => !item.fullDetail) : allLocalSlots;
  // A new spatial composition, not just a shuffled ring. Each model is
  // assigned a fresh size role independently of identity on every reload.
  const random=()=>Math.random(),between=(a,b)=>a+(b-a)*random();
  const targetCount=originalCaptures.length+localSlots.length;
  const modes=["broken orbit","dense cluster","wide constellation","layered islands"];
  const mode=modes[Math.floor(random()*modes.length)],phase=between(0,Math.PI*2),orbitSpeed=.035;
  const layoutTilt=0;
  // Vary the overall composition scale too, rather than always having the
  // same size distribution. Keep a reasonable floor for secondary pieces.
  const scaleMood=between(1.00,1.30);
  const roles=Array.from({length:targetCount},(_,i)=>
    (i<2?between(2.75,4.05):i<5?between(2.05,3.35):between(1.45,2.45))*scaleMood);
  
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  shuffle(roles);
  const order=shuffle(Array.from({length:targetCount},(_,i)=>i));
  function makePose(i){
    const k=order[i%targetCount],a=phase+k/targetCount*Math.PI*2+between(-.17,.17);
    let radius,y,x,z;
    if(mode==="dense cluster"){radius=between(1.6,3.2);y=between(-.34,.34);}
    else if(mode==="wide constellation"){radius=between(2.5,4.4);y=between(-.55,.55);}
    else if(mode==="layered islands"){radius=k%3===0?between(1.4,2.4):between(2.8,4.1);y=between(-.45,.45);}
    else{radius=between(2.4,4.0);y=between(-.30,.30);}
    x=Math.sin(a)*radius;z=Math.cos(a)*radius;
    return {x,y,z,yaw:a+Math.PI+between(-.95,.95),pitch:between(-.095,.095),roll:between(-.075,.075),scale:roles[i%targetCount]};
  }
  const poses=Array.from({length:targetCount},(_,i)=>makePose(i));
  function captureScale(id,role){
    // Small foreground-only lamp-post accent.
    if(id==="9c6e8bac-3b79-4f39-a605-58999d33c33c"){
      return random()<.18?between(1.85,2.35):Math.min(1.85,role*between(.55,.80));
    }
    // The alley's narrow geometry needs a substantial footprint.
    if(id==="f0137e7f")return Math.min(6.2,Math.max(3.1,role*between(1.28,1.62)));
    if(id==="suvilahti-skatepark")return .8*Math.min(4.6,Math.max(3.6,role*1.55));
    if(id==="f4897475")return Math.min(6.2,Math.max(4.4,role*1.85));
    return Math.min(5.35,role*between(.96,1.20));
  }
  // Sample each model's scale once: opening camera selection and loading
  // must use the very same random composition.
  const assignedScales=new Map([...originalCaptures,...localSlots].map((item,i)=>[
    item.id,captureScale(item.id,poses[i].scale)*(item.scale?item.scale*1.40:1)
  ]));
  // Cheap projected wall proxies choose a strong opening view before any
  // models stream in. They are framing estimates, not asset bounding boxes.
  // No extra fetches, render passes or GPU readbacks are needed.
  function openingView(aspect){
    const aspectFactor=Math.max(1,.66/aspect),vertical=Math.tan(43*Math.PI/360);
    const samples=[...originalCaptures,...localSlots].map((item,i)=>{
      const lamp=item.id==="9c6e8bac-3b79-4f39-a605-58999d33c33c",alley=item.id==="f0137e7f",artillery=item.id==="f4897475";
      return {pose:poses[i],scale:assignedScales.get(item.id),w:lamp?1.12:alley?2.65:artillery?2.75:1.95,h:lamp?1.65:alley?1.55:artillery?1.75:1.35,lamp};
    });
    const candidates=[],start=between(0,Math.PI*2);
    for(let i=0;i<24;i++){
      const angle=start+i*Math.PI*2/24;
      for(const distance of [9.2,10,10.8,11.6,12.4,13.2,14,14.8,15.6].map(x=>x*aspectFactor)){
        const cx=Math.sin(angle)*distance,cz=Math.cos(angle)*distance,cy=distance*.30;
        const l=Math.hypot(distance,cy),sin=Math.sin(angle),cos=Math.cos(angle);
        const rects=[];let penalty=0;
        for(const o of samples){
          const {pose:q,scale,w,h}=o;
          const dx=q.x-cx,dy=q.y-cy,dz=q.z-cz;
          const depth=(-dx*sin*distance-dy*cy-dz*cos*distance)/l;
          if(depth<1.6){penalty+=1.5;continue;}
          const x=(dx*cos-dz*sin)/(depth*vertical*aspect);
          const y=(-dx*sin*cy+dy*distance-dz*cos*cy)/(l*depth*vertical);
          const face=Math.max(.16,Math.abs(Math.cos(q.yaw-angle)));
          const hw=scale*w*face/(2*depth*vertical*aspect),hh=scale*h/(2*depth*vertical);
          rects.push({x,y,hw,hh});
          // Avoid a single giant foreground fragment overwhelming the opening.
          penalty+=Math.max(0,hw-1.15)*.07+Math.max(0,hh-1.15)*.07;
        }
        let filled=0,centerFilled=0,centerTotal=0,edgeFilled=0,edgeTotal=0;
        for(let iy=0;iy<12;iy++)for(let ix=0;ix<20;ix++){
          const x=(ix+.5)/10-1,y=(iy+.5)/6-1;
          const hit=rects.some(r=>Math.abs(x-r.x)<=r.hw&&Math.abs(y-r.y)<=r.hh);
          if(hit)filled++;
          if(Math.abs(x)<.75&&Math.abs(y)<.66){centerTotal++;if(hit)centerFilled++;}
          if(Math.abs(x)>.85||Math.abs(y)>.83){edgeTotal++;if(hit)edgeFilled++;}
        }
        const coverage=filled/240,central=centerFilled/centerTotal,edge=edgeFilled/edgeTotal;
        const score=central*1.20-Math.abs(coverage-.71)*2.35-Math.max(0,edge-.56)*.90-penalty-.018*Math.abs(distance/aspectFactor-10.4);
        candidates.push({angle,distance,score,coverage,central});
      }
    }
    candidates.sort((a,b)=>b.score-a.score);
    const best=candidates.filter(x=>x.score>=candidates[0].score-.065).slice(0,5);
    return best[Math.floor(random()*best.length)];
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = null;
  let loading = false;
  let generation = 0;

  function isHomeVisible() {
    return !home.hidden;
  }

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    console.warn(message);
  }

  function disposeActive() {
    if (!active) return;
    const state = active;
    active = null;
    state.disposed = true;
    if (state.raf) cancelAnimationFrame(state.raf);
    clearTimeout(state.loadingTimeout);
    state.cancelLoading?.();
    window.removeEventListener("resize", state.resize);
    document.removeEventListener("visibilitychange", state.visibility);
    window.removeEventListener("lifeafterlogic:theme-change", state.theme);
    state.controls.dispose();
    state.splats.forEach(splat => {
      try { splat.dispose(); } catch (_) {}
    });
    if(state.sparkRenderer){
      try{state.sparkRenderer.removeFromParent();state.sparkRenderer.geometry.dispose();state.sparkRenderer.material.dispose();}catch(_){}
    }
    state.clearGpuQueue?.();
    state.renderer.renderLists?.dispose();
    state.renderer.dispose();
    state.renderer.domElement.remove();
    canvasRoot.replaceChildren();
  }

  async function startViewer(token) {
    const [THREE, controlsModule, lumaModule] = await Promise.all([
      import("three"),
      import("three/addons/controls/OrbitControls.js"),
      import("@lumaai/luma-web")
    ]);
    let sparkModule=null;
    try{if (!touchDevice) sparkModule=await import("@sparkjsdev/spark");}
    catch(error){console.warn("Spark high-detail renderer unavailable; keeping streamed Luma captures active.",error);}
    if (token !== generation || !isHomeVisible()) return;

    const { OrbitControls } = controlsModule;
    const { LumaSplatsThree, LumaSplatsSemantics } = lumaModule;
    const SparkRenderer=sparkModule?.SparkRenderer,SplatMesh=sparkModule?.SplatMesh;
    const scene = new THREE.Scene();
    const backgroundColor = () => document.documentElement.dataset.theme === "dark" ? 0x030303 : 0xffffff;
    scene.background = new THREE.Color(backgroundColor());

    const camera = new THREE.PerspectiveCamera(43, (canvasRoot.clientWidth || window.innerWidth) / Math.max(1, canvasRoot.clientHeight || window.innerHeight), .05, 120);
    const opening=openingView(camera.aspect),cameraAngle=opening.angle,cameraDistance=opening.distance;
    camera.position.set(Math.sin(cameraAngle)*cameraDistance,cameraDistance*.30,Math.cos(cameraAngle)*cameraDistance);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
    // Start at a useful resolution, then tune to the actual device under load.
    let quality = touchDevice ? .85 : 1;
    const minQuality = touchDevice ? .52 : .58;
    let appliedRatio = 0;
    let viewWidth = 0, viewHeight = 0;
    function applyResolution(force = false) {
      const width = Math.max(1, canvasRoot.clientWidth || window.innerWidth);
      const height = Math.max(1, canvasRoot.clientHeight || window.innerHeight);
      // Limit fragment work on Retina phones and very large desktop displays.
      const pixelBudget = touchDevice ? 720000 : 2200000;
      const ceiling = Math.min(window.devicePixelRatio || 1, touchDevice ? 1.1 : 1.45, Math.sqrt(pixelBudget / (width * height)));
      const ratio = Math.max(.35, Math.round(ceiling * quality * 20) / 20);
      if (force || width !== viewWidth || height !== viewHeight || Math.abs(ratio - appliedRatio) >= .049) {
        viewWidth = width; viewHeight = height; appliedRatio = ratio;
        renderer.setDrawingBufferSize(width, height, ratio);
      }
    }
    applyResolution(true);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(backgroundColor(), 1);
    renderer.domElement.setAttribute("aria-label", "Interactive Gaussian splat scenes. Drag to orbit and scroll to zoom.");
    canvasRoot.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    // Shorter inertia tail makes drag/pan respond sooner and settle faster.
    controls.dampingFactor = touchDevice ? .13 : .105;
    controls.enablePan = true;
    controls.minDistance = 3.0;
    controls.maxDistance = Math.max(28,cameraDistance*1.8);
    controls.minPolarAngle = .35;
    controls.maxPolarAngle = Math.PI - .35;
    controls.rotateSpeed = .48;
    controls.zoomSpeed = .62;
    controls.panSpeed = .45;

    const orbit = new THREE.Group();
    scene.add(orbit);orbit.rotation.x=layoutTilt;

    const state = {
      renderer, controls, splats: [], raf: 0, disposed: false,
      loadingTimeout: 0, resize: null, visibility: null, theme: null,
      sparkRenderer: null
    };
    active = state;
    let needsRender = true;
    const sparkRenderer = SparkRenderer ? new SparkRenderer({
      renderer,
      pagedExtSplats: true,
      lodSplatScale: touchDevice ? .95 : 1.30,
      minSortIntervalMs: 100,
      onDirty: () => {
        if(state.disposed)return;
        needsRender = true;
        if(!state.raf)animate();
      }
    }) : null;
    if(sparkRenderer){scene.add(sparkRenderer);state.sparkRenderer=sparkRenderer;}
    const localMeshes = new Map(), usedFiles = new Set(), lumaHolders=new Map();let originalLoaded=0,solo=new URLSearchParams(location.search).get("solo");
    if(![...captures,...localSlots].some(x=>x.id===solo))solo=null;
    const cleanupEnabled=new URLSearchParams(location.search).get('cleanup')!=='off';
    const lampId="9c6e8bac-3b79-4f39-a605-58999d33c33c";
    function setCaptureFilter(splat,id){
      if((cleanupEnabled||id===lampId)&&LumaSplatsSemantics?.FOREGROUND!==undefined)
        splat.semanticsMask=LumaSplatsSemantics.FOREGROUND;
    }
    // The uploaded skatepark stays on this device until redistribution rights
    // are established. Remember its selected file in IndexedDB.
    async function localPreviewCache(id,file){
      let db;
      try{
        if(!globalThis.indexedDB)return null;
        db=await new Promise((resolve,reject)=>{
          const req=indexedDB.open("graffiti-composition-private-v1",1);
          req.onupgradeneeded=()=>req.result.createObjectStore("previews");
          req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
        });
        return await new Promise((resolve,reject)=>{
          const tx=db.transaction("previews",file?"readwrite":"readonly"),store=tx.objectStore("previews");
          const req=file?store.put(file,id):store.get(id);
          tx.oncomplete=()=>resolve(file?true:req.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
        });
      }catch(e){console.warn("Local preview cache unavailable",e);return null;}finally{db?.close();}
    }
    function applySolo(){for(const [id,holder] of lumaHolders)holder.visible=solo===null||solo===id;for(const [i,entry] of localMeshes)entry.holder.visible=solo===null||solo===localSlots[i].id;needsRender=true;}
    function soloButton(id){const b=document.createElement('button');b.type='button';b.textContent='Solo';b.onclick=()=>{solo=solo===id?null:id;applySolo();};return b;}
    let localBusy = false;
    const importers=[],messages=[];
    const localList = document.getElementById("local-captures");
    function countLocal() {
      if(countLabel) countLabel.textContent = (originalLoaded+localMeshes.size) + " / "+targetCount+" loaded · "+mode;
    }
    function cacheKeyForSlot(item){return item.id==="suvilahti-skatepark"?"suvilahti-skatepark-full-resolution-v2":item.id;}
    if(localList){
      localList.replaceChildren();
      const all=document.createElement("button");all.type="button";all.textContent="Show all captures";all.onclick=()=>{solo=null;applySolo();};localList.append(all);
      const names=["Faraday Street / Bentoghoul","Stevenson Place / July","Faraday Street / June","Graffiti Palace / Lamp post","Faraday Street / April","STIK Door / Brick Lane"];
      originalCaptures.forEach((item,i)=>{const row=document.createElement("div");row.className="capture-row";const a=document.createElement("a");a.href="https://lumalabs.ai/capture/"+item.id;a.textContent=names[i]+" · Luma";a.target="_blank";a.rel="noopener";const btn=soloButton(item.id);row.append(a,btn);
        localList.append(row);});
      for(let i=0;i<localSlots.length;i++){
        const item=localSlots[i], row=document.createElement("div");row.className="capture-row";
        const name=document.createElement(item?"a":"span");name.textContent=item?item.name:"Additional unique scan "+(i-3);
        if(item){name.href=item.url;name.target="_blank";name.rel="noopener noreferrer";name.title=item.author+" — source";if(item.licensed)name.textContent+=" · "+item.author+(item.fullDetail?" (CC BY 4.0, full-detail source)":" (CC BY 4.0, reduced preview)");}
        const input=document.createElement("input");input.type="file";input.accept=".ply";input.setAttribute("aria-label","Select "+name.textContent+" PLY");if(item.id==="f4897475")input.hidden=true;
        const msg=document.createElement("small");msg.textContent=item?.id==="suvilahti-skatepark"?"Select original skateparkdeleted.ply (364 MB) for full detail":item?.id==="f4897475"?"Original 5M Gaussian source · streamed detail":"Choose downloaded standard PLY";
        const flip=document.createElement("button");flip.type="button";flip.textContent="Flip Y";flip.disabled=true;
        flip.onclick=()=>{const mesh=localMeshes.get(i)?.mesh;if(mesh){mesh.scale.y*=-1;needsRender=true;}};
        const yaw=document.createElement("button");yaw.type="button";yaw.textContent="Turn 90°";yaw.disabled=true;
        yaw.onclick=()=>{const mesh=localMeshes.get(i)?.mesh;if(mesh){mesh.rotation.y+=Math.PI/2;needsRender=true;}};
        const cacheKey=item?.id==="suvilahti-skatepark"?"suvilahti-skatepark-full-resolution-v2":item?.id;
        const removeLocalEntry=index=>{
          const old=localMeshes.get(index);if(!old)return;
          orbit.remove(old.holder);
          const oldSplats=old.sparkMeshes||[old.mesh];
          oldSplats.forEach(splat=>{try{splat?.dispose?.();}catch(_){}});
          state.splats=state.splats.filter(splat=>!oldSplats.includes(splat));
          usedFiles.delete(old.key);localMeshes.delete(index);
        };
        const importFile=async(file)=>{
          if(!file)return false;
          if(localBusy){msg.textContent="Finish the current import first";input.value="";return;}
          const key=file.name+":"+file.size;
          if(usedFiles.has(key)&&localMeshes.get(i)?.key!==key){msg.textContent="This file is already in the composition";input.value="";return;}
          if(captures.length+localMeshes.size>=targetCount&&!localMeshes.has(i)){msg.textContent=targetCount+" capture limit reached";return;}
          localBusy=true;input.disabled=true;msg.textContent="Reading full-resolution Gaussian PLY…";
          try{
            if(item?.id==="suvilahti-skatepark"){
              if(!SplatMesh)throw Error("Spark renderer did not load; the other captures are still available.");
              const mesh=new SplatMesh({
                stream:file.stream(),streamLength:file.size,fileName:file.name,
                lod:"quality",extSplats:true,
                onProgress:event=>{if(event.lengthComputable)msg.textContent="Decoding original scan · "+Math.round(event.loaded/event.total*100)+"%";}
              });
              mesh.lodScale=touchDevice?.90:1.25;
              await mesh.initialized;
              if(state.disposed){mesh.dispose();return false;}
              removeLocalEntry(i);
              const holder=new THREE.Group(),normalize=new THREE.Group();
              const poseIndex=captures.length+i,pose=poses[poseIndex];
              holder.position.set(pose.x,pose.y,pose.z);holder.rotation.set(pose.pitch,pose.yaw,pose.roll);
              holder.scale.setScalar(assignedScales.get(item.id));
              normalize.scale.setScalar(.07404674);
              normalize.position.set(.000436,.0324,-.000989);
              normalize.add(mesh);holder.add(normalize);orbit.add(holder);
              state.splats.push(mesh);localMeshes.set(i,{mesh:normalize,holder,key,poseIndex,sparkMeshes:[mesh]});usedFiles.add(key);applySolo();
              needsRender=true;countLocal();updateProgress();flip.disabled=yaw.disabled=false;
              const n=mesh.splats?.getNumSplats?.()||1543464;
              msg.textContent=n.toLocaleString()+" full-resolution Gaussians · spherical harmonics · adaptive LOD";
              return true;
            }
            const {readPly,makeGaussian}=await import("./local-gaussians.js?v=skatepark-density-3");
            const data=await readPly(file,touchDevice?140000:320000,cleanupEnabled);
            if(state.disposed)return false;
            const mesh=makeGaussian(THREE,data,item.orientation||"x-flip",item.splatSize||1,item.opacityBoost||1);
            removeLocalEntry(i);
            const holder=new THREE.Group(),poseIndex=captures.length+i,pose=poses[poseIndex];
            holder.position.set(pose.x,pose.y,pose.z);holder.rotation.set(pose.pitch,pose.yaw,pose.roll);
            holder.scale.setScalar(assignedScales.get(item.id));
            holder.add(mesh);orbit.add(holder);state.splats.push(mesh);localMeshes.set(i,{mesh,holder,key,poseIndex});usedFiles.add(key);applySolo();
            needsRender=true;countLocal();updateProgress();flip.disabled=yaw.disabled=false;
            msg.textContent=data.count.toLocaleString()+" / "+data.sourceCount.toLocaleString()+" Gaussians"+(data.removed?" · "+data.removed.toLocaleString()+" floaters filtered":"");return true;
          }catch(err){msg.textContent=err.message||String(err);return false;}finally{localBusy=false;input.disabled=false;input.value="";}
        };
        input.onchange=async()=>{const file=input.files?.[0];if(await importFile(file)&&item.localOnly){const cached=await localPreviewCache(cacheKey,file);msg.textContent+=cached?" · full source remembered on this device":" · local only";}};importers.push(importFile);
        messages.push(msg);row.append(name,input,flip,yaw,soloButton(item.id),msg);localList.append(row);
      }
    }
    const bulk=document.getElementById("bulk-ply"), bulkStatus=document.getElementById("bulk-status");
    const aliases=[/freeman|f0137e7f/i,/artillery|f4897475/i,/suvilahti|skatepark/i];
    if(bulk)bulk.onchange=async()=>{
      if(localBusy)return;
      const files=Array.from(bulk.files||[]), unknown=[], matched=new Map(), ambiguous=[];
      for(const file of files){
        const hits=aliases.map((r,i)=>r.test(file.name)?i:-1).filter(i=>i>=0);
        if(hits.length!==1 || hits[0]>=localSlots.length){unknown.push(file.name);continue;}
        const i=hits[0];if(matched.has(i)){ambiguous.push(i);continue;}matched.set(i,file);
      }
      for(const i of ambiguous)matched.delete(i);
      bulk.disabled=true;let loaded=0;
      try{
        for(const [i,file] of matched){bulkStatus.textContent="Importing "+localSlots[i].name+"…";if(await importers[i](file)){loaded++;if(localSlots[i].localOnly)await localPreviewCache(cacheKeyForSlot(localSlots[i]),file);}}
        bulkStatus.textContent=loaded+" imported. "+(unknown.length||ambiguous.length?"Unmatched or ambiguous filenames: select their named slots manually.":"");
      }finally{bulk.disabled=false;bulk.value="";}
    };
    countLocal();

    // Models prepared from public, downloadable CC BY sources. Raw repository
    // fallback also works when a bot commit does not trigger a Pages rebuild.
    async function loadHostedModels(){
      for(let i=0;i<localSlots.length;i++){
        if(state.disposed)return;
        if(localMeshes.has(i)||captures.length+localMeshes.size>=targetCount)continue;
        const id=localSlots[i].id;
        if(localSlots[i].localOnly){
          const cacheKey=cacheKeyForSlot(localSlots[i]);
          if(messages[i])messages[i].textContent="Select original skateparkdeleted.ply (364 MB) once · full 1.54M source, cached privately on this device.";
          const file=await localPreviewCache(cacheKey);
          if(file&&!state.disposed&&!localMeshes.has(i)){
            while(localBusy&&!state.disposed)await new Promise(r=>setTimeout(r,100));
            if(!state.disposed&&!localMeshes.has(i)&&await importers[i](file)&&messages[i])messages[i].textContent+=" · original remembered locally";
          }
          continue;
        }
        if(id==="f4897475"){
          if(!SplatMesh){if(messages[i])messages[i].textContent="Spark renderer unavailable · other captures remain active";continue;}
          if(messages[i])messages[i].textContent="Loading original 5M-Gaussian scan · high-detail streamed LOD…";
          const holder=new THREE.Group(),normalize=new THREE.Group(),meshes=[];
          const poseIndex=captures.length+i,pose=poses[poseIndex];
          holder.position.set(pose.x,pose.y,pose.z);holder.rotation.set(pose.pitch,pose.yaw,pose.roll);
          holder.scale.setScalar(assignedScales.get(id));
          const factor=4.2/14.938400268554688;
          const center={x:-.388,y:-.971,z:-.666};
          normalize.scale.setScalar(factor);
          normalize.rotation.z=Math.PI;
          normalize.position.set(center.x*factor,center.y*factor,-center.z*factor);
          holder.add(normalize);orbit.add(holder);
          try{
            for(let j=0;j<5;j++){
              const url="./models/artillery/artillery-0_"+j+"-lod.rad";
              const mesh=new SplatMesh({url,paged:true,lodScale:touchDevice?.95:1.25});
              await mesh.initialized;
              if(state.disposed){mesh.dispose();return;}
              normalize.add(mesh);meshes.push(mesh);state.splats.push(mesh);
              if(messages[i])messages[i].textContent="Artillery Passage · "+(j+1)+"/5 full-detail regions ready";
              needsRender=true;if(!state.raf)animate();
            }
            localMeshes.set(i,{mesh:normalize,holder,key:"artillery-full-rad-v1",poseIndex,sparkMeshes:meshes});
            usedFiles.add("artillery-full-rad-v1");applySolo();countLocal();updateProgress();
            if(messages[i])messages[i].textContent="5M-source scan · streamed detail · CC BY 4.0";
          }catch(error){
            orbit.remove(holder);meshes.forEach(mesh=>{try{mesh.dispose();}catch(_){}});
            state.splats=state.splats.filter(mesh=>!meshes.includes(mesh));
            if(messages[i])messages[i].textContent="High-detail Artillery load failed · "+(error.message||String(error));
          }
          continue;
        }
        if(messages[i])messages[i].textContent="Checking automatic preview…";
        try{
          // A previous 404 can be cached by the browser/CDN even after a new
          // model is deployed. Use no-store plus an immutable commit URL, and
          // try two public CDNs before reporting a genuine failure.
          const revision="33876eef1fdfc9f95c13b80e84e3b5838b67f64f";
          const localUrl=new URL("./models/"+id+".ply",location.href);
          localUrl.searchParams.set("rev",revision.slice(0,8));
          const urls=[
            localUrl.href,
            "https://cdn.jsdelivr.net/gh/tmoreno-01/gaussian@"+revision+"/static-12-test/models/"+id+".ply?rev="+revision.slice(0,8),
            "https://raw.githubusercontent.com/tmoreno-01/gaussian/"+revision+"/static-12-test/models/"+id+".ply?rev="+revision.slice(0,8)
          ];
          let blob=null;const fetchErrors=[];
          for(const url of urls){
            try{
              const response=await fetch(url,{cache:"default",credentials:"omit",mode:"cors",signal:AbortSignal.timeout(45000)});
              if(!response.ok){fetchErrors.push(new URL(url).hostname+" returned HTTP "+response.status);continue;}
              const type=response.headers.get("content-type")||"";
              if(type.includes("text/html")){fetchErrors.push(new URL(url).hostname+" returned HTML instead of a PLY");continue;}
              const candidate=await response.blob();
              if(candidate.size<1000000){fetchErrors.push(new URL(url).hostname+" returned an unexpectedly small file");continue;}
              blob=candidate;break;
            }catch(error){fetchErrors.push(new URL(url).hostname+": "+(error.message||String(error)));}
          }
          if(!blob)throw Error("Preview download failed · "+fetchErrors.join(" · "));
          if(state.disposed)return;
          if(localMeshes.has(i))continue;
          while(localBusy&&!state.disposed)await new Promise(r=>setTimeout(r,100));
          if(state.disposed||localMeshes.has(i))continue;
          const ok=await importers[i](new File([blob],id+".ply",{type:"application/octet-stream"}));
          if(ok&&messages[i])messages[i].textContent+=" · automatic · CC BY 4.0";
        }catch(e){if(messages[i]&&!localMeshes.has(i))messages[i].textContent="Automatic preview unavailable · "+e.message;}
      }

    }

    let nextIndex = 0;
    let inFlight = 0;
    let completed = 0;
    let failed = 0;
    let revealed = false;
    let revealPending = false;
    const openingStarted=performance.now();
    let loadTimer = 0;
    state.cancelLoading = () => clearTimeout(loadTimer);
    function revealScene() {
      if (revealed || state.disposed) return;
      revealed = true;
      signal("spatial-ready");
    }
    state.theme = () => {
      scene.background.set(backgroundColor());
      renderer.setClearColor(backgroundColor(), 1);
      needsRender = true;
    };
    window.addEventListener("lifeafterlogic:theme-change", state.theme);
    let interacting = false;
    let lastInteraction = 0;
    let lastCameraChange = performance.now();
    let lastRenderedAt = 0, nextDue = 0;
    let previousTick = 0;
    let tickInterval = 1000 / 60;
    let pendingResolution = false;
    if(new URLSearchParams(location.search).get("count")!=="6")setTimeout(loadHostedModels,1500);
    const targetInterval = 1000 / 60;
    let sampleStart = 0, renderedFrames = 0, blockedFrames = 0, cpuCost = 0, longTicks = 0, tickCount = 0;
    let stableWindows = 0, lastResize = 0;
    function resetStats(now = performance.now()) {
      sampleStart = now;
      renderedFrames = blockedFrames = cpuCost = longTicks = tickCount = 0;
    }
    function assessQuality(now, busy) {
      const elapsed = now - sampleStart;
      if (elapsed < (busy ? 480 : 1100)) return;
      const attempts = renderedFrames + blockedFrames;
      if (attempts < 5) { resetStats(now); return; }
      const backlog = blockedFrames / attempts;
      const meanCpu = renderedFrames ? cpuCost / renderedFrames : 0;
      const expected = 1000 / Math.max(targetInterval, Math.min(33.4, tickInterval));
      const fps = renderedFrames * 1000 / elapsed;
      const slow = backlog > .19 || meanCpu > 14 || (fps < expected * .78 && longTicks > tickCount * .15);
      const headroom = backlog < .035 && meanCpu < 9 && fps >= expected * .87 && longTicks < tickCount * .12;
      if (slow) {
        stableWindows = 0;
        // A larger reduction is preferable to resizing the canvas repeatedly.
        const next = Math.max(minQuality, quality - (backlog > .40 || meanCpu > 22 ? .16 : .09));
        if (next < quality && now - lastResize > 500) { quality = next; pendingResolution = true; lastResize = now; }
      } else {
        stableWindows = headroom ? stableWindows + 1 : 0;
        // Never raise resolution in the middle of a gesture; restore detail gradually.
        if (!busy && stableWindows >= 3 && quality < 1 && now - lastResize > 2600) {
          quality = Math.min(1, quality + .07);
          pendingResolution = true;
          lastResize = now;
          stableWindows = 0;
        }
      }
      resetStats(now);
    }
    resetStats();
    const gl = renderer.getContext();
    const gpuQueue = [];
    let useFences = renderer.capabilities.isWebGL2 && typeof gl.fenceSync === "function";
    // Never block the main thread waiting for the GPU. Bound queued work
    // to keep camera input responsive and adapt resolution to measured load.
    function clearGpuQueue() {
      for (const fence of gpuQueue.splice(0)) { try { gl.deleteSync(fence); } catch (_) {} }
    }
    state.clearGpuQueue = clearGpuQueue;
    function gpuAvailable() {
      if (!useFences) return true;
      try {
        while (gpuQueue.length) {
          const result = gl.clientWaitSync(gpuQueue[0], 0, 0);
          if (result === gl.TIMEOUT_EXPIRED) break;
          if (result === gl.WAIT_FAILED) { useFences = false; clearGpuQueue(); return true; }
          gl.deleteSync(gpuQueue.shift());
        }
        // Two in-flight frames permit CPU/GPU overlap without a deep input queue.
        return gpuQueue.length < 2;
      } catch (_) { useFences = false; clearGpuQueue(); return true; }
    }
    function submitFrame() {
      if (!useFences) return;
      try {
        const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (fence) gpuQueue.push(fence);
        else { useFences = false; clearGpuQueue(); }
      } catch (_) { useFences = false; clearGpuQueue(); }
    }
    controls.addEventListener("change", () => { lastCameraChange = performance.now(); needsRender = true; });

    function updateProgress() {
      // Prefer a composed opening rather than exposing the first isolated scan.
      // Keep the fallback bounded so a slow stream cannot trap the loader.
      const ready=originalLoaded+localMeshes.size;
      if(!revealed&&(ready>=4||(ready>0&&performance.now()-openingStarted>8500)||completed===captures.length))revealPending=true;
      if (completed === captures.length) {
        clearTimeout(state.loadingTimeout);
        if (failed) showError(failed + " public captures could not load.");
      }
    }

    function finishCapture(error) {
      if (state.disposed) return;
      inFlight = Math.max(0, inFlight - 1);
      completed++;
      needsRender = true;
      if (error) failed++;else originalLoaded++;
      countLocal();updateProgress();
      // Yield between capture initialisations so decoding and GPU uploads do
      // not repeatedly interrupt touch input or the loading animation.
      if (!loadTimer && nextIndex < captures.length) {
        loadTimer = window.setTimeout(() => {
          loadTimer = 0;
          loadQueue();
        }, touchDevice ? 120 : 40);
      }
    }

    function addCapture(item, index) {
      const holder = new THREE.Group(),pose=poses[index];
      holder.position.set(pose.x,pose.y,pose.z);holder.rotation.set(pose.pitch,pose.yaw,pose.roll);holder.scale.setScalar(assignedScales.get(item.id));
      orbit.add(holder);lumaHolders.set(item.id,holder);applySolo();

      const splat = new LumaSplatsThree({
        source: "https://lumalabs.ai/capture/" + item.id,
        loadingAnimationEnabled: false,
        particleRevealEnabled: false,
        enableThreeShaderIntegration: false
      });
      setCaptureFilter(splat,item.id);
      state.splats.push(splat);
      let settled = false;
      const settle = error => {
        if (settled) return;
        settled = true;
        finishCapture(error);
      };
      splat.onLoad = () => {setCaptureFilter(splat,item.id);settle(null);};
      splat.onError = error => {
        console.warn("Gaussian capture failed to load", item.id, error);
        settle(error || new Error("Capture failed"));
      };
      holder.add(splat);
    }

    function loadQueue() {
      if (state.disposed) return;
      // Don't start another decode/upload while a visible scene is being dragged.
      // In-flight captures can finish; the rest resume when input settles.
      if (revealed && (interacting || performance.now() - lastInteraction < 300)) {
        if (!loadTimer && nextIndex < captures.length) loadTimer = window.setTimeout(() => {
          loadTimer = 0;
          loadQueue();
        }, 300);
        return;
      }
      const concurrency = touchDevice ? 1 : 2;
      while (inFlight < concurrency && nextIndex < captures.length) {
        const index = nextIndex++;
        inFlight++;
        try {
          addCapture(captures[index], index);
        } catch (error) {
          console.warn("Could not initialise Gaussian capture", error);
          finishCapture(error);
        }
      }
    }

    function animate(now = performance.now()) {
      state.raf = 0;
      if (state.disposed || document.hidden || gl.isContextLost()) return;
      state.raf = requestAnimationFrame(animate);
      const tickGap = previousTick ? now - previousTick : 0;
      previousTick = now;
      if (tickGap > 0 && tickGap < 45) tickInterval += (tickGap - tickInterval) * .10;

      // Finish the damping motion before the independent scene orbit resumes.
      const responsive = interacting || now - lastCameraChange < 320;
      const moving = revealed && !reducedMotion.matches && !responsive && now - lastInteraction > 4200;
      const loadingScene = completed < captures.length;
      if(!revealed&&originalLoaded+localMeshes.size>0&&now-openingStarted>8500)revealPending=true;
      const continuous = responsive || moving || loadingScene;
      if (!continuous && !needsRender && !pendingResolution) {
        resetStats(now);
        nextDue = 0;
        return;
      }

      // The old 60Hz gate could miss a display refresh on a slightly early RAF.
      // Quantise to display ticks: every tick on 60Hz, every second on 120Hz.
      const interval = Math.max(1, Math.round(targetInterval / Math.max(4, tickInterval))) * tickInterval;
      tickCount++;
      if (tickGap > Math.max(24, tickInterval * 1.65)) longTicks++;
      if (continuous && now + Math.min(3, tickInterval * .23) < nextDue && !revealPending) return;
      if (!gpuAvailable()) {
        blockedFrames++;
        if (continuous) assessQuality(now, responsive);
        return;
      }
      const frameStart = performance.now();
      if (pendingResolution) {
        // Apply only once the GPU can accept work, not during an outstanding frame.
        applyResolution();
        pendingResolution = false;
      }
      const delta = lastRenderedAt ? Math.min((now - lastRenderedAt)/1000, .10) : 0;
      lastRenderedAt = now;
      // Anchor the next deadline to the actual presentation opportunity.
      nextDue = continuous ? now + interval : 0;
      if (moving) orbit.rotation.y += delta * orbitSpeed;
      needsRender = false;
      controls.update();
      for(const {mesh} of localMeshes.values()) if(typeof mesh.updateForCamera==="function")mesh.updateForCamera(camera,renderer,now);
      renderer.render(scene, camera);
      submitFrame();
      renderedFrames++;
      cpuCost += performance.now() - frameStart;
      if (revealPending) {
        revealPending = false;
        revealScene();
      }
      if (continuous) assessQuality(now, responsive);
    }

    controls.addEventListener("start", () => {
      interacting = true;
      needsRender = true;
      nextDue = 0;
      stableWindows = 0;
      lastInteraction = performance.now();
    });
    controls.addEventListener("end", () => {
      interacting = false;
      needsRender = true;
      lastInteraction = performance.now();
      if (!loadTimer && nextIndex < captures.length) loadTimer = window.setTimeout(() => {
        loadTimer = 0;
        loadQueue();
      }, 300);
    });

    state.resize = () => {
      if (state.disposed) return;
      // Defer framebuffer reallocation until the next available render slot.
      pendingResolution = true;
      const width = Math.max(1, canvasRoot.clientWidth || window.innerWidth);
      const height = Math.max(1, canvasRoot.clientHeight || window.innerHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      needsRender = true;
      nextDue = 0;
    };
    state.visibility = () => {
      if (document.hidden) {
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
      } else if (!state.disposed && !state.raf) {
        lastRenderedAt = 0;
        previousTick = 0;
        nextDue = 0;
        resetStats();
        stableWindows = 0;
        needsRender = true;
        animate();
      }
    };
    window.addEventListener("resize", state.resize, { passive: true });
    document.addEventListener("visibilitychange", state.visibility);
    renderer.domElement.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      if (state.disposed) return;
      if (state.raf) cancelAnimationFrame(state.raf);
      state.raf = 0;
      clearGpuQueue();
      revealScene();
      showError("The graphics context was interrupted. Refresh the page to reload the spatial scenes.");
    }, false);

    state.loadingTimeout = window.setTimeout(() => {
      if (!state.disposed && completed < captures.length) {
        revealScene();
        showError("Some spatial captures are still loading.");
      }
    }, 45000);

    updateProgress();
    loadQueue();
    animate();
  }

  async function syncViewer() {
    if (!isHomeVisible()) {
      ++generation;
      disposeActive();
      return;
    }
    if (active || loading) return;
    const token = ++generation;
    loading = true;
    errorBox.hidden = true;
    signal("spatial-loading");
    try {
      // On touch devices let the native loader start playing before WebGL
      // initialisation, shader compilation and capture decoding compete for time.
      const touch = matchMedia("(pointer: coarse)").matches;
      await new Promise(resolve => window.setTimeout(resolve, touch ? 450 : 120));
      if (token !== generation || !isHomeVisible()) return;
      await startViewer(token);
    } catch (error) {
      console.error("LifeAfterLogic spatial homepage failed to initialise", error);
      if (token === generation && isHomeVisible()) {
        disposeActive();
        signal("spatial-ready");
        showError("The 3D viewer could not start in this browser. Try refreshing or using a browser with WebGL enabled.");
      }
    } finally {
      loading = false;
      if (token !== generation && isHomeVisible() && !active) syncViewer();
    }
  }

  window.addEventListener("lifeafterlogic:route-change", syncViewer);
  syncViewer();
})();
