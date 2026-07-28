// facade.js — the simulation's entire physics vocabulary, in one list.
//
// Nothing under src/sim/ outside this directory names a physics engine. Every
// body created, moved, pushed, queried, jointed or destroyed goes through one
// of the operations below, which is what makes swapping matter-js for planck.js
// in phase 2 a change to this file rather than a change to twenty.
//
// To swap the backend: change the module specifier below. Both backends export
// the same names, so an A/B parity harness can import each one directly and
// diff the resulting tapes op-for-op.
//
// TWO OPERATIONS CARRY DESIGN MEANING AND MUST NOT BE COLLAPSED INTO ONE:
//
//   addVelocity(b, dv)   mass-independent gameplay push. A Gust shoves an anvil
//                        like a wizard. ~65 sites rely on this.
//   applyImpulse(b, j)   the real, mass-scaled physical impulse.
//
// See docs/superpowers/plans/velocity-classification.md for the classification
// of every velocity write in the simulation.

export {
  // lifecycle
  createEngine,
  destroyEngine,
  resetPhysRandom,
  physRandomSeed,

  // body making
  createCircle,
  createBox,
  createPolygon,
  newCollisionGroup,

  // membership
  addBody,
  removeBody,
  createComposite,
  addTo,
  removeFrom,
  allBodies,
  allJoints,
  bodyById,

  // body writes
  setPosition,
  setAngle,
  setAngularVelocity,
  setVelocity,
  addVelocity,
  applyImpulse,
  applyForce,
  setType,
  setFixedRotation,
  setFrictionAir,
  setFriction,
  setRestitution,
  setBodyGravityScale,
  setFixtureEnabled,
  setFilter,
  scaleBody,
  rescaleBody,

  // gravity
  setGravity,
  setGravityY,
  gravityY,
  worldGravityScale,

  // queries
  queryRay,
  queryRegion,
  queryPoint,
  queryRadius,
  queryCapsule,
  pointInBody,

  // joints
  createJoint,
  removeJoint,
  jointEnds,

  // step and contacts
  physStep,
  onContact,

  // readers
  positionOf,
  velocityOf,
  angleOf,
  angularVelocityOf,
  massOf,
  radiusOf,
} from './matter-backend.js';
