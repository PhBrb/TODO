import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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
  const LAMP_MODEL_URL = "./models/lamp.glb";
  const DRACO_DECODER_PATH = "./vendor/addons/libs/draco/gltf/";
  const CELL_SPACING = 2;
  const GRID_SCALE = 1 / 6;
  const SLAB_TOP_Y = 0.115;
  const TABLE_SCALE = 2;
  const TABLE_BASE_Y = -0.279;
  const TABLE_TOP_Y = 0.275;
  const PLANT_BASE_Y = -0.952;
  const LAMP_BASE_Y = -0.951;
  const ITEM_ON_TABLE_OFFSET = 1.6;
  const PLANT_SCALE = 1;
  const LAMP_SCALE = 1;
  const LAMP_LIGHT_COLOR = 0xffb46b;
  const LAMP_LIGHT_INTENSITY = 1.2;
  const LAMP_LIGHT_DISTANCE = 6;
  const LAMP_LIGHT_Y_OFFSET = 0.5;
  const WINDOW_POSITION = [-0.33, 0.32, -0.45];
  const SUNSPOT_TARGET = [0, 0.2, 0.05];
  const SUNSPOT_COLOR = 0xffd9a0;
  const SUNSPOT_INTENSITY = 0.4;
  const SUNSPOT_ANGLE = 0.5;
  const SUNSPOT_PENUMBRA = 0.6;
  const BLOOM_STRENGTH = 0.12;
  const BLOOM_RADIUS = 0.4;
  const BLOOM_THRESHOLD = 0.96;
  const DUST_COUNT = 220;
  const DUST_SIZE = 0.012;
  const DUST_OPACITY = 0.5;
  const DUST_DRIFT_SPEED = 0.06;
  const DUST_COLOR = 0xffe8c4;
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
  const PAN_MARGIN_PX = 32;

  function createDustTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) return new THREE.CanvasTexture(canvas);
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  function createDust() {
    const positions = new Float32Array(DUST_COUNT * 3);
    const seeds = new Float32Array(DUST_COUNT);
    const from = new THREE.Vector3(...WINDOW_POSITION);
    const to = new THREE.Vector3(...SUNSPOT_TARGET);
    for (let i = 0; i < DUST_COUNT; i++) {
      const t = Math.random();
      const spread = 0.06 + t * 0.1;
      positions[i * 3] = from.x + (to.x - from.x) * t + (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = from.y + (to.y - from.y) * t + (Math.random() - 0.5) * spread;
      positions[i * 3 + 2] = from.z + (to.z - from.z) * t + (Math.random() - 0.5) * spread;
      seeds[i] = Math.random() * Math.PI * 2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: DUST_COLOR,
      size: DUST_SIZE,
      transparent: true,
      opacity: DUST_OPACITY,
      map: createDustTexture(),
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geometry, material);
    points.userData.seeds = seeds;
    points.userData.basePositions = positions.slice();
    return points;
  }

  function updateDust(dust, elapsed) {
    const positions = dust.geometry.attributes.position;
    const base = dust.userData.basePositions;
    const seeds = dust.userData.seeds;
    for (let i = 0; i < seeds.length; i++) {
      const t = elapsed * DUST_DRIFT_SPEED + seeds[i];
      positions.array[i * 3] = base[i * 3] + Math.sin(t) * 0.25;
      positions.array[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.7) * 0.15;
      positions.array[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.9) * 0.2;
    }
    positions.needsUpdate = true;
  }
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

  const TYPES = () => window.ROOM_OBJECT_TYPES || {};

  function decorateObject(typeId, model) {
    const glowCfg = TYPES()[typeId]?.glow;
    if (glowCfg) {
      const glow = new THREE.PointLight(glowCfg.color, glowCfg.intensity, glowCfg.distance);
      glow.position.y = glowCfg.yOffset;
      model.add(glow);
    }
  }

  function worldPosOfCell(cell) {
    return [cell[0] * CELL_SPACING, 0, cell[1] * CELL_SPACING];
  }

  // Build a lookup from object id -> { model, position, rotation } for the
  // current scene description. Positions are computed in slab-grid space.
  function layoutRoom(objects, slabCells) {
    const types = TYPES();
    const layout = new Map(); // id -> { model, position, rotation }
    // slab objects first (hosts), then onObject items
    const ordered = [
      ...objects.filter((o) => types[o.type]?.class === "slab"),
      ...objects.filter((o) => types[o.type]?.class === "onObject"),
    ];
    const positions = new Map(); // id -> [x, y, z] in grid space
    for (const o of ordered) {
      const type = types[o.type];
      if (!type) continue;
      if (type.class === "slab") {
        if (!o.cell || !slabCells.some((c) => c[0] === o.cell[0] && c[1] === o.cell[1])) {
          continue; // placement invalid for this room: don't render (state stays untouched)
        }
        const [x, z] = worldPosOfCell(o.cell);
        const y = SLAB_TOP_Y - type.baseY * type.scale;
        positions.set(o.id, [x, y, z]);
      } else {
        // onObject: sits on the host's surface
        const hostPos = positions.get(o.on);
        const host = objects.find((p) => p.id === o.on);
        const hostType = host && types[host.type];
        if (!hostPos || !hostType || !hostType.supportsOnTop) continue;
        // host position already includes the host's base offset (baseY);
        // the usable surface sits surfaceY (model units) above the host's
        // own base, and this object's baseY anchors it on that surface.
        const surfaceY = hostPos[1] + hostType.surfaceY * hostType.scale;
        positions.set(o.id, [hostPos[0], surfaceY - type.baseY * type.scale, hostPos[2]]);
      }
    }
    return positions;
  }

  function buildRoomContent(loader, sceneDesc) {
    const grid = new THREE.Group();
    grid.scale.setScalar(GRID_SCALE);

    const slabCells = (sceneDesc && sceneDesc.slabs) || [[0, 0]];
    const objects = (sceneDesc && sceneDesc.objects) || [];
    const types = TYPES();

    const ids = objects.map((o) => o.type).filter((t) => types[t]);
    const jobs = [loadModel(loader, SLAB_MODEL_URL)];
    for (const t of new Set(ids)) jobs.push(loadModel(loader, types[t].model));

    Promise.allSettled(jobs).then((results) => {
      const [slabResult, ...itemResults] = results;
      if (slabResult.status !== "fulfilled") return;
      const slab = slabResult.value;

      applyShadows(slab, true, true);
      for (const [dx, dz] of slabCells) {
        const cell = slab.clone();
        cell.position.set(dx * CELL_SPACING, 0, dz * CELL_SPACING);
        grid.add(cell);
      }

      const modelByType = new Map();
      [...new Set(ids)].forEach((t, i) => {
        if (itemResults[i] && itemResults[i].status === "fulfilled") {
          modelByType.set(t, itemResults[i].value);
        }
      });

      const positions = layoutRoom(objects, slabCells);
      for (const o of objects) {
        const type = types[o.type];
        const template = modelByType.get(o.type);
        const pos = positions.get(o.id);
        if (!type || !template || !pos) continue;
        const model = template.clone();
        applyShadows(model, true, true);
        model.scale.setScalar(type.scale);
        model.position.set(pos[0], pos[1], pos[2]);
        model.rotation.y = (o.rotation || 0) * Math.PI / 2;
        model.userData.roomObjectId = o.id;
        decorateObject(o.type, model);
        grid.add(model);
        sceneDesc.bindObject?.(o.id, model);
      }
    });
    return grid;
  }

  function createLighting(scene) {
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
  }

  function createCameraControls(camera, container, targetElement) {
    const controls = new OrbitControls(camera, targetElement);
    controls.target.set(...CAMERA_TARGET);
    controls.enableRotate = false;
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    controls.touches.ONE = THREE.TOUCH.PAN;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = CONTROLS_MIN_DISTANCE;
    controls.maxDistance = CONTROLS_MAX_DISTANCE;
    controls.maxPolarAngle = CONTROLS_MAX_POLAR_ANGLE;

    const ray = new THREE.Vector3();
    const viewDir = new THREE.Vector3();
    const toCenter = new THREE.Vector3();
    const desired = new THREE.Vector3();
    const shift = new THREE.Vector3();
    const sceneCenter = new THREE.Vector3(...CAMERA_TARGET);

    function clampPan() {
      const width = container.clientWidth;
      const height = Math.max(1, container.clientHeight);
      ray.set(...CAMERA_TARGET).project(camera);
      const screenX = (ray.x * 0.5 + 0.5) * width;
      const screenY = (-ray.y * 0.5 + 0.5) * height;
      const clampedX = Math.min(width - PAN_MARGIN_PX, Math.max(PAN_MARGIN_PX, screenX));
      const clampedY = Math.min(height - PAN_MARGIN_PX, Math.max(PAN_MARGIN_PX, screenY));
      if (clampedX === screenX && clampedY === screenY) return;

      const ndcX = (clampedX / width) * 2 - 1;
      const ndcY = -(clampedY / height) * 2 + 1;
      ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize();
      camera.getWorldDirection(viewDir);
      toCenter.subVectors(sceneCenter, camera.position);
      const depth = toCenter.dot(viewDir);
      desired.copy(camera.position).addScaledVector(ray, depth / ray.dot(viewDir));
      shift.subVectors(sceneCenter, desired);
      camera.position.add(shift);
      controls.target.add(shift);
    }

    return {
      update() {
        controls.update();
        clampPan();
      },
      setPanEnabled(enabled) {
        controls.enablePan = enabled;
      },
      dispose() {
        controls.dispose();
      },
    };
  }

  function createRoom(container, getSceneDesc) {
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
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    createLighting(scene);

    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    // --- object selection / move / rotate interactions -------------------
    const objectModels = new Map(); // roomObjectId -> model (bound via bindObject)
    let selectedId = null;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = null; // { x, y, objectId, moved }
    const TAP_SLOP_PX = 6;

    function bindObject(id, model) {
      objectModels.set(id, model);
      updateObjectBox(id);
      if (selectedId === id) applyHighlight(model, true);
    }

    const HIGHLIGHT_EMISSIVE = 0x664411;

    function applyHighlight(model, on) {
      model.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const m of materials) {
          m.emissive = m.emissive || new THREE.Color(0);
          m.emissive.setHex(on ? HIGHLIGHT_EMISSIVE : 0x000000);
          if (m.emissiveIntensity !== undefined) m.emissiveIntensity = on ? 1.5 : 1;
        }
      });
    }

    function setSelected(id) {
      if (selectedId === id) return;
      const prev = objectModels.get(selectedId);
      if (prev) applyHighlight(prev, false);
      selectedId = id;
      const next = objectModels.get(id);
      if (next) applyHighlight(next, true);
    }

    // world-space bounding box per object (recomputed after load/move)
    const objectBoxes = new Map(); // roomObjectId -> THREE.Box3

    function updateObjectBox(id) {
      const model = objectModels.get(id);
      if (!model) return;
      const box = new THREE.Box3().setFromObject(model);
      objectBoxes.set(id, box);
    }

    function pickObject(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // pick against bounding boxes (cheap, forgiving for thin parts),
      // nearest box wins
      const ray = raycaster.ray;
      let bestId = null;
      let bestDist = Infinity;
      for (const [id, box] of objectBoxes) {
        if (ray.intersectsBox(box)) {
          // distance to box center as sort key
          const center = box.getCenter(new THREE.Vector3());
          const d = ray.distanceSqToPoint(center);
          if (d < bestDist) { bestDist = d; bestId = id; }
        }
      }
      return bestId;
    }

    function pickSlabCell(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // intersect with the floor plane (slab top height in grid space)
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -SLAB_TOP_Y);
      const point = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(plane, point)) return null;
      if (!roomContent) return null;
      roomContent.worldToLocal(point);
      const cellX = Math.round(point.x / CELL_SPACING);
      const cellZ = Math.round(point.z / CELL_SPACING);
      return [cellX, cellZ];
    }

    function onPointerDown(event) {
      if (event.button !== undefined && event.button !== 0) return;
      const id = pickObject(event);
      pointerDown = { x: event.clientX, y: event.clientY, objectId: id, moved: false };
    }

    function onPointerMove(event) {
      if (!pointerDown) return;
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      if (Math.hypot(dx, dy) > TAP_SLOP_PX) pointerDown.moved = true;
      if (pointerDown.moved && pointerDown.objectId && selectedId === pointerDown.objectId) {
        // dragging a selected object: pan disabled via controls.enabled
        const cell = pickSlabCell(event);
        if (cell) showMovePreview(pointerDown.objectId, cell);
      }
    }

    function onPointerUp(event) {
      if (!pointerDown) return;
      const info = pointerDown;
      pointerDown = null;
      hideMovePreview();
      if (info.moved) {
        if (info.objectId && selectedId === info.objectId) {
          const cell = pickSlabCell(event);
          if (cell) commitMove(info.objectId, cell);
        }
        return;
      }
      // tap
      if (info.objectId) {
        if (selectedId === info.objectId) {
          window.Game?.rotateRoomObject(info.objectId);
        } else {
          setSelected(info.objectId);
          controls.setPanEnabled(false);
        }
      } else {
        setSelected(null);
        controls.setPanEnabled(true);
      }
    }

    function commitMove(objectId, cell) {
      const types = TYPES();
      const objects = (typeof getSceneDesc === "function" ? getSceneDesc() : null)?.objects || [];
      const obj = objects.find((o) => o.id === objectId);
      const type = obj && types[obj.type];
      if (!type) return;
      // target slab cell: is a slab-object already there?
      const occupant = objects.find(
        (o) => o.cell && o.cell[0] === cell[0] && o.cell[1] === cell[1] && o.id !== objectId
      );
      const occupantType = occupant && types[occupant.type];
      if (type.class === "onObject") {
        // dragged onto a slab: place on the slab if the class allows, else on the occupant
        if (occupantType?.supportsOnTop) {
          window.Game?.moveRoomObject(objectId, { on: occupant.id });
        } else {
          window.Game?.moveRoomObject(objectId, { cell });
        }
      } else {
        if (occupant) return; // slab objects cannot stack on each other
        window.Game?.moveRoomObject(objectId, { cell });
      }
    }

    function isRoomCell(cell) {
      const desc = typeof getSceneDesc === "function" ? getSceneDesc() : null;
      const slabs = desc?.slabs || [];
      return slabs.some((c) => c[0] === cell[0] && c[1] === cell[1]);
    }

    function showMovePreview(objectId, cell) {
      if (!isRoomCell(cell)) return; // preview only inside the room
      const model = objectModels.get(objectId);
      if (!model) return;
      const [x, z] = worldPosOfCell(cell);
      model.position.x = x;
      model.position.z = z;
    }

    function hideMovePreview() {
      // positions snap back via the state-driven refresh on commit;
      // nothing to do here because the preview moves the model directly
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", () => { pointerDown = null; });

    let roomContent = null;
    function refreshContent() {
      if (roomContent) {
        scene.remove(roomContent);
        disposeObject(roomContent);
        objectModels.clear();
        objectBoxes.clear();
      }
      const desc = typeof getSceneDesc === "function" ? getSceneDesc() : null;
      roomContent = buildRoomContent(loader, desc);
      scene.add(roomContent);
    }
    refreshContent();
    const sunSpot = new THREE.SpotLight(SUNSPOT_COLOR, SUNSPOT_INTENSITY);
    sunSpot.position.set(...WINDOW_POSITION);
    sunSpot.target.position.set(...SUNSPOT_TARGET);
    sunSpot.angle = SUNSPOT_ANGLE;
    sunSpot.penumbra = SUNSPOT_PENUMBRA;
    sunSpot.decay = 1.2;
    scene.add(sunSpot);
    scene.add(sunSpot.target);
    const dust = createDust();
    scene.add(dust);
    const clock = new THREE.Clock();

    camera.position.set(...CAMERA_POSITION);
    camera.lookAt(...CAMERA_TARGET);

    const controls = createCameraControls(camera, container, renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(container.clientWidth, container.clientHeight),
      BLOOM_STRENGTH,
      BLOOM_RADIUS,
      BLOOM_THRESHOLD
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    function onResize() {
      const width = container.clientWidth;
      const height = Math.max(1, container.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    let animating = true;
    function animate() {
      if (!animating) return;
      controls.update();
      updateDust(dust, clock.getElapsedTime());
      composer.render();
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);

    return {
      refresh: refreshContent,
      bindObject,
      dispose() {
        animating = false;
        controls.dispose();
        window.removeEventListener("resize", onResize);
        disposeSceneResources();
        draco.dispose();
        composer.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      },
    };

    function disposeSceneResources() {
      disposeObject(scene);
    }

    function disposeObject(root) {
      root.traverse((obj) => {
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
  if (container && window.Game) {
    const instance = createRoom(container, () => ({
      slabs: Game.slabOffsets(Game.slabCountForLevel(Game.levelFromXp(Game.state.xp))),
      objects: Game.state.roomObjects,
      bindObject: (id, model) => instance.bindObject(id, model),
    }));
    window.addEventListener("game-state-changed", () => instance.refresh());
  }
})();
