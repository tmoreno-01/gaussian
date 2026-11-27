// Standard 3DGS PLY preview loader for the existing Three r157 renderer.
// Uses anisotropic Gaussian covariance, DC colour, alpha and depth sorting.
// Local files only; no service or paid storage. Not a full SH renderer.
export async function readPly(file,limit=300000,cleanup=true,coreOnly=false){
 const prefix=new Uint8Array(await file.slice(0,262144).arrayBuffer());
 const txt=new TextDecoder().decode(prefix),m=/end_header\r?\n/.exec(txt);
 if(!m||!/^ply\r?\n/.test(txt))throw Error('Not a PLY file');
 const header=txt.slice(0,m.index),start=m.index+m[0].length;
 if(!/format binary_little_endian 1\.0/.test(header))throw Error('Export a standard binary little-endian Gaussian PLY.');
 let n=0,stride=0,vertex=false,preceding=false;const props={};
 for(const line of header.split(/\r?\n/)){
  const p=line.trim().split(/\s+/);
  if(p[0]==='element'){if(p[1]==='vertex'){if(preceding)throw Error('Use standard vertex-first PLY');n=Number(p[2]);vertex=true;}else{if(!n&&Number(p[2]))preceding=true;vertex=false;}}
  if(p[0]==='property'&&vertex){const size={float:4,float32:4,double:8,float64:8,uchar:1,uint8:1,char:1,int8:1,short:2,int16:2,ushort:2,uint16:2,int:4,int32:4,uint:4,uint32:4}[p[1]];if(!size)throw Error('Unsupported vertex property');props[p[2]]={offset:stride,type:p[1]};stride+=size;}
 }
 const names=['x','y','z','scale_0','scale_1','scale_2','rot_0','rot_1','rot_2','rot_3','opacity','f_dc_0','f_dc_1','f_dc_2'];
 if(!Number.isSafeInteger(n)||n<1||n>100000000||start+n*stride>file.size||!names.every(k=>props[k]&&['float','float32','double','float64'].includes(props[k].type)))throw Error('Select a standard uncompressed 3D Gaussian PLY, not SOG or compressed PLY.');
 const step=Math.max(1,Math.ceil(n/limit)),pos=[],scales=[],rots=[],colors=[],opacity=[];
 const block=Math.max(1,Math.floor(8*1024*1024/stride));
 for(let begin=0;begin<n;begin+=block){
  const end=Math.min(n,begin+block),buf=await file.slice(start+begin*stride,start+end*stride).arrayBuffer(),v=new DataView(buf);
  for(let i=Math.ceil(begin/step)*step;i<end;i+=step){
   const offset=(i-begin)*stride;
   const get=k=>{const p=props[k];return p.type==='double'||p.type==='float64'?v.getFloat64(offset+p.offset,true):v.getFloat32(offset+p.offset,true);};
   const p=[get('x'),get('y'),get('z')],a=1/(1+Math.exp(-get('opacity'))),s=[0,1,2].map(j=>Math.exp(get('scale_'+j))),q=[1,2,3,0].map(j=>get('rot_'+j)),c=[0,1,2].map(j=>Math.max(0,Math.min(1,.5+.28209479177387814*get('f_dc_'+j))));
   const norm=Math.hypot(...q);
   if(a<.015||!Number.isFinite(a)||!p.every(Number.isFinite)||!s.every(x=>Number.isFinite(x)&&x>0)||!c.every(Number.isFinite)||!Number.isFinite(norm)||norm<1e-9)continue;
   pos.push(...p);scales.push(...s);rots.push(...q.map(x=>x/norm));colors.push(...c);opacity.push(a);
  }
 }
 if(!opacity.length)throw Error('No valid Gaussians');
 // Robust bounds remove the influence of distant floating noise on framing.
 const count=opacity.length,lo=[],hi=[],coreLo=[],coreHi=[];
 for(let k=0;k<3;k++){const a=[];for(let i=0;i<count;i+=Math.max(1,Math.floor(count/16000)))a.push(pos[i*3+k]);a.sort((x,y)=>x-y);lo[k]=a[Math.floor((a.length-1)*.02)];hi[k]=a[Math.floor((a.length-1)*.98)];coreLo[k]=a[Math.floor((a.length-1)*.08)];coreHi[k]=a[Math.floor((a.length-1)*.92)];}
 const center=lo.map((x,i)=>(x+hi[i])/2),span=Math.max(1e-6,...hi.map((x,i)=>x-lo[i]));
 const ext=coreHi.map((x,i)=>Math.max(1e-6,x-coreLo[i])).sort((a,b)=>b-a);const coreSpan=Math.max(span*.40,Math.sqrt(ext[0]*ext[1]),1e-6),coreCenter=coreLo.map((x,i)=>(x+coreHi[i])*.5);
 // Trim broad background ellipsoids and remote low-density samples. Leave
 // dense surface detail alone; avoid per-frame processing.
 const result={pos,scales,rots,colors,opacity,count,center:coreCenter,span,coreSpan,sourceCount:n,removed:0};
 if(!cleanup && !coreOnly)return result;
 const maxScale=coreSpan*.18,outer=lo.map((x,i)=>Math.max((hi[i]-x)*.24,coreSpan*.20));
 const clean={pos:[],scales:[],rots:[],colors:[],opacity:[]};
 for(let i=0;i<count;i++){
  const j=i*3,k=i*4,big=Math.max(scales[j],scales[j+1],scales[j+2]);
  if(coreOnly && (big>coreSpan*.008 || [0,1,2].some(a=>pos[j+a]-3*big<coreLo[a] || pos[j+a]+3*big>coreHi[a])))continue;
  if(big>maxScale||[0,1,2].some(a=>pos[j+a]<lo[a]-outer[a]||pos[j+a]>hi[a]+outer[a])||(opacity[i]<.06&&big>coreSpan*.035))continue;
  clean.pos.push(pos[j],pos[j+1],pos[j+2]);clean.scales.push(scales[j],scales[j+1],scales[j+2]);clean.rots.push(rots[k],rots[k+1],rots[k+2],rots[k+3]);clean.colors.push(colors[j],colors[j+1],colors[j+2]);clean.opacity.push(opacity[i]);
 }
 if(coreOnly && !clean.opacity.length)throw Error("No passage surface survived the crop");
 if(!coreOnly && clean.opacity.length<count*.55)return result;
 return {...result,...clean,count:clean.opacity.length,removed:count-clean.opacity.length};
}
export function makeGaussian(THREE,data,orientation="x-flip",splatSize=1,opacityBoost=1){
 const {pos,scales,rots,colors,opacity,count,center,span}=data;
 const width=1024,height=Math.ceil(count/width),texels=width*height*4;
 const a=new Float32Array(texels),b=new Float32Array(texels),c=new Float32Array(texels),d=new Float32Array(texels);
 const factor=Math.min(4.2/span,3.1/(data.coreSpan||span));
 for(let i=0;i<count;i++){
  const k=4*i,j=3*i;
  for(let axis=0;axis<3;axis++){
   a[k+axis]=(pos[j+axis]-center[axis])*factor;
   b[k+axis]=scales[j+axis]*factor*splatSize;
   d[k+axis]=colors[j+axis];
   c[k+axis]=rots[k+axis];
  }
  a[k+3]=Math.min(1,opacity[i]*opacityBoost);
  c[k+3]=rots[k+3];d[k+3]=1;
 }
 const texture=arr=>{const t=new THREE.DataTexture(arr,width,height,THREE.RGBAFormat,THREE.FloatType);t.minFilter=t.magFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;return t;};
 const textures=[a,b,c,d].map(texture);
 const geo=new THREE.InstancedBufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,1,-1,0,1,1,0,-1,1,0],3));geo.setIndex([0,1,2,0,2,3]);
 const order=new Float32Array(count);for(let i=0;i<count;i++)order[i]=i;
 const idx=new THREE.InstancedBufferAttribute(order,1);idx.setUsage(THREE.DynamicDrawUsage);geo.setAttribute('splatIndex',idx);geo.instanceCount=count;
 const mat=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:{
  centers:{value:textures[0]},scales:{value:textures[1]},rotations:{value:textures[2]},colors:{value:textures[3]},viewport:{value:new THREE.Vector2(1,1)}
 },vertexShader:
 'in float splatIndex; uniform sampler2D centers,scales,rotations,colors; uniform vec2 viewport; out vec2 gaussianUV; out vec4 rgba;'+
 'mat3 quat(vec4 q){float x=q.x,y=q.y,z=q.z,w=q.w;return mat3(1.-2.*(y*y+z*z),2.*(x*y+z*w),2.*(x*z-y*w),2.*(x*y-z*w),1.-2.*(x*x+z*z),2.*(y*z+x*w),2.*(x*z+y*w),2.*(y*z-x*w),1.-2.*(x*x+y*y));}'+
 'void main(){int i=int(splatIndex);ivec2 uv=ivec2(i%1024,i/1024);vec4 p=texelFetch(centers,uv,0);vec3 s=texelFetch(scales,uv,0).xyz;vec4 q=texelFetch(rotations,uv,0);rgba=vec4(texelFetch(colors,uv,0).rgb,p.w);gaussianUV=position.xy*3.;vec4 v=modelViewMatrix*vec4(p.xyz,1.);if(v.z>-.05){gl_Position=vec4(2.,2.,2.,1.);return;}'+
 'mat3 M=mat3(modelViewMatrix)*quat(q)*mat3(s.x,0.,0.,0.,s.y,0.,0.,0.,s.z);mat3 V=M*transpose(M);float z=-v.z;float fx=projectionMatrix[0][0]*viewport.x*.5,fy=projectionMatrix[1][1]*viewport.y*.5;vec3 jx=vec3(fx/z,0.,fx*v.x/(z*z)),jy=vec3(0.,fy/z,fy*v.y/(z*z));float A=dot(jx,V*jx)+.25,B=dot(jx,V*jy),C=dot(jy,V*jy)+.25;float mid=(A+C)*.5,delta=sqrt(max(0.,(A-C)*(A-C)*.25+B*B));float l1=max(.25,mid+delta),l2=max(.25,mid-delta);vec2 axis=abs(B)>1e-8?normalize(vec2(B,l1-A)):(A>=C?vec2(1.,0.):vec2(0.,1.));vec2 other=vec2(-axis.y,axis.x);vec2 shift=axis*min(384.,3.*sqrt(l1))*position.x+other*min(384.,3.*sqrt(l2))*position.y;gl_Position=projectionMatrix*v;gl_Position.xy+=shift*2./viewport*gl_Position.w;}',
 fragmentShader:'in vec2 gaussianUV; in vec4 rgba; out vec4 outColor; void main(){float r=dot(gaussianUV,gaussianUV);if(r>9.)discard;float a=rgba.a*exp(-.5*r);if(a<.003)discard;outColor=vec4(rgba.rgb,a);}'});
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;
 // Orientation is source-specific: COLMAP-style scans default to X-flip,
 // Artillery Passage Y-down PLY uses a Z half-turn, Suvilahti is already upright.
 if(orientation==="z-flip")mesh.rotation.z=Math.PI;
 else if(orientation!=="none")mesh.rotation.x=Math.PI;
 const bins=512,counts=new Uint32Array(bins),offsets=new Uint32Array(bins),keys=new Uint16Array(count),depths=new Float32Array(count),mv=new THREE.Matrix4();
 let lastSort=-Infinity;
 const sortedDirection=new THREE.Vector3(), direction=new THREE.Vector3();
 mesh.updateForCamera=(camera,renderer,now)=>{
  mat.uniforms.viewport.value.set(renderer.domElement.width,renderer.domElement.height);
  if(now-lastSort<150)return;lastSort=now;
  mesh.updateWorldMatrix(true,false);camera.updateMatrixWorld();mv.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);
  const e=mv.elements;
  direction.set(e[2],e[6],e[10]).normalize();
  if(sortedDirection.distanceToSquared(direction)<0.0001)return;
  sortedDirection.copy(direction);
  let lo=Infinity,hi=-Infinity;
  for(let i=0;i<count;i++){const k=i*4,z=e[2]*a[k]+e[6]*a[k+1]+e[10]*a[k+2]+e[14];depths[i]=z;lo=Math.min(lo,z);hi=Math.max(hi,z);}
  counts.fill(0);const f=(bins-1)/Math.max(1e-8,hi-lo);
  for(let i=0;i<count;i++){const k=Math.max(0,Math.min(bins-1,Math.floor((depths[i]-lo)*f)));keys[i]=k;counts[k]++;}
  let n=0;for(let i=0;i<bins;i++){offsets[i]=n;n+=counts[i];}for(let i=0;i<count;i++)order[offsets[keys[i]]++]=i;idx.needsUpdate=true;
 };
 mesh.dispose=()=>{geo.dispose();mat.dispose();textures.forEach(t=>t.dispose());};
 return mesh;
}
