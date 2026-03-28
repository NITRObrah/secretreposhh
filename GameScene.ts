'use client';

import * as THREE from 'three';

export class GameScene {
  scene: THREE.Scene;
  walls: THREE.Box3[] = [];
  flickerLights: { light: THREE.PointLight; baseIntensity: number; speed: number }[] = [];
  deadBodies: THREE.Group[] = [];
  triggerZones: { box: THREE.Box3; id: string; triggered: boolean }[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  private wallMat(): THREE.MeshStandardMaterial {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d')!;
    x.fillStyle = '#1a1a1a';
    x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 300; i++) {
      x.fillStyle = `rgba(${25 + Math.random() * 20},${20 + Math.random() * 15},${18 + Math.random() * 12},${Math.random() * 0.5})`;
      x.fillRect(Math.random() * 128, Math.random() * 128, Math.random() * 5 + 1, Math.random() * 5 + 1);
    }
    for (let i = 0; i < 4; i++) {
      x.fillStyle = `rgba(50,10,10,${Math.random() * 0.25})`;
      x.beginPath();
      x.arc(Math.random() * 128, Math.random() * 128, Math.random() * 18 + 5, 0, Math.PI * 2);
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, metalness: 0.05 });
  }

  private floorMat(): THREE.MeshStandardMaterial {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    const x = c.getContext('2d')!;
    x.fillStyle = '#0d0d0d';
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 500; i++) {
      x.fillStyle = `rgba(${15 + Math.random() * 20},${12 + Math.random() * 15},${10 + Math.random() * 10},${Math.random() * 0.6})`;
      x.fillRect(Math.random() * 256, Math.random() * 256, Math.random() * 6 + 1, Math.random() * 6 + 1);
    }
    x.strokeStyle = 'rgba(20,18,15,0.4)';
    x.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 10);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, metalness: 0.05 });
  }

  private ceilMat(): THREE.MeshStandardMaterial {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const x = c.getContext('2d')!;
    x.fillStyle = '#080808';
    x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 200; i++) {
      x.fillStyle = `rgba(12,10,10,${Math.random() * 0.4})`;
      x.fillRect(Math.random() * 128, Math.random() * 128, Math.random() * 5, Math.random() * 5);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 8);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 1, metalness: 0 });
  }

  addWall(x: number, y: number, z: number, w: number, h: number, d: number, mat?: THREE.Material) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || this.wallMat());
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    this.scene.add(m);
    this.walls.push(new THREE.Box3().setFromObject(m));
    return m;
  }

  addFlickerLight(x: number, y: number, z: number, color: number, intensity: number, distance: number) {
    const l = new THREE.PointLight(color, intensity, distance);
    l.position.set(x, y, z);
    l.castShadow = true;
    this.scene.add(l);
    this.flickerLights.push({ light: l, baseIntensity: intensity, speed: 2 + Math.random() * 8 });
    return l;
  }

  addBody(x: number, z: number, pose: string) {
    const g = new THREE.Group();
    const bm = new THREE.MeshStandardMaterial({ color: 0x2a1a15, roughness: 0.9 });
    const sm = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.85 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), sm);
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), bm);
    const aL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.7, 6), bm);
    const aR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.7, 6), bm);
    const lL = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.8, 6), bm);
    const lR = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.8, 6), bm);

    switch (pose) {
      case 'lying':
        torso.rotation.z = Math.PI / 2; torso.position.set(0, 0.15, 0);
        head.position.set(-0.5, 0.15, 0); head.rotation.z = Math.PI / 2;
        aL.rotation.z = Math.PI / 2; aL.position.set(0, 0.05, 0.25);
        aR.rotation.z = Math.PI / 2; aR.position.set(0, 0.05, -0.25);
        lL.rotation.z = Math.PI / 2; lL.position.set(0.4, 0.08, 0.15);
        lR.rotation.z = Math.PI / 2; lR.position.set(0.4, 0.08, -0.15);
        break;
      case 'slumped':
        torso.position.y = 0.6; torso.rotation.x = 0.3;
        head.position.set(0, 1.15, -0.15); head.rotation.x = 0.5;
        aL.position.set(-0.4, 0.5, 0.1); aL.rotation.z = 0.3;
        aR.position.set(0.4, 0.5, 0.1); aR.rotation.z = -0.3;
        lL.position.set(-0.15, 0.1, -0.1); lR.position.set(0.15, 0.1, -0.1);
        break;
      case 'hanging':
        head.position.set(0, 0.55, 0);
        aL.position.set(-0.45, 0.2, 0); aL.rotation.z = 0.6;
        aR.position.set(0.45, 0.2, 0); aR.rotation.z = -0.6;
        lL.position.set(-0.15, -0.6, 0); lR.position.set(0.15, -0.6, 0);
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2, 4), new THREE.MeshStandardMaterial({ color: 0x3a2a10 }));
        rope.position.set(0, 1.55, 0); g.add(rope);
        break;
      case 'corner':
        torso.position.y = 0.5; torso.rotation.z = 0.2;
        head.position.set(0.15, 1.05, -0.2); head.rotation.x = 0.8;
        aL.position.set(-0.35, 0.3, 0); aL.rotation.z = 1.2;
        aR.position.set(0.3, 0.1, 0.2); aR.rotation.z = -0.8;
        lL.position.set(-0.15, 0.1, 0.1); lR.position.set(0.2, 0.1, 0);
        break;
      case 'table':
        torso.rotation.z = Math.PI / 2; torso.position.set(0, 1.05, 0);
        head.position.set(-0.5, 1.05, 0); head.rotation.z = Math.PI / 2;
        aL.rotation.z = Math.PI / 2; aL.position.set(0, 1.15, 0.35); aL.rotation.x = -0.8;
        aR.rotation.z = Math.PI / 2; aR.position.set(0, 1.15, -0.35); aR.rotation.x = 0.8;
        lL.rotation.z = Math.PI / 2; lL.position.set(0.5, 0.95, 0.15);
        lR.rotation.z = Math.PI / 2; lR.position.set(0.5, 0.95, -0.15);
        break;
      default:
        torso.position.y = 0.5; head.position.set(0, 1.1, 0);
        aL.position.set(-0.45, 0.5, 0); aR.position.set(0.45, 0.5, 0);
        lL.position.set(-0.15, 0.1, 0); lR.position.set(0.15, 0.1, 0);
    }

    g.add(torso, head, aL, aR, lL, lR);
    g.position.set(x, pose === 'hanging' ? 3 : 0, z);

    // Red glowing eyes on some bodies
    if (Math.random() > 0.4) {
      const eMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const eL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), eMat);
      const eR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 4), eMat);
      eL.position.set(-0.06, 0.02, 0.18);
      eR.position.set(0.06, 0.02, 0.18);
      head.add(eL, eR);
      g.userData.eyes = true;
      g.userData.headMesh = head;
    }

    g.userData.pose = pose;
    g.userData.sitUp = false;
    g.userData.sitT = 0;
    this.scene.add(g);
    this.deadBodies.push(g);
  }

  addBlood(x: number, z: number, size: number) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(size, 16),
      new THREE.MeshStandardMaterial({ color: 0x2a0000, roughness: 0.5, metalness: 0.3, transparent: true, opacity: 0.85 })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.01, z);
    this.scene.add(m);
  }

  addBloodWall(x: number, y: number, z: number, rotY: number = 0) {
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(
        new THREE.CircleGeometry(0.05 + Math.random() * 0.12, 8),
        new THREE.MeshStandardMaterial({ color: 0x3a0000, roughness: 0.7, transparent: true, opacity: 0.7 })
      );
      s.position.set(x + (Math.random() - 0.5) * 0.5, y + (Math.random() - 0.5) * 0.8, z);
      s.rotation.y = rotY;
      this.scene.add(s);
    }
  }

  addBodyPart(x: number, z: number) {
    const types = ['arm', 'head', 'leg'];
    const type = types[Math.floor(Math.random() * types.length)];
    const bm = new THREE.MeshStandardMaterial({ color: 0x2a1a15, roughness: 0.9 });
    let m: THREE.Mesh;
    if (type === 'arm') {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 6), bm);
      m.rotation.z = Math.random() * Math.PI;
    } else if (type === 'head') {
      m = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 6), bm);
    } else {
      m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.6, 6), bm);
      m.rotation.z = Math.random() * 0.8;
    }
    m.position.set(x, 0.1, z);
    m.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(m);
  }

  build() {
    // Floor & Ceiling
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), this.floorMat());
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), this.ceilMat());
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 4;
    this.scene.add(ceil);

    const w = this.wallMat();
    const wm = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 });
    const metalM = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.3, metalness: 0.7 });

    // ====== ROOM 1: ENTRANCE HALL ======
    this.addWall(-6, 2, -8, 0.5, 4, 16, w);
    this.addWall(6, 2, -8, 0.5, 4, 16, w);
    this.addWall(-3.5, 2, -16, 5, 4, 0.5, w);
    this.addWall(3.5, 2, -16, 5, 4, 0.5, w);
    this.addWall(-4, 2, 0, 4, 4, 0.5, w);
    this.addWall(4, 2, 0, 4, 4, 0.5, w);

    // Desk + chair
    this.addWall(0, 0.5, -4, 3, 1, 0.8, wm(0x1a1208));
    this.addWall(2, 0.4, -3, 0.8, 0.8, 0.8, wm(0x15100a));

    this.addFlickerLight(0, 3.5, -8, 0xff6633, 0.5, 8);
    this.addBody(-3, -12, 'lying');
    this.addBlood(-3, -12, 1.5);
    this.addBloodWall(5.8, 1.5, -10, 0);

    // ====== CORRIDOR 1 (north to Room 2) ======
    this.addWall(-3, 2, -8, 0.5, 4, 8, w);
    this.addWall(3, 2, -8, 0.5, 4, 8, w);

    // ====== ROOM 2: MORGUE ======
    this.addWall(-6, 2, -20, 0.5, 4, 8, w);
    this.addWall(6, 2, -20, 0.5, 4, 8, w);
    this.addWall(0, 2, -24, 12.5, 4, 0.5, w);

    for (let i = -1; i <= 1; i++) {
      this.addWall(i * 3, 1.1, -20, 2, 0.1, 2.5, metalM);
      this.addBody(i * 3, -20, 'table');
    }
    this.addFlickerLight(0, 3.5, -20, 0xff0000, 0.8, 10);
    this.addBlood(0, -20, 1.2);

    // ====== SECRET ROOM behind morgue ======
    this.addWall(-6, 2, -28, 0.5, 4, 8, w);
    this.addWall(6, 2, -28, 0.5, 4, 8, w);
    this.addWall(0, 2, -32, 12.5, 4, 0.5, w);
    this.addWall(-2.5, 2, -24, 2.5, 3, 0.5, w);
    this.addWall(2.5, 2, -24, 2.5, 3, 0.5, w);

    // Pentagram
    const pent = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide })
    );
    pent.rotation.x = -Math.PI / 2; pent.position.set(0, 0.02, -28);
    this.scene.add(pent);
    this.addBody(0, -28, 'lying');
    this.addBlood(0, -28, 2.0);
    this.addFlickerLight(0, 3.5, -28, 0x660066, 0.5, 10);
    this.triggerZones.push({
      box: new THREE.Box3(new THREE.Vector3(-4, 0, -30), new THREE.Vector3(4, 4, -26)),
      id: 'secret_scare', triggered: false
    });

    // ====== CORRIDOR 2 (east from Room 1 to Room 3) ======
    this.addWall(6, 2, 2, 16, 4, 0.5, w);
    this.addWall(6, 0.5, 0, 4, 1, 0.5, w);
    this.addWall(6, 2.5, 0, 4, 3, 0.5, w);

    // ====== ROOM 3: CELL BLOCK ======
    this.addWall(6, 2, 8, 0.5, 4, 20, w);
    this.addWall(16, 2, 8, 0.5, 4, 20, w);
    this.addWall(11, 2, 18, 10.5, 4, 0.5, w);
    this.addWall(11, 2, 8, 4, 4, 0.5, w);
    this.addWall(11, 0.5, 8, 6, 1, 0.5, w);

    // Cell dividers
    for (let i = 0; i < 2; i++) {
      this.addWall(11, 2.5, 11 + i * 5, 9, 3.5, 0.2, wm(0x222222));
    }

    this.addBody(9, 10, 'slumped');
    this.addBody(13, 14, 'corner');
    this.addBody(9, 16, 'lying');
    this.addBlood(9, 10, 1.0);
    this.addBlood(13, 14, 0.8);
    this.addBody(14, 12, 'hanging');
    this.addFlickerLight(11, 3.5, 13, 0x33ff33, 0.25, 12);

    // ====== CORRIDOR 3 (south from Room 3) ======
    this.addWall(16, 2, 18, 0.5, 4, 20, w);
    this.addWall(22, 2, 18, 0.5, 4, 20, w);

    this.addBodyPart(19, 20);
    this.addBodyPart(21, 24);
    this.addBodyPart(18, 27);
    this.addBlood(19, 22, 1.5);
    this.addBlood(20, 26, 1.8);

    for (let i = 0; i < 3; i++) {
      this.addFlickerLight(19, 3.5, 20 + i * 6, 0xffaa44, 0.3, 6);
    }

    // ====== ROOM 4: OPERATING ROOM ======
    this.addWall(16, 2, 38, 0.5, 4, 16, w);
    this.addWall(22, 2, 38, 0.5, 4, 16, w);
    this.addWall(19, 2, 46, 6.5, 4, 0.5, w);
    this.addWall(16, 2, 38, 0.5, 2, 2, w);

    this.addWall(19, 1, 42, 3, 0.15, 5, metalM);
    this.addBody(19, 42, 'table');
    this.addWall(19, 0.85, 40, 1.5, 0.05, 0.5, metalM);
    this.addFlickerLight(19, 3.8, 42, 0xffffff, 1.0, 10);
    this.addBlood(19, 42, 2.5);
    this.addBlood(20, 44, 1.2);
    this.addBloodWall(21.8, 2, 40, 0);
    this.triggerZones.push({
      box: new THREE.Box3(new THREE.Vector3(16, 0, 40), new THREE.Vector3(22, 4, 44)),
      id: 'surgery_scare', triggered: false
    });

    // ====== ROOM 5: CHAPEL (west from Room 1) ======
    this.addWall(-6, 2, -8, 0.5, 4, 16, w);
    this.addWall(-16, 2, 4, 0.5, 4, 24, w);
    this.addWall(-11, 2, 16, 10.5, 4, 0.5, w);
    this.addWall(-11, 2.5, -8, 4, 3, 0.5, w);
    this.addWall(-11, 0.5, -8, 4, 1, 0.5, w);

    this.addWall(-11, 0.85, 12, 4, 1.7, 1.5, wm(0x2a1a0a));
    const crossM = wm(0x111111);
    const cv = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), crossM);
    cv.position.set(-11, 1.95, 12);
    this.scene.add(cv);
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.15), crossM);
    ch.position.set(-11, 2.3, 12); ch.rotation.z = Math.PI;
    this.scene.add(ch);

    for (let i = 0; i < 4; i++) {
      const pew = new THREE.Mesh(new THREE.BoxGeometry(3, 0.5, 0.8), wm(0x1a0e05));
      pew.position.set(-9 + (i % 2) * 4, 0.25, 5 + Math.floor(i / 2) * 3);
      pew.rotation.z = (i % 2 === 0) ? 0.3 : -0.4;
      this.scene.add(pew);
    }

    this.addBody(-13, 5, 'lying');
    this.addBody(-9, 8, 'slumped');
    this.addBlood(-13, 5, 1.3);
    this.addFlickerLight(-11, 2.5, 12, 0xff8844, 0.4, 8);
    this.triggerZones.push({
      box: new THREE.Box3(new THREE.Vector3(-15, 0, 10), new THREE.Vector3(-7, 4, 15)),
      id: 'chapel_scare', triggered: false
    });

    // ====== BOUNDARY WALLS ======
    this.addWall(0, 2, -40, 80, 4, 1, w);
    this.addWall(0, 2, 50, 80, 4, 1, w);
    this.addWall(-40, 2, 0, 1, 4, 90, w);
    this.addWall(40, 2, 0, 1, 4, 90, w);

    // Spawn player area dim light
    const spawnLight = new THREE.PointLight(0x222244, 0.3, 6);
    spawnLight.position.set(0, 3, -2);
    this.scene.add(spawnLight);
  }

  updateFlicker(time: number) {
    for (const f of this.flickerLights) {
      const v = Math.sin(time * f.speed) * 0.5 + 0.5;
      const flicker = Math.random() < 0.03 ? 0 : 1;
      f.light.intensity = f.baseIntensity * v * flicker;
    }
  }

  updateBodies(playerPos: THREE.Vector3) {
    for (const b of this.deadBodies) {
      if (b.userData.eyes && b.userData.headMesh) {
        const wp = new THREE.Vector3();
        b.userData.headMesh.getWorldPosition(wp);
        const dir = playerPos.clone().sub(wp).normalize();
        // Eyes follow player slightly
        b.userData.headMesh.lookAt(playerPos.x, wp.y, playerPos.z);
      }
      if (!b.userData.sitUp && b.userData.pose === 'lying') {
        const dist = new THREE.Vector2(b.position.x - playerPos.x, b.position.z - playerPos.z).length();
        if (dist < 3.5) {
          b.userData.sitUp = true;
          b.userData.sitT = 0;
        }
      }
      if (b.userData.sitUp && b.userData.sitT < 1) {
        b.userData.sitT = Math.min((b.userData.sitT || 0) + 0.03, 1);
        b.rotation.x = -(b.userData.sitT) * 0.9;
        b.position.y = (b.userData.sitT) * 0.4;
      }
    }
  }

  spawnGhost(cam: THREE.Camera) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 2.2, 8), bodyMat);
    g.add(body);

    const eMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), eMat);
    eL.position.set(-0.07, 0.65, 0.14);
    const eR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), eMat);
    eR.position.set(0.07, 0.65, 0.14);
    g.add(eL, eR);

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const angle = (Math.random() > 0.5 ? 1 : -1) * (0.7 + Math.random() * 0.8);
    const rd = new THREE.Vector3(
      dir.x * Math.cos(angle) - dir.z * Math.sin(angle),
      0,
      dir.x * Math.sin(angle) + dir.z * Math.cos(angle)
    ).normalize();
    const dist = 5 + Math.random() * 4;
    g.position.set(cam.position.x + rd.x * dist, 1, cam.position.z + rd.z * dist);
    g.lookAt(cam.position.x, 1, cam.position.z);
    this.scene.add(g);

    let t = 0;
    const animate = () => {
      t += 0.016;
      if (t > 1.5) { this.scene.remove(g); return; }
      const p = t / 1.5;
      bodyMat.opacity = p < 0.2 ? (p / 0.2) * 0.5 : ((1 - p) / 0.8) * 0.5;
      requestAnimationFrame(animate);
    };
    animate();
  }
}
