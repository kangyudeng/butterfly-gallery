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
  camera.position.z = 800;

  const width = window.innerWidth, height = window.innerHeight;
  renderer.setSize(width, height);
  renderer.setClearColor(0x0b0b0c, 1);

  // Create particles
  const particleCount = 2000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);

  // Initialize random positions around center
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3 + 0] = (Math.random() - 0.5) * 1500;
    positions[i3 + 1] = (Math.random() - 0.5) * 1000;
    positions[i3 + 2] = (Math.random() - 0.5) * 500;

    velocities[i3 + 0] = (Math.random() - 0.5) * 8;
    velocities[i3 + 1] = (Math.random() - 0.5) * 8;
    velocities[i3 + 2] = (Math.random() - 0.5) * 8;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffd166, size: 3, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // Animate particles toward center (butterfly shape approximation)
  let progress = 0;
  const duration = 3000; // 3 seconds
  let startTime = Date.now();
  let animating = true;

  function animate() {
    const elapsed = Date.now() - startTime;
    progress = Math.min(1, elapsed / duration);

    const pos = geometry.attributes.position.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const ease = easeOutCubic(progress);

      // Move particles toward center
      pos[i3 + 0] = lerp(positions[i3 + 0], 0, ease);
      pos[i3 + 1] = lerp(positions[i3 + 1], 0, ease);
      pos[i3 + 2] = lerp(positions[i3 + 2], 50, ease);
    }

    geometry.attributes.position.needsUpdate = true;
    points.rotation.y += 0.003 * (1 - progress);
    points.rotation.x += 0.001 * (1 - progress);

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
    if (!animating) {
      landing.style.transition = 'opacity 0.7s ease';
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
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  // Build gallery
  async function buildGallery() {
    try {
      const res = await fetch('images.json');
      const data = await res.json();
      const categoriesEl = document.getElementById('categories');
      categoriesEl.innerHTML = '';

      for (const [cat, files] of Object.entries(data)) {
        const preview = files.find(f => /1\.[a-zA-Z]{3,4}$/.test(f)) || files[0];
        const card = document.createElement('div');
        card.className = 'card';

        const img = document.createElement('img');
        img.src = preview;
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
      const img = document.createElement('img');
      img.src = f;
      img.alt = cat;
      content.appendChild(img);
    });

    modal.classList.remove('hidden');
    close.onclick = () => modal.classList.add('hidden');
  }
}
