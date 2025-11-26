// Main JS: particle landing + gallery builder

// Wait for THREE to load
function waitForThree(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (window.THREE) resolve(window.THREE);
      else if (Date.now() - start > timeout) reject(new Error('THREE.js load timeout'));
      else requestAnimationFrame(check);
    };
    check();
  });
}

// Initialize app
window.addEventListener('DOMContentLoaded', () => {
  waitForThree().then(THREE => initApp(THREE)).catch(err => {
    console.error('Failed to load THREE.js:', err);
    document.getElementById('butterfly-click').textContent = '加载失败，请刷新页面';
  });
});

function initApp(THREE) {
  const canvas = document.getElementById('canvas');
  const cta = document.getElementById('butterfly-click');
  const site = document.getElementById('site');
  const landing = document.getElementById('landing');

  // THREE setup
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.z = 600;

  const width = window.innerWidth, height = window.innerHeight;
  renderer.setSize(width, height);
  renderer.setClearColor(0x0b0b0c, 1);

  // Create butterfly-shaped particles
  const particleCount = 4000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const targetPositions = new Float32Array(particleCount * 3);

  // Generate random starting positions
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * 2000;
    positions[i3 + 1] = (Math.random() - 0.5) * 1500;
    positions[i3 + 2] = (Math.random() - 0.5) * 800;
  }

  // Generate butterfly shape target positions
  generateButterflyShape(targetPositions, particleCount);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ 
    color: 0xffd166, 
    size: 2.5, 
    transparent: true, 
    opacity: 0.95,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Animation loop
  let progress = 0;
  const duration = 5000; // 5 seconds for smoother animation
  let startTime = Date.now();
  let animating = true;

  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(1, elapsed / duration);

    const pos = geometry.attributes.position.array;
    const easeProgress = easeOutQuart(progress);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3 + 0] = lerp(positions[i3 + 0], targetPositions[i3 + 0], easeProgress);
      pos[i3 + 1] = lerp(positions[i3 + 1], targetPositions[i3 + 1], easeProgress);
      pos[i3 + 2] = lerp(positions[i3 + 2], targetPositions[i3 + 2], easeProgress);
    }

    geometry.attributes.position.needsUpdate = true;
    
    // Rotate butterfly
    points.rotation.y += 0.002 * (1 - progress * 0.5);
    points.rotation.x += 0.0005 * Math.sin(elapsed / 3000);

    renderer.render(scene, camera);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      animating = false;
      // Show CTA
      cta.style.opacity = '1';
      cta.style.transform = 'translateY(0)';
    }
  }

  animate();

  // Click to enter
  function enterSite() {
    if (!animating && progress >= 0.9) {
      landing.style.transition = 'opacity 0.8s ease';
      landing.style.opacity = '0';
      setTimeout(() => landing.classList.add('hidden'), 800);
      site.classList.remove('hidden');
      buildGallery();
    }
  }

  cta.addEventListener('click', enterSite);
  canvas.addEventListener('click', enterSite);

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Utils
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  // Build gallery
  async function buildGallery() {
    try {
      const res = await fetch('./images.json');
      const data = await res.json();
      const categoriesEl = document.getElementById('categories');
      categoriesEl.innerHTML = '';

      for (const [cat, files] of Object.entries(data)) {
        const preview = files.find(f => /1\.[a-zA-Z]{3,4}$/.test(f)) || files[0];
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = './' + preview;
        img.alt = cat;

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = cat.toUpperCase();

        card.appendChild(img);
        card.appendChild(label);
        card.addEventListener('click', () => openCategory(cat, files));
        categoriesEl.appendChild(card);
      }
    } catch (err) {
      console.error('Failed to load images.json:', err);
      document.getElementById('categories').textContent = '无法加载图片列表';
    }
  }

  function openCategory(cat, files) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    const close = document.getElementById('modal-close');

    content.innerHTML = '';
    files.forEach(f => {
      if (f.endsWith('.mp4') || f.endsWith('.webm')) {
        // Video support
        const video = document.createElement('video');
        video.src = './' + f;
        video.alt = cat;
        video.controls = true;
        video.style.width = '100%';
        video.style.height = 'auto';
        video.style.borderRadius = '12px';
        content.appendChild(video);
      } else {
        // Image
        const img = document.createElement('img');
        img.src = './' + f;
        img.alt = cat;
        content.appendChild(img);
      }
    });

    modal.classList.remove('hidden');
    close.onclick = () => modal.classList.add('hidden');
  }
}

// Generate butterfly wing shape
function generateButterflyShape(array, count) {
  const butterflyPath = [
    // Left wing top
    { x: -150, y: 100 }, { x: -200, y: 80 }, { x: -220, y: 50 }, { x: -200, y: 30 },
    { x: -100, y: 20 }, { x: -80, y: 0 }, { x: -100, y: -30 },
    // Left wing bottom
    { x: -180, y: -50 }, { x: -240, y: -80 }, { x: -220, y: -120 }, { x: -150, y: -100 },
    // Body top
    { x: -20, y: 80 }, { x: 0, y: 100 }, { x: 20, y: 80 },
    // Body middle
    { x: -10, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 },
    // Body bottom
    { x: -20, y: -80 }, { x: 0, y: -100 }, { x: 20, y: -80 },
    // Right wing top
    { x: 100, y: 20 }, { x: 80, y: 0 }, { x: 100, y: -30 }, { x: 200, y: 30 },
    { x: 220, y: 50 }, { x: 200, y: 80 }, { x: 150, y: 100 },
    // Right wing bottom
    { x: 180, y: -50 }, { x: 150, y: -100 }, { x: 220, y: -120 }, { x: 240, y: -80 }
  ];

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    const pathIdx = Math.floor((i / count) * butterflyPath.length);
    const point = butterflyPath[pathIdx];
    
    // Add some variation around the path
    const variance = 15;
    array[i3 + 0] = point.x + (Math.random() - 0.5) * variance;
    array[i3 + 1] = point.y + (Math.random() - 0.5) * variance;
    array[i3 + 2] = (Math.random() - 0.5) * 40 + Math.sin(i) * 20;
  }
}
