import * as THREE from 'three';
const ROAD_WIDTH = 11.2;
const ROAD_LENGTH = 230;
export function makePbrMaterial(color: number, roughness = 0.5, metalness = 0.05) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function createProceduralCar(color = 0x667783, scale = 1): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TrafficVehicle';
  group.scale.setScalar(scale);

  const paintMaterial = makePbrMaterial(color, 0.24, 0.3);
  const trimMaterial = makePbrMaterial(0x11171c, 0.48, 0.45);
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x10252d,
    roughness: 0.1,
    metalness: 0.62,
    transparent: true,
    opacity: 0.78,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.54, 4.3), paintMaterial);
  body.position.y = 0.78;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // A layered body shell gives the traffic stream a readable silhouette at
  // distance while keeping the model procedural and cheap to render.
  const beltline = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 2.95), trimMaterial);
  beltline.position.set(0, 1.03, 0.08);
  group.add(beltline);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.58, 2.05), glassMaterial);
  cabin.position.set(0, 1.25, -0.16);
  cabin.castShadow = true;
  group.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 1.82), paintMaterial);
  roof.position.set(0, 1.58, -0.16);
  roof.castShadow = true;
  group.add(roof);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.43, 0.33, 0.035),
    new THREE.MeshStandardMaterial({
      color: 0x8fb2bf,
      transparent: true,
      opacity: 0.54,
      roughness: 0.08,
      metalness: 0.3,
    }),
  );
  windshield.position.set(0, 1.31, -1.18);
  windshield.rotation.x = -0.14;
  group.add(windshield);

  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.43, 0.3, 0.035), glassMaterial);
  rearGlass.position.set(0, 1.31, 0.86);
  rearGlass.rotation.x = 0.12;
  group.add(rearGlass);

  [-1, 1].forEach((side) => {
    const sideWindow = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 1.24), glassMaterial);
    sideWindow.position.set(side * 0.826, 1.31, -0.16);
    group.add(sideWindow);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.2), trimMaterial);
    mirror.position.set(side * 1.02, 1.25, -0.78);
    mirror.castShadow = true;
    group.add(mirror);
  });

  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 0.2), makePbrMaterial(0x171b20, 0.7, 0.1));
  bumper.position.set(0, 0.58, -2.12);
  group.add(bumper);

  const rearBumper = bumper.clone();
  rearBumper.position.z = 2.12;
  group.add(rearBumper);

  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x05080a, roughness: 0.4, metalness: 0.7 });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.035), grilleMaterial);
  grille.position.set(0, 0.73, -2.225);
  group.add(grille);
  [-0.24, 0, 0.24].forEach((x) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.12, 0.045),
      makePbrMaterial(0x9eafb2, 0.3, 0.78),
    );
    bar.position.set(x, 0.73, -2.245);
    group.add(bar);
  });

  const headlampMaterial = new THREE.MeshStandardMaterial({
    color: 0xe8f6ff,
    emissive: 0xa6d8ff,
    emissiveIntensity: 2.8,
    roughness: 0.2,
  });
  const tailLampMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3245,
    emissive: 0xc51022,
    emissiveIntensity: 1.8,
    roughness: 0.24,
  });
  const indicatorMaterial = new THREE.MeshStandardMaterial({
    color: 0xffbb62,
    emissive: 0xff791e,
    emissiveIntensity: 1.4,
    roughness: 0.24,
  });
  [-0.64, 0.64].forEach((x) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.13, 0.08), headlampMaterial);
    lamp.position.set(x, 0.87, -2.16);
    group.add(lamp);
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.085), indicatorMaterial);
    indicator.position.set(x + (x < 0 ? 0.23 : -0.23), 0.86, -2.17);
    group.add(indicator);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.08), tailLampMaterial);
    tail.position.set(x, 0.88, 2.16);
    group.add(tail);
  });

  const wheelMaterial = makePbrMaterial(0x13171b, 0.82, 0.04);
  const wheelGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.23, 20);
  const hubMaterial = makePbrMaterial(0x8e9ba0, 0.28, 0.76);
  [-0.98, 0.98].forEach((x) =>
    [-1.36, 1.36].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.5, z);
      wheel.castShadow = true;
      group.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.245, 16), hubMaterial);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x + (x < 0 ? -0.012 : 0.012), 0.5, z);
      group.add(hub);
    }),
  );

  return group;
}

