import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';

import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';

class BasicWorldDemo {
  constructor() {
    this.Initialize();
  }

  Initialize() {
    this.threejs = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.threejs.shadowMap.enabled = true;
    this.threejs.shadowMap.type = THREE.PCFSoftShadowMap;
    this.threejs.setPixelRatio(window.devicePixelRatio);
    this.threejs.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(this.threejs.domElement);

    const position = { x: 70, y: 70, z: 0 };

    const fov = 60;
    const aspect = 1920 / 1080;
    const near = 1.0;
    const far = 1000.0;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(95, 70, 0);

    this.scene = new THREE.Scene();

    // visualizor sphere
    const visualizorSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    visualizorSphere.name = 'visualizorSphere';
    this.scene.add(visualizorSphere);
    this.visualizorSphere = this.scene.children[
      this.SceneNameFinder('visualizorSphere')
    ];

    // create light
    let light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(position.x, position.y, position.z);
    light.target.position.set(0, 0, 0);
    light.castShadow = true;
    light.shadow.bias = -0.001;
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 1;
    light.shadow.camera.far = 200.0;
    light.shadow.camera.left = 150;
    light.shadow.camera.right = -150;
    light.shadow.camera.top = 150;
    light.shadow.camera.bottom = -150;
    this.scene.add(light);

    light = new THREE.AmbientLight(0x101010, 0.1);
    this.scene.add(light);

    // visualize where the light position is
    const lightBall = new THREE.Mesh(
      new THREE.SphereGeometry(2, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
      })
    );
    lightBall.castShadow = false;
    lightBall.receiveShadow = false;
    lightBall.position.set(position.x, position.y, position.z);
    this.scene.add(lightBall);

    // imported from threejs documentation
    const controls = new OrbitControls(this.camera, this.threejs.domElement);
    controls.target.set(0, 20, 0);
    controls.update();

