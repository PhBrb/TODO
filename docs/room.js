import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

(() => {
  "use strict";

  const ROOM_BG_COLOR = 0xf2e2cf;
  const ROOM_FOG_COLOR = 0xf2e2cf;
  const ROOM_FOG_NEAR = 12;
  const ROOM_FOG_FAR = 40;
  const HEMI_SKY_COLOR = 0xffe0b8;
  const HEMI_GROUND_COLOR = 0xd9b38c;
  const HEMI_INTENSITY = 0.7;
  const KEY_LIGHT_COLOR = 0xffd9a0;
  const KEY_LIGHT_INTENSITY = 1.6;
  const SLAB_MODEL_URL = "./models/slab.glb";
  const TABLE_MODEL_URL = "./models/table.glb";
  const PLANT_MODEL_URL = "./models/plant.glb";
  const DRACO_DECODER_PATH = "./vendor/addons/libs/draco/gltf/";
  const GRID_SIZE = 3;
  const CELL_SPACING = 2;
  const GRID_SCALE = 1 / 6;
  const SLAB_TOP_Y = 0.115;
  const TABLE_SCALE = 2;
  const TABLE_BASE_Y = -0.279;
  const TABLE_TOP_Y = 0.275;
  const PLANT_SCALE = 1;
  const PLANT_BASE_Y = -0.952;
  const CAMERA_FOV = 40;
  const CAMERA_POSITION = [5, 4.5, 7];
  const CAMERA_TARGET = [0, 0, 0];
  const LIGHT_POSITION = [6, 5, -2];
  const SHADOW_MAP_SIZE = 2048;
  const SHADOW_CAMERA_BOUNDS = 8;
  const SHADOW_RADIUS = 4;
  const FILL_LIGHT_COLOR = 0xbcd0ff;
  const FILL_LIGHT_INTENSITY = 0.35;
  const FILL_LIGHT_POSITION = [-5, 3, -4];
  const CONTROLS_MIN_DISTANCE = 2;
  const CONTROLS_MAX_DISTANCE = 30;
  const CONTROLS_MAX_POLAR_ANGLE = Math.PI / 2;

  function loadModel(loader, url) {
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => resolve(gltf.scene), undefined, () => {
        console.error("Failed to load model:", url);
        reject(new Error(url));
      });
    });
  }

  function applyShadows(obj, cast, receive) {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = cast;
        child.receiveShadow = receive;
      }
    });
  }

  function buildRoomContent(loader, onReady) {
    const grid = new THREE.Group();
    grid.scale.setScalar(GRID_SCALE);
    Promise.allSettled([
      loadModel(loader, SLAB_MODEL_URL),
      loadModel(loader, TABLE_MODEL_URL),
      loadModel(loader, PLANT_MODEL_URL),
    ]).then(([slab, table, plant]) => {
      if (slab.status === "fulfilled") {
        applyShadows(slab.value, true, true);
        for (let x = 0; x < GRID_SIZE; x++) {
          for (let z = 0; z < GRID_SIZE; z++) {
            const cell = slab.value.clone();
            cell.position.set(
              (x - (GRID_SIZE - 1) / 2) * CELL_SPACING,
              0,
              (z - (GRID_SIZE - 1) / 2) * CELL_SPACING
            );
            grid.add(cell);
          }
        }
      }
      const tableY = SLAB_TOP_Y - TABLE_BASE_Y * TABLE_SCALE;
      if (table.status === "fulfilled") {
        applyShadows(table.value, true, true);
        table.value.scale.setScalar(TABLE_SCALE);
        table.value.position.y = tableY;
        grid.add(table.value);
      }
      if (plant.status === "fulfilled" && table.status === "fulfilled") {
        applyShadows(plant.value, true, true);
        plant.value.scale.setScalar(PLANT_SCALE);
        plant.value.position.y = tableY + TABLE_TOP_Y * TABLE_SCALE - PLANT_BASE_Y * PLANT_SCALE;
        grid.add(plant.value);
      }
      onReady();
    });
    return grid;
  }

  function createRoom(container) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(ROOM_BG_COLOR);

    const camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      100
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    scene.fog = new THREE.Fog(ROOM_FOG_COLOR, ROOM_FOG_NEAR, ROOM_FOG_FAR);

    const hemi = new THREE.HemisphereLight(HEMI_SKY_COLOR, HEMI_GROUND_COLOR, HEMI_INTENSITY);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY);
    keyLight.position.set(...LIGHT_POSITION);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(SHADOW_MAP_SIZE, SHADOW_MAP_SIZE);
    keyLight.shadow.camera.left = -SHADOW_CAMERA_BOUNDS;
    keyLight.shadow.camera.right = SHADOW_CAMERA_BOUNDS;
    keyLight.shadow.camera.top = SHADOW_CAMERA_BOUNDS;
    keyLight.shadow.camera.bottom = -SHADOW_CAMERA_BOUNDS;
    keyLight.shadow.radius = SHADOW_RADIUS;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(FILL_LIGHT_COLOR, FILL_LIGHT_INTENSITY);
    fillLight.position.set(...FILL_LIGHT_POSITION);
    scene.add(fillLight);

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    scene.add(buildRoomContent(loader, () => render()));

    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(...CAMERA_TARGET);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_TARGET);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = CONTROLS_MIN_DISTANCE;
    controls.maxDistance = CONTROLS_MAX_DISTANCE;
    controls.maxPolarAngle = CONTROLS_MAX_POLAR_ANGLE;

    function onResize() {
      const width = container.clientWidth;
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    let animating = true;
    function animate() {
      if (!animating) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    function render() {
      renderer.render(scene, camera);
    }
    render();

    return {
      render,
      dispose() {
        animating = false;
        controls.dispose();
        window.removeEventListener("resize", onResize);
        disposeSceneResources();
        draco.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      },
    };

    function disposeSceneResources() {
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of materials) m.dispose();
        }
      });
    }
  }

  window.Room = { create: createRoom };

  const container = document.getElementById("room-view");
  if (container) {
    createRoom(container);
  }
})();