export function createRoad(scene: THREE.Scene) {
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_WIDTH, ROAD_LENGTH),
    new THREE.MeshStandardMaterial({ color: 0x3d454b, roughness: 0.9, metalness: 0.03 }),
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -ROAD_LENGTH / 2 + 25);
  road.receiveShadow = true;
  scene.add(road);

  const shoulderMaterial = new THREE.MeshStandardMaterial({
    color: 0x77838a,
    roughness: 0.86,
    metalness: 0.03,
  });
  [-1, 1].forEach((side) => {
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, ROAD_LENGTH), shoulderMaterial);
    shoulder.position.set(side * (ROAD_WIDTH / 2 + 0.25), 0.025, road.position.z);
    shoulder.receiveShadow = true;
    scene.add(shoulder);
  });

  const laneMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f8f7,
    roughness: 0.6,
    emissive: 0x7d969c,
    emissiveIntensity: 0.08,
  });
  const laneMarkers: THREE.Mesh[] = [];
  [-1.55, 1.55].forEach((x) => {
    for (let index = 0; index < 24; index += 1) {
      const marker = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.025, 3.6), laneMaterial);
      marker.position.set(x, 0.04, 18 - index * 9.6);
      marker.receiveShadow = true;
      scene.add(marker);
      laneMarkers.push(marker);
    }
  });

  const sideLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x6faeb4,
    emissive: 0x2c747a,
    emissiveIntensity: 0.55,
  });
  const sideLights: THREE.Mesh[] = [];
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 31; index += 1) {
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), sideLightMaterial);
      light.position.set(side * (ROAD_WIDTH / 2 + 0.45), 0.16, 22 - index * 7.4);
      scene.add(light);
      sideLights.push(light);
    }
  });

  // 秋石高架路两侧的连续绿化带：用低矮灌木、行道树和护栏把车道
  // 与城市楼群分开，形成杭州高架常见的“道路 + 绿岛 + 城市天际线”层次。
  const landscapeObjects: THREE.Object3D[] = [];
  const grassMaterial = makePbrMaterial(0x4d775d, 0.94, 0.01);
  const guardrailMaterial = makePbrMaterial(0x697c80, 0.42, 0.58);
  const trunkMaterial = makePbrMaterial(0x5b4936, 0.98, 0.01);
  const foliageMaterials = [
    makePbrMaterial(0x2f6b4f, 0.92, 0.01),
    makePbrMaterial(0x3f8058, 0.9, 0.01),
    makePbrMaterial(0x5d9564, 0.88, 0.01),
  ];
  const hedgeGeometry = new THREE.BoxGeometry(0.92, 0.64, 4.7);
  const trunkGeometry = new THREE.CylinderGeometry(0.08, 0.12, 1.1, 8);
  const canopyGeometry = new THREE.IcosahedronGeometry(0.58, 1);
  const canopySmallGeometry = new THREE.IcosahedronGeometry(0.38, 1);

  [-1, 1].forEach((side) => {
    const beltX = side * (ROAD_WIDTH / 2 + 1.45);
    const belt = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, ROAD_LENGTH), grassMaterial);
    belt.position.set(beltX, -0.025, road.position.z);
    belt.receiveShadow = true;
    scene.add(belt);
    // This is one continuous parcel aligned with the road. Keep it anchored
    // to the road instead of wrapping it like a short prop; wrapping a full
    // 230 m mesh creates a visible empty seam beneath the flowerbeds.

    // Low hedge blocks make the greenbelt read continuously even at speed.
    for (let index = 0; index < 32; index += 1) {
      const hedge = new THREE.Mesh(hedgeGeometry, foliageMaterials[index % foliageMaterials.length]);
      hedge.position.set(side * (6.55 + (index % 2) * 0.2), 0.32, 20 - index * 7.35);
      hedge.rotation.y = side * (index % 2 ? 0.06 : -0.04);
      hedge.castShadow = true;
      hedge.receiveShadow = true;
      scene.add(hedge);
      landscapeObjects.push(hedge);
    }

    // Repeating trees add a recognizable planted boulevard edge without
    // introducing collision geometry into the playable road surface.
    for (let index = 0; index < 26; index += 1) {
      const tree = new THREE.Group();
      const z = 18 - index * 8.9;
      const x = side * (7.35 + (index % 3) * 0.22);
      tree.position.set(x, 0, z);
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.62;
      trunk.castShadow = true;
      tree.add(trunk);
      const canopy = new THREE.Mesh(canopyGeometry, foliageMaterials[(index + 1) % foliageMaterials.length]);
      canopy.position.set(0, 1.28 + (index % 2) * 0.08, 0);
      canopy.scale.set(1.05, 1.18, 1.05);
      canopy.castShadow = true;
      tree.add(canopy);
      const lowerCanopy = new THREE.Mesh(
        canopySmallGeometry,
        foliageMaterials[(index + 2) % foliageMaterials.length],
      );
      lowerCanopy.position.set(side * 0.22, 0.98, 0.18);
      lowerCanopy.castShadow = true;
      tree.add(lowerCanopy);
      scene.add(tree);
      landscapeObjects.push(tree);
    }

    // 高架外沿护栏，保持路侧轮廓清晰并强化高架道路的空间感。
    const railX = side * (ROAD_WIDTH / 2 + 2.55);
    [0.68, 1.02].forEach((height, railIndex) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.12, ROAD_LENGTH), guardrailMaterial);
      rail.position.set(railX, height, road.position.z);
      rail.castShadow = true;
      scene.add(rail);
      // The guardrail spans the whole authored road. It stays anchored so it
      // cannot disappear when the per-prop scrolling loop crosses its wrap
      // threshold; short posts continue to scroll in front of it.
      if (railIndex === 1) rail.rotation.z = side * 0.01;
    });
    for (let index = 0; index < 31; index += 1) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.15, 0.1), guardrailMaterial);
      post.position.set(railX, 0.55, 22 - index * 7.7);
      post.castShadow = true;
      scene.add(post);
      landscapeObjects.push(post);
    }
  });

  // 道路标识：把游戏场景明确为“秋石高架路”，作为可读的地标放在右侧绿化带。
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 640;
  signCanvas.height = 210;
  const signContext = signCanvas.getContext('2d');
  if (signContext) {
    signContext.fillStyle = '#146b4d';
    signContext.fillRect(0, 0, signCanvas.width, signCanvas.height);
    signContext.strokeStyle = '#f1f7e9';
    signContext.lineWidth = 8;
    signContext.strokeRect(8, 8, signCanvas.width - 16, signCanvas.height - 16);
    signContext.fillStyle = '#f7faef';
    signContext.font = '700 58px "Microsoft YaHei", sans-serif';
    signContext.textAlign = 'center';
    signContext.textBaseline = 'middle';
    signContext.fillText('杭州 · 秋石高架路', signCanvas.width / 2, 72);
    signContext.font = '500 24px Arial, sans-serif';
    signContext.letterSpacing = '4px';
    signContext.fillText('HANGZHOU  /  QIUSHI ELEVATED ROAD', signCanvas.width / 2, 154);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const signGroup = new THREE.Group();
  signGroup.position.set(7.55, 3.28, -38);
  const signBacking = new THREE.Mesh(
    new THREE.BoxGeometry(3.25, 1.02, 0.1),
    makePbrMaterial(0x253e38, 0.58, 0.2),
  );
  signBacking.castShadow = true;
  signGroup.add(signBacking);
  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(3.08, 0.92),
    new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.58, metalness: 0.05 }),
  );
  signFace.position.z = 0.056;
  signGroup.add(signFace);
  [-1, 1].forEach((side) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.2, 0.09), guardrailMaterial);
    post.position.set(side * 1.24, -1.58, -0.02);
    post.castShadow = true;
    signGroup.add(post);
  });
  scene.add(signGroup);
  landscapeObjects.push(signGroup);

  const updateRoad = (delta: number, speed: number) => {
    const dz = speed * delta;
    laneMarkers.forEach((marker) => {
      marker.position.z += dz;
      if (marker.position.z > 25) marker.position.z -= 230;
    });
    sideLights.forEach((light) => {
      light.position.z += dz;
      if (light.position.z > 25) light.position.z -= 230;
    });
    landscapeObjects.forEach((object) => {
      object.position.z += dz;
      if (object.position.z > 28) object.position.z -= 230;
    });
  };
  return { updateRoad };
}

