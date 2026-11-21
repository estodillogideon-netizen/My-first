import * as THREE from 'three';
import { makeHuman, DESIGNS, townsperson, setFace, idle, look } from '../lib/human.js';
let a, b, c, d, e;
export function setup({ scene }) {
  scene.background = new THREE.Color(0x2a3040);
  scene.add(new THREE.HemisphereLight(0xbfd0ff, 0x303030, 1.2));
  const l = new THREE.DirectionalLight(0xffffff, 2.2); l.position.set(5, 10, 8); l.castShadow = true; scene.add(l);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), new THREE.MeshStandardMaterial({ color: 0x555a66 })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  a = makeHuman(DESIGNS.alex); a.position.set(-1.6, 0, 0); a.rotation.y = 0.35; scene.add(a);
  b = makeHuman(DESIGNS.alex); b.position.set(2.6, 0, -1); b.rotation.y = Math.PI * 0.8; scene.add(b);
  c = makeHuman(DESIGNS.suit); c.position.set(-6, 0, -3); scene.add(c);
  d = makeHuman(DESIGNS.police); d.position.set(6.5, 0, -3.5); d.rotation.y = -0.4; scene.add(d);
  e = makeHuman(townsperson(3)); e.position.set(-9, 0, -6); scene.add(e);
}
export function frame(t, { camera }) {
  idle(a, 0); idle(b, 0); idle(c, 0); idle(d, 0); idle(e, 0);
  setFace(a, { eyes: 'wide', brows: 'worried', mouth: 'open', look: [0.6, 0] }); look(a, 0.2, 0);
  camera.position.set(0, 4.5, 14); camera.lookAt(0, 3.4, 0);
}