    // loads a skybox texture
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
      './resources/posx.jpg',
      './resources/negx.jpg',
      './resources/posy.jpg',
      './resources/negy.jpg',
      './resources/posz.jpg',
      './resources/negz.jpg',
    ]);
    this.scene.background = texture;

    // creates a plane
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100, 10, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
      })
    );
    plane.castShadow = false;
    plane.receiveShadow = true;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // creates 256 objects (16^2) and assigns them to a group
    const sphereGroup = new THREE.Group();
    sphereGroup.name = 'sphereGroup';

    for (let x = -8; x < 8; x++) {
      for (let y = -8; y < 8; y++) {
        const sphere = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1),
          new THREE.MeshStandardMaterial({
            color: 0x808080,
          })
        );
        sphere.position.set(
          Math.random() + x * 5,
          Math.random() * 4.0 + 2.0,
          Math.random() + y * 5
        );
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        sphere.name = 'inactive';
        sphereGroup.add(sphere);
      }
    }

    // adds the group to the scene
    this.scene.add(sphereGroup);
    this.sphereGroup = this.scene.children[this.SceneNameFinder('sphereGroup')];

    // create event listners for when the window resizes and the mouse moves
    window.addEventListener('resize', () => this.OnWindowResize(), false);
    window.addEventListener('mousemove', (e) => this.onMouseMove(e), false);
    window.addEventListener('click', () => this.onclickObject(), false);

    this.pressedKeys = {
      w: {
        func: () => (this.selectedObject.object.position.x -= 0.4),
        protect: true,
      },
      d: {
        func: () => (this.selectedObject.object.position.z -= 0.4),
        protect: true,
      },
      s: {
        func: () => (this.selectedObject.object.position.x += 0.4),
        protect: true,
      },
      a: {
        func: () => (this.selectedObject.object.position.z += 0.4),
        protect: true,
      },
      q: {
        func: () => (this.selectedObject.object.position.y += 0.4),
        protect: true,
      },
      e: {
        func: () => (this.selectedObject.object.position.y -= 0.4),
        protect: true,
      },
      r: {
        func: () => {
          this.randomCordsX = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 30
          );
          this.randomCordsY = Math.ceil(3 + Math.random() * (6 - 3));
          this.randomCordsZ = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 30
          );
          const position = this.selectedObject.object.position;
          position.x = Math.floor(position.x);
          position.y = Math.floor(position.y);
          position.z = Math.floor(position.z);
          this.pressedKeys.r.status = 'active';
        },
        status: 'inactive',
        protect: true,
      },
      1: {
        func: () =>
          this.startTheParty
            ? (this.startTheParty = false)
            : (this.startTheParty = true),
        protect: false,
      },
    };

    window.addEventListener('keypress', (e) => {
      if (this.pressedKeys[e.key].protect && this.selectedObject) {
        this.pressedKeys[e.key].func();
      } else if (!this.pressedKeys[e.key].protect) {
        this.pressedKeys[e.key].func();
      }
    });

    // used to get mouse x/y and create raycaster
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // begins the animation process
    this.RAF();

    // console.log all the scenes children
    console.log(this.scene.children);
    console.log(this.camera);
  }

  SceneNameFinder(string) {
    for (let x = 0; x < this.scene.children.length; x++) {
      if (this.scene.children[x].name === string) {
        return x;
      }
    }
    return;
  }

  onMouseMove(e) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  OnWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.threejs.setSize(window.innerWidth, window.innerHeight);
  }

  RandomSelectedObjectPosition() {
    // 6 > y > 3
    // 35 > x > 0 && z
    if (this.selectedObject && this.pressedKeys.r.status === 'active') {
      const position = this.selectedObject.object.position;
      let check = 0;

      position.x > this.randomCordsX && position.x > this.randomCordsX + 1
        ? (position.x -= 10 / 100)
        : position.x < this.randomCordsX && position.x < this.randomCordsX - 1
        ? (position.x += 10 / 100)
        : check++;

      position.y > this.randomCordsY && position.y > this.randomCordsY + 1
        ? (position.y -= 10 / 100)
        : position.y < this.randomCordsY && position.y < this.randomCordsY - 1
        ? (position.y += 10 / 100)
        : check++;

      position.z > this.randomCordsZ && position.z > this.randomCordsZ + 1
        ? (position.z -= 10 / 100)
        : position.z < this.randomCordsZ && position.z < this.randomCordsZ - 1
        ? (position.z += 10 / 100)
        : check++;

      if (check === 3) {
        this.pressedKeys.r.status = 'inactive';
      }
    }
  }

  StartTheParty() {
    if (this.startTheParty) {
      this.sphereGroup.children.forEach((object) => {
        if (object.name !== 'partyTime') {
          object.name = 'partyTime';
          object.material.color.set(0x808080);
          object.randomCordsX = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 50
          );
          object.randomCordsY = Math.ceil(3 + Math.random() * (60 - 3));
          object.randomCordsZ = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 50
          );
          object.randomCordsState = 'partying';
        }

        const generateNewSet = () => {
          object.randomCordsX = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 50
          );
          object.randomCordsY = Math.ceil(3 + Math.random() * (60 - 3));
          object.randomCordsZ = Math.ceil(
            (Math.random() > 0.5 ? Math.random() : -Math.random()) * 50
          );
          object.randomCordsState = 'partying';
        };

        if (object.randomCordsState === 'partying') {
          const position = object.position;
          let check = 0;

          position.x > object.randomCordsX &&
          position.x > object.randomCordsX + 1
            ? (position.x -= 10 / 100)
            : position.x < object.randomCordsX &&
              position.x < object.randomCordsX - 1
            ? (position.x += 10 / 100)
            : check++;

          position.y > object.randomCordsY &&
          position.y > object.randomCordsY + 1
            ? (position.y -= 10 / 100)
            : position.y < object.randomCordsY &&
              position.y < object.randomCordsY - 1
            ? (position.y += 10 / 100)
            : check++;

          position.z > object.randomCordsZ &&
          position.z > object.randomCordsZ + 1
            ? (position.z -= 10 / 100)
            : position.z < object.randomCordsZ &&
              position.z < object.randomCordsZ - 1
            ? (position.z += 10 / 100)
            : check++;

          if (check === 3) {
            generateNewSet();
          }
        }

        const randomNum = Math.random() > 0.7 ? Math.random() * 0.1 : 0.02;

        object.material.color.set(Math.random() * 0xffffff);
        object.rotation.x += randomNum;
        object.rotation.y += randomNum;
      });
    }
  }

  Raycaster() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(
      this.sphereGroup.children
    );

    if (intersects[0]) {
      this.raycastObject = intersects[0];
    } else {
      if (this.raycastObject) {
        this.raycastObject.object.name === 'selected'
          ? null
          : (this.previous.object.name = 'inactive');
      }
      this.raycastObject = { object: { uuid: null } };
      this.visualizorSphere.position.set(0, -10, 0);
      this.visualizorSphere.visible = false;
    }
  }

  HoveredObject() {
    this.Raycaster();
    // when mouse is over an object spin it and set a color
    if (this.raycastObject.object.name === 'selected') {
      this.visualizorSphere.visible = true;
      this.visualizorSphere.position.set(
        ...Object.values(this.raycastObject.point)
      );
    } else if (
      this.raycastObject.object.name === 'inactive' ||
      this.raycastObject.object.name === 'active'
    ) {
      this.visualizorSphere.visible = true;
      this.visualizorSphere.position.set(
        ...Object.values(this.raycastObject.point)
      );

      this.raycastObject.object.name = 'active';
      this.raycastObject.object.material.color.set(0xff6600);
    }
  }

  onclickObject() {
    if (this.selectedObject) {
      this.selectedObject.object.name = 'inactive';
      this.selectedObject = null;
    }

    if (
      this.raycastObject.object.uuid &&
      (this.raycastObject.object.name === 'inactive' ||
        this.raycastObject.object.name === 'active')
    ) {
      this.selectedObject = this.raycastObject;
      this.selectedObject.object.name = 'selected';
      this.selectedObject.object.material.color.set(0x00ffff);
    }
  }

  ResetCubes() {
    if (this.startTheParty) {
      this.StartTheParty();
    } else {
      // resets all cubeGroups children to default values
      this.sphereGroup.children.forEach((object) => {
        if (object.name === 'partyTime') {
          object.name = 'inactive';
        }

        if (object.name !== 'selected') {
          // resets inactive color
          if (object.name === 'inactive' || !this.raycastObject.object.uuid) {
            object.material.color.set(0x808080);
          }
          // resets rotation
          if (object.rotation.x > 0 || object.rotation.y > 0) {
            object.rotation.x -= object.rotation.x / 30;
            object.rotation.y -= object.rotation.y / 30;
          }
          // if(this.raycastObject){
          //   object.material.color.set
          // }
        }
      });
    }
  }

  RAF() {
    requestAnimationFrame(() => {
      this.HoveredObject();
      this.raycastObject ? (this.previous = this.raycastObject) : null;
      this.ResetCubes();
      this.RandomSelectedObjectPosition();

      if (
        this.selectedObject &&
        this.selectedObject.object.name === 'selected'
      ) {
        this.selectedObject.object.rotation.x += 0.05;
        this.selectedObject.object.rotation.y += 0.05;
      }

      this.threejs.render(this.scene, this.camera);
      this.RAF();
    });
  }
}

let APP = null;

window.addEventListener('DOMContentLoaded', () => {
  APP = new BasicWorldDemo();
});
