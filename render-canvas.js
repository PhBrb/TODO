const { Canvas } = require('canvas');
const THREE = require('three');
const fs = require('fs');
const path = require('path');

function createWebGLContext(canvas) {
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) {
    throw new Error('Unable to create WebGL context');
  }
  
  return gl;
}

function renderThreeJSSceneToCanvas(width = 1920, height = 1080) {
  console.log('Creating canvas for three.js rendering...');
  
  const canvas = new Canvas(width, height);
  const gl = createWebGLContext(canvas);
  
  const ROOM_BG_COLOR = 0xd8e2f0;
  const CUBE_COLOR = 0x8b5cf6;
  const CUBE_SIZE = 1;
  const CAMERA_FOV = 40;
  const CAMERA_POSITION = [3, 2.6, 4];
  const CAMERA_TARGET = [0, 0, 0];
  const LIGHT_POSITION = [4, 6, 3];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ROOM_BG_COLOR);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    width / height,
    0.1,
    100
  );

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: gl,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(...LIGHT_POSITION);
  scene.add(dirLight);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
    new THREE.MeshStandardMaterial({ color: CUBE_COLOR })
  );
  scene.add(cube);

  camera.position.set(...CAMERA_POSITION);
  camera.lookAt(...CAMERA_TARGET);

  cube.rotation.y = Math.PI / 4;
  cube.rotation.x = Math.PI / 6;

  console.log('Rendering scene...');
  renderer.render(scene, camera);

  console.log('Extracting image data...');
  const buffer = canvas.toBuffer('image/png');
  
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotDir, 'room-canvas-render.png');
  fs.writeFileSync(screenshotPath, buffer);
  
  console.log(`Canvas render saved to: ${screenshotPath}`);
  console.log(`Image size: ${(buffer.length / 1024).toFixed(2)} KB`);
  
  return screenshotPath;
}

function renderWithItems(items = [], width = 1920, height = 1080) {
  console.log('Rendering room with items:', items);
  
  const canvas = new Canvas(width, height);
  const gl = createWebGLContext(canvas);
  
  const ROOM_BG_COLOR = 0xd8e2f0;
  const CUBE_COLOR = 0x8b5cf6;
  const CUBE_SIZE = 1;
  const CAMERA_FOV = 40;
  const CAMERA_POSITION = [3, 2.6, 4];
  const CAMERA_TARGET = [0, 0, 0];
  const LIGHT_POSITION = [4, 6, 3];

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ROOM_BG_COLOR);

  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    width / height,
    0.1,
    100
  );

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    context: gl,
    antialias: true,
    alpha: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(...LIGHT_POSITION);
  scene.add(dirLight);

  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE),
    new THREE.MeshStandardMaterial({ color: CUBE_COLOR })
  );
  scene.add(cube);

  camera.position.set(...CAMERA_POSITION);
  camera.lookAt(...CAMERA_TARGET);

  cube.rotation.y = Math.PI / 4;
  cube.rotation.x = Math.PI / 6;

  const itemPositions = [
    { x: -2, z: -2 },
    { x: 2, z: -2 },
    { x: -2, z: 2 },
    { x: 2, z: 2 },
    { x: 0, z: -3 },
  ];

  for (let i = 0; i < Math.min(items.length, itemPositions.length); i++) {
    const item = items[i];
    const pos = itemPositions[i];
    const itemMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
    );
    itemMesh.position.set(pos.x, 0.25, pos.z);
    scene.add(itemMesh);
  }

  renderer.render(scene, camera);

  const buffer = canvas.toBuffer('image/png');
  
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(screenshotDir, `room-items-${items.join('-')}-${timestamp}.png`);
  fs.writeFileSync(screenshotPath, buffer);
  
  console.log(`Canvas render with items saved to: ${screenshotPath}`);
  
  return screenshotPath;
}

module.exports = {
  renderThreeJSSceneToCanvas,
  renderWithItems,
};

if (require.main === module) {
  renderThreeJSSceneToCanvas()
    .then(() => console.log('Canvas rendering complete!'))
    .catch((err) => {
      console.error('Canvas rendering failed:', err);
      process.exit(1);
    });
}