export function createCityBackdrop(scene: THREE.Scene) {
  const city = new THREE.Group();
  city.name = 'CityBackdrop';
  scene.add(city);

  const buildingMaterials = [
    makePbrMaterial(0x60737c, 0.86, 0.06),
    makePbrMaterial(0x71858d, 0.82, 0.08),
    makePbrMaterial(0x71808f, 0.9, 0.05),
    makePbrMaterial(0x86989c, 0.84, 0.06),
  ];
  const roofMaterial = makePbrMaterial(0x4a5b63, 0.78, 0.12);
  const windowMaterials = [
    new THREE.MeshStandardMaterial({
      color: 0xffdf9a,
      emissive: 0xd99543,
      emissiveIntensity: 0.28,
      roughness: 0.44,
    }),
    new THREE.MeshStandardMaterial({
      color: 0x9edbd7,
      emissive: 0x3c9997,
      emissiveIntensity: 0.22,
      roughness: 0.46,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xb9d6f1,
      emissive: 0x6285b6,
      emissiveIntensity: 0.18,
      roughness: 0.48,
    }),
  ];
  const buildings: THREE.Object3D[] = [];
  const cityLights: THREE.Object3D[] = [];
  let seed = 27;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  [-1, 1].forEach((side) => {
    for (let index = 0; index < 15; index += 1) {
      const width = 3.6 + random() * 4.6;
      const depth = 7 + random() * 8;
      const height = 5 + random() * 13;
      // Keep the city parcel behind the greenbelt and elevated-road guardrail.
      // The previous range could place a wide building with its inner face
      // inside the road edge, making the facade visibly overlap the playable
      // surface from the chase camera.
      const x = side * (12.6 + random() * 8.8);
      const z = -18 - index * 12.5 - random() * 8;
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterials[index % buildingMaterials.length],
      );
      // Lift the base a touch above the road-side parcel so the facade does
      // not z-fight with the ground plane when it passes the camera.
      building.position.set(x, height / 2 + 0.04, z);
      building.castShadow = true;
      building.receiveShadow = true;
      city.add(building);
      buildings.push(building);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.82, 0.16, depth * 0.82), roofMaterial);
      roof.position.set(x, height + 0.08, z);
      city.add(roof);
      buildings.push(roof);

      if (index % 3 === 0) {
        const antenna = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 1.4 + random() * 1.6, 0.06),
          windowMaterials[1],
        );
        antenna.position.set(x + side * width * 0.16, height + 0.85, z);
        city.add(antenna);
      }

      const rows = Math.min(5, Math.max(2, Math.floor(height / 2.7)));
      const columns = Math.max(2, Math.floor(width / 1.35));
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          if (random() < 0.3) continue;
          const window = new THREE.Mesh(
            new THREE.BoxGeometry(0.045, 0.16 + random() * 0.05, 0.36),
            windowMaterials[(index + row + column) % windowMaterials.length],
          );
          window.position.set(
            x - side * (width / 2 + 0.028),
            1.05 + row * 2.2,
            z - depth / 2 + 1.05 + column * 1.15,
          );
          city.add(window);
        }
      }
    }
  });

  // 杭州远景：一条安静的钱塘江色带和钱江新城双塔轮廓。它们位于道路
  // 尽头，不参与碰撞，只负责把泛化楼群变成更容易辨认的杭州城市天际线。
  const riverMaterial = new THREE.MeshStandardMaterial({
    color: 0x6fabb4,
    roughness: 0.34,
    metalness: 0.08,
    transparent: true,
    opacity: 0.72,
  });
  const river = new THREE.Mesh(new THREE.PlaneGeometry(64, 13), riverMaterial);
  river.position.set(0, 5.4, -178);
  city.add(river);
  buildings.push(river);
  const riverHighlight = new THREE.Mesh(
    new THREE.BoxGeometry(64, 0.08, 0.9),
    new THREE.MeshStandardMaterial({
      color: 0xb5d9d2,
      emissive: 0x6fa9a2,
      emissiveIntensity: 0.18,
      roughness: 0.32,
    }),
  );
  riverHighlight.position.set(0, 8.15, -177.85);
  city.add(riverHighlight);
  buildings.push(riverHighlight);

  const landmarkMaterial = makePbrMaterial(0x708a91, 0.72, 0.16);
  const landmarkGlass = new THREE.MeshStandardMaterial({
    color: 0x9edbd7,
    emissive: 0x3c9997,
    emissiveIntensity: 0.22,
    roughness: 0.38,
    metalness: 0.18,
  });
  [-1, 1].forEach((side) => {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(1.9, 19.5, 3.2), landmarkMaterial);
    tower.position.set(side * 9.8, 9.75, -171);
    tower.castShadow = true;
    tower.receiveShadow = true;
    city.add(tower);
    buildings.push(tower);
    for (let row = 0; row < 8; row += 1) {
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.11, 3.28), landmarkGlass);
      band.position.set(side * 9.8, 2.4 + row * 2.2, -169.34);
      city.add(band);
      buildings.push(band);
    }
    const crown = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 3.45), landmarkMaterial);
    crown.position.set(side * 9.8, 19.72, -171);
    city.add(crown);
    buildings.push(crown);
  });
  const skylineBridge = new THREE.Mesh(
    new THREE.BoxGeometry(25, 0.32, 1.15),
    makePbrMaterial(0x536d73, 0.72, 0.18),
  );
  skylineBridge.position.set(0, 3.1, -170.2);
  city.add(skylineBridge);
  buildings.push(skylineBridge);

  const lightMaterials = [windowMaterials[0], windowMaterials[1]];
  [-1, 1].forEach((side) => {
    for (let index = 0; index < 20; index += 1) {
      const light = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08 + random() * 0.12, 0.9 + random() * 1.8),
        lightMaterials[index % lightMaterials.length],
      );
      light.position.set(
        side * (6.35 + random() * 1.4),
        0.32 + random() * 1.15,
        20 - index * 10.5 - random() * 5,
      );
      city.add(light);
      cityLights.push(light);
    }
  });

  const updateCity = (delta: number, speed: number) => {
    const buildingDrift = speed * delta * 0.08;
    buildings.forEach((building) => {
      building.position.z += buildingDrift;
      if (building.position.z > 30) building.position.z -= 220;
    });
    const lightDrift = speed * delta * 0.72;
    cityLights.forEach((light) => {
      light.position.z += lightDrift;
      if (light.position.z > 28) light.position.z -= 230;
    });
  };
  return { updateCity };
}

export function configureClone(root: THREE.Object3D, targetWidth = 2.15) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if ('roughness' in material) material.roughness = Math.min(Number(material.roughness) || 0.5, 0.65);
      });
    }
  });
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const width = Math.max(size.x, size.z);
  if (width > 0) root.scale.multiplyScalar(targetWidth / width);
  root.position.sub(center.multiply(root.scale));
  root.position.y -= new THREE.Box3().setFromObject(root).min.y;
}
