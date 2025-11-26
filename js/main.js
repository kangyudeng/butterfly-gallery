// Main JS: particle landing + gallery builder
importThreeIfNeeded();

async function importThreeIfNeeded(){
  // three.js is included via script tag; ensure availability
  await waitFor(()=>window.THREE);
  main();
}

function waitFor(cond,timeout=5000){
  return new Promise((resolve,reject)=>{
    const t0=Date.now();
    (function check(){
      if(cond())return resolve();
      if(Date.now()-t0>timeout)return reject(new Error('Timeout waiting'));
      requestAnimationFrame(check);
    })();
  });
}

async function main(){
  const canvas = document.getElementById('canvas');
  const landingOverlay = document.getElementById('landing-overlay');
  const cta = document.getElementById('butterfly-click');
  const site = document.getElementById('site');

  // Setup three
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true});
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45,window.innerWidth/window.innerHeight,0.1,2000);
  camera.position.z = 600;

  let width = window.innerWidth, height = window.innerHeight;
  renderer.setSize(width,height);

  const N = 3000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(N*3);
  const targets = new Float32Array(N*3);

  for(let i=0;i<N;i++){
    positions[i*3+0] = (Math.random()-0.5)*2000;
    positions[i*3+1] = (Math.random()-0.5)*1200;
    positions[i*3+2] = (Math.random()-0.5)*800;
  }

  // Build target positions from SVG path
  const pathEl = document.getElementById('butterfly-path');
  const pathLength = pathEl.getTotalLength();
  for(let i=0;i<N;i++){
    const t = (i/N);
    const p = pathEl.getPointAtLength((t*pathLength)%pathLength);
    // Map SVG coordinates to three.js coordinates
    targets[i*3+0] = (p.x - 400) * 1.6;
    targets[i*3+1] = -(p.y - 200) * 1.6;
    targets[i*3+2] = (Math.sin(i)*20);
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));

  const material = new THREE.PointsMaterial({color:0xffd166,size:2,transparent:true,opacity:0.95});
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  let progress = 0; // 0 -> 1 morph progress
  const duration = 2600; // ms
  let startTime = performance.now();

  function animate(now){
    const elapsed = now - startTime;
    progress = Math.min(1, elapsed/duration);

    // interpolate positions to targets
    const pos = geometry.attributes.position.array;
    for(let i=0;i<N;i++){
      const i3 = i*3;
      pos[i3+0] = lerp(pos[i3+0], targets[i3+0], easeOutCubic(progress));
      pos[i3+1] = lerp(pos[i3+1], targets[i3+1], easeOutCubic(progress));
      pos[i3+2] = lerp(pos[i3+2], targets[i3+2], easeOutCubic(progress));
    }
    geometry.attributes.position.needsUpdate = true;

    points.rotation.y += 0.001 * (1-progress);
    renderer.render(scene,camera);

    if(progress<1) requestAnimationFrame(animate);
    else {
      // show CTA
      cta.style.opacity = '1';
      cta.style.transform = 'translateY(0)';
      cta.addEventListener('click',enterSite);
      // also allow click anywhere
      canvas.addEventListener('click',enterSite);
    }
  }
  requestAnimationFrame(animate);

  function enterSite(){
    document.getElementById('landing').style.transition='opacity .7s ease';
    document.getElementById('landing').style.opacity='0';
    setTimeout(()=>document.getElementById('landing').classList.add('hidden'),800);
    site.classList.remove('hidden');
    // build gallery
    buildGallery();
  }

  window.addEventListener('resize',()=>{
    width = window.innerWidth; height = window.innerHeight;
    camera.aspect = width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height);
  });

  // Utils
  function lerp(a,b,t){return a+(b-a)*t}
  function easeOutCubic(t){return 1-Math.pow(1-t,3)}

  // Gallery building
  async function buildGallery(){
    try{
      const res = await fetch('images.json');
      const data = await res.json();
      const categoriesEl = document.getElementById('categories');
      categoriesEl.innerHTML='';
      for(const [cat,files] of Object.entries(data)){
        // choose preview: file that ends with '1' or first
        let preview = files.find(f=>/1\.[a-zA-Z]{3,4}$/.test(f)) || files[0];
        const card = document.createElement('div'); card.className='card';
        const img = document.createElement('img'); img.src = preview; img.alt=cat;
        const label = document.createElement('div'); label.className='label'; label.textContent = cat;
        card.appendChild(img); card.appendChild(label);
        card.addEventListener('click',()=>openCategory(cat,files));
        categoriesEl.appendChild(card);
      }
    }catch(err){
      console.error('加载 images.json 失败',err);
      const el=document.getElementById('categories'); el.textContent='无法加载图片列表，请确保 images.json 在同一目录。';
    }
  }

  function openCategory(cat,files){
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    const close = document.getElementById('modal-close');
    content.innerHTML='';
    files.forEach(f=>{
      const img = document.createElement('img'); img.src=f; img.alt=cat; content.appendChild(img);
    });
    modal.classList.remove('hidden');
    close.onclick = ()=>modal.classList.add('hidden');
  }
}
