// Object configuration for the room: types, models, and placement rules.
//
// classes:
//   "slab"  - free-standing object placed on a slab; occupies discrete slab cells
//   "onObject" - object placed on top of another object's surface
//
// Each entry describes how the object is rendered and how it can be placed:
//   model        - URL of the glb model
//   scale        - model scale factor
//   baseY        - y coordinate of the model's bottom in model units
//   surfaceY     - (onObject-capable objects only) height of the usable top
//                  surface above the object's base, in model units. Other
//                  objects may be stacked here.
//   supportsOnTop - if true, other objects can be placed on top of this one
//   startCell    - (slab objects) preferred first placement when purchased
//   rotateSteps  - how many 90 degree rotations are distinct (visual only)

window.ROOM_OBJECT_TYPES = {
  table: {
    label: "Table",
    class: "slab",
    model: "./models/table.glb",
    scale: 2,
    baseY: -0.279,
    supportsOnTop: true,
    surfaceY: 0.275,
    rotateSteps: 4,
  },
  plant: {
    label: "Plant",
    class: "onObject",
    model: "./models/plant.glb",
    scale: 1,
    baseY: -0.952,
    supportsOnTop: false,
    rotateSteps: 4,
  },
  lamp: {
    label: "Lamp",
    class: "onObject",
    model: "./models/lamp.glb",
    scale: 1,
    baseY: -0.951,
    supportsOnTop: false,
    glow: {
      color: 0xffb46b,
      intensity: 1.2,
      distance: 6,
      yOffset: 0.5,
    },
    rotateSteps: 4,
  },
};

// Default position for a newly purchased object: the center slab if free,
// otherwise the first free slab in the room's slab order.
function defaultPlacementFor(typeId, slabs, occupied) {
  const type = window.ROOM_OBJECT_TYPES[typeId];
  if (!type) return null;
  if (type.class === "onObject") {
    // prefer the table's top surface
    const host = occupied.find((o) => window.ROOM_OBJECT_TYPES[o.type]?.supportsOnTop);
    return host ? { on: host.id } : null;
  }
  const cell = slabs.find(
    (c) => !occupied.some((o) => o.cell && o.cell[0] === c[0] && o.cell[1] === c[1])
  );
  return cell ? { cell } : null;
}

window.RoomConfig = { defaultPlacementFor };
