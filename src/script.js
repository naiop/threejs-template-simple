// import "./style.css";
// import * as THREE from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
// import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
// import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
// import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
// import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

// import Stats from "three/examples/jsm/libs/stats.module.js";
// import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

// const objects = [];

// let selectedObjects = [];
// let composer, effectFXAA, outlinePass;

// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// /**
//  * Base
//  */
// // Canvas
// const canvas = document.querySelector(".c");

// // Scene
// const scene = new THREE.Scene();
// scene.background = new THREE.Color(0xf0f0f0);
// scene.fog = new THREE.Fog(scene.background, 3000, 5000);

// /**
//  * Sizes
//  */
// const sizes = {
//   width: window.innerWidth,
//   height: window.innerHeight,
// };

// /**
//  * Camera
//  */
// // Base camera
// const camera = new THREE.PerspectiveCamera(
//   45,
//   sizes.width / sizes.height,
//   0.1,
//   10000
// );
// camera.position.set(0, 800, 1500);
// scene.add(camera);

// // Controls
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
// controls.dampingFactor = 0.5; // 视角最小距离
// controls.minDistance = 100; // 视角最远距离
// controls.maxDistance = 5000;
// controls.maxPolarAngle = Math.PI / 2.2; // 最大角度

// /**
//  * Cube 立方体
//  */
// const cube = new THREE.Mesh(
//   new THREE.BoxGeometry(50, 50, 50),
//   new THREE.MeshBasicMaterial({
//     color: 0x00ff00,
//   })
// );
// cube.position.set(0, 25, -25);
// cube.name = "默认盒子";
// scene.add(cube);

// /**
//  * Cube 图片立方体
//  */
// const cubeGeo = new THREE.BoxBufferGeometry(50, 50, 50);
// const cubeMaterial = new THREE.MeshLambertMaterial({
//   color: 0xfeb74c,
//   map: new THREE.TextureLoader().load("/images/box.png"),
// });
// const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
// voxel.position.set(25, 25, 25);
// voxel.name = "货物$1";
// scene.add(voxel);
// objects.push(voxel);
// const voxel2 = voxel.clone();
// voxel2.position.set(225, 25, 25);
// voxel2.name = "货物$2";
// scene.add(voxel2);
// objects.push(voxel2);
// const voxel3 = voxel.clone();
// voxel3.position.set(-225, 25, 25);
// voxel3.name = "货物$3";
// scene.add(voxel3);
// objects.push(voxel3);

// /*
//  * Light
//  */
// const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); //模拟远处类似太阳的光源
// directionalLight.color.setHSL(0.1, 1, 0.95);
// directionalLight.position.set(0, 200, 0).normalize();
// scene.add(directionalLight);

// const ambient = new THREE.AmbientLight(0xffffff, 1); //AmbientLight,影响整个场景的光源
// ambient.position.set(0, 0, 0);
// scene.add(ambient);
//   scene.add(new THREE.AmbientLight(0xaaaaaa, 0.2));

// /*
//  * plan
//  */
// const loader = new THREE.TextureLoader();
// loader.load("/images/floor.jpg", function (texture) {
//   texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
//   texture.repeat.set(10, 10);
//   const floorGeometry = new THREE.BoxGeometry(2000, 2000, 1);
//   const floorMaterial = new THREE.MeshBasicMaterial({
//     map: texture,
//   });
//   const floor = new THREE.Mesh(floorGeometry, floorMaterial);
//   floor.rotation.x = -Math.PI / 2;
//   scene.add(floor);
//   floor.name = "地板";
//   objects.push(floor);
// });

// /**
//  * Renderer
//  */
// const renderer = new THREE.WebGLRenderer({
//   canvas: canvas,
//   antialias: true,
// });
// renderer.setSize(sizes.width, sizes.height);
// renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// //
// // //添加选中时的蒙版
// // const raycaster = new THREE.Raycaster();
// // const mouse = new THREE.Vector2();
// // var composer = new EffectComposer(renderer);
// // var renderPass = new RenderPass(scene, camera);

// // composer.addPass(renderPass);

// //  outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight),scene, camera);

// // outlinePass.edgeStrength = 5; //包围线浓度
// // outlinePass.edgeGlow = 1; //边缘线范围
// // outlinePass.edgeThickness = 3; //边缘线浓度
// // outlinePass.pulsePeriod = 2; //包围线闪烁评率
// // outlinePass.visibleEdgeColor.set("#ffffff"); //包围线颜色
// // outlinePass.hiddenEdgeColor.set("#5243c3"); //被遮挡的边界线颜色
// // composer.addPass(outlinePass);

// // var effectFXAA = new ShaderPass(FXAAShader);
// // effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
// // effectFXAA.renderToScreen = true;

// composer = new EffectComposer(renderer);

// const renderPass = new RenderPass(scene, camera);
// composer.addPass(renderPass);

// outlinePass = new OutlinePass(
//   new THREE.Vector2(window.innerWidth, window.innerHeight),
//   scene,
//   camera
// );
// composer.addPass(outlinePass);

// effectFXAA = new ShaderPass(FXAAShader);
// effectFXAA.uniforms["resolution"].value.set(
//   1 / window.innerWidth,
//   1 / window.innerHeight
// );
// composer.addPass(effectFXAA);

// window.addEventListener("click", onMouseClick);

// // 鼠标事件
// function onMouseClick(event) {
//   var x, y;
//   if (event.changedTouches) {
//     x = event.changedTouches[0].pageX;
//     y = event.changedTouches[0].pageY;
//   } else {
//     x = event.clientX;
//     y = event.clientY;
//   }
//   mouse.x = (x / window.innerWidth) * 2 - 1;
//   mouse.y = -(y / window.innerHeight) * 2 + 1;
//   // raycaster 选择物体
//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects([scene], true);
//   if (intersects.length > 0) {
//     //给选中的线条和物体加发光特效
//     const SelectedObject = intersects[0].object;
//     selectedObjects = [];
//     selectedObjects.push(SelectedObject);
//     outlinePass.selectedObjects = selectedObjects;
//     //控制台打印
//     var Msg = intersects[0].object.name.split("$");
//     console.log(Msg);
//   } else {
//     // outlinePass.selectedObjects = [];
//   }
// }

// window.addEventListener("resize", () => {
//   // Update sizes
//   sizes.width = window.innerWidth;
//   sizes.height = window.innerHeight;

//   // Update camera
//   camera.aspect = sizes.width / sizes.height;
//   camera.updateProjectionMatrix();

//   // Update renderer
//   renderer.setSize(sizes.width, sizes.height);
//   renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//   //
//   effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
// });

// /**
//  * Animate 动画
//  */
// const clock = new THREE.Clock();
// let lastElapsedTime = 0;

// const tick = () => {
//   const elapsedTime = clock.getElapsedTime();
//   const deltaTime = elapsedTime - lastElapsedTime;
//   lastElapsedTime = elapsedTime;

//   composer.render();
//   // Update controls
//   controls.update();

//   // Render
//   renderer.render(scene, camera);

//   // Call tick again on the next frame 再次渲染下一帧
//   window.requestAnimationFrame(tick);
// };

// tick();

import "./style.css";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

let container, stats;
let camera, scene, renderer, controls;
let composer, effectFXAA, outlinePass;

let selectedObjects = [];

const axes = new THREE.AxesHelper(50); // 坐标系辅助工具 ,添加到scene即可

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const obj3d = new THREE.Object3D();
const group = new THREE.Group();

const params = {
  test : "货物",
  rotate: false,
  usePatternTexture: false,
};

// Init gui
const gui = new GUI({ width: 300 });
gui.add(params, "rotate");
gui.add(params, "usePatternTexture").onChange(function (value) {
  outlinePass.usePatternTexture = value;
});

gui.add(params,"test").name("选中的物体:").listen();

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  // todo - support pixelRatio in this demo
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(scene.background, 1, 5000);

  camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
  camera.position.set(1, 5, 10);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // LIGHTS HemisphereLight

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
  hemiLight.color.setHSL(0.6, 1, 0.6);
  hemiLight.groundColor.setHSL(0.095, 1, 0.75);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const hemiLightHelper = new THREE.HemisphereLightHelper(hemiLight, 10);
  scene.add(hemiLightHelper);

  //LIGHTS DirectionalLight

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(30);
  scene.add(dirLight);

  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  const d = 50;

  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;

  dirLight.shadow.camera.far = 3500;
  dirLight.shadow.bias = -0.0001;

  const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
  scene.add(dirLightHelper);

  // model
  const loader1 = new STLLoader();
  var Path1 = "models/lj.stl";
  loader1.load(Path1, function (geometry) {
    var material = new THREE.MeshPhongMaterial({
      color: "#69f",
    });

    console.log(geometry);
    var mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0); // yzx
    mesh.rotation.set(-Math.PI / 2, 0, 0);
    mesh.scale.set(0.001, 0.001, 0.001);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "货架";
    group.add(mesh);
  });

  //
  scene.add(group);

  // box ==========================================================

  const cubeGeo = new THREE.BoxBufferGeometry(0.5, 0.3, 0.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({color: 0xfeb74c, map: new THREE.TextureLoader().load("/images/box.png"), });
  const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
  voxel.position.set(-1.65, 1.2, 0);
  voxel.name = "货物$1";
  group.add(voxel);

  const voxel2 =voxel.clone()
  voxel2.position.set(-1.10, 0.4, 0);
  voxel2.name = "货物$2";
  group.add(voxel2);

  const voxel3 =voxel.clone()
  voxel3.position.set(-0.55, 0.4, 0);
  voxel3.name = "货物$3";
  group.add(voxel3);

  const voxel4 =voxel.clone()
  voxel4.position.set(0, 1.2, 0);
  voxel4.name = "货物$4";
  group.add(voxel4);

  const voxel5 =voxel.clone()
  voxel5.position.set(0.55, 2, 0);
  voxel5.name = "货物$5";
  group.add(voxel5);

  const voxel6 =voxel.clone()
  voxel6.position.set(1.10, 0.4, 0);
  voxel6.name = "货物$6";
  group.add(voxel6);

  const voxel7 =voxel.clone()
  voxel7.position.set(1.65, 2.0, 0);
  voxel7.name = "货物$7";
  group.add(voxel7);

  ////
  const voxel11 =voxel.clone()
  voxel11.position.set(-1.65, 2.8, 0);
  voxel11.name = "货物$8";
  group.add(voxel11);

  const voxel12 =voxel.clone()
  voxel12.position.set(-1.10, 1.6, 0);
  voxel12.name = "货物$9";
  group.add(voxel12);

  const voxel13 =voxel.clone()
  voxel13.position.set(-1.10, 2.8, 0);
  voxel13.name = "货物$10";
  group.add(voxel13);

  const voxel14 =voxel.clone()
  voxel14.position.set(0, 0.8, 0);
  voxel14.name = "货物$11";
  group.add(voxel14);

  const voxel15 =voxel.clone()
  voxel15.position.set(0.55, 2.8, 0);
  voxel15.name = "货物$12";
  group.add(voxel15);

  const voxel16 =voxel.clone()
  voxel16.position.set(1.10, 2.8, 0);
  voxel16.name = "货物$13";
  group.add(voxel16);

  const voxel17 =voxel.clone()
  voxel17.position.set(1.65, 0.8, 0);
  voxel17.name = "货物$14";
  group.add(voxel17);


  // box ==========================================================

  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  groundMat.color.setHSL(0.095, 1, 0.75);

  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = 0;
  ground.rotation.x -= Math.PI * 0.5;
  ground.receiveShadow = true;
  ground.name = "地板";
  group.add(ground);

  group.add(axes); //添加坐标系辅助工具
  //

  stats = new Stats();
  container.appendChild(stats.dom);

  // postprocessing

  composer = new EffectComposer(renderer);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
  );
  outlinePass.edgeGlow = Number("1");
  outlinePass.visibleEdgeColor.set("#0fff00");
  composer.addPass(outlinePass);

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load( '/images/tri_pattern.jpg', function ( texture ) {

    
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    outlinePass.patternTexture = texture;

  } );

  effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
  composer.addPass(effectFXAA);

  window.addEventListener("resize", onWindowResize);

  window.addEventListener("click", onMouseClick);

  renderer.domElement.style.touchAction = "none";
  renderer.domElement.addEventListener("pointermove", onPointerMove);

  function onPointerMove(event) {
    if (event.isPrimary === false) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //checkIntersection();
  }

  function addSelectedObject(object) {
    selectedObjects = [];
    selectedObjects.push(object);
  }

  function checkIntersection() {
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(scene, true);

    if (intersects.length > 0) {
      const selectedObject = intersects[0].object;
      addSelectedObject(selectedObject);
      outlinePass.selectedObjects = selectedObjects;
    } else {
      // outlinePass.selectedObjects = [];
    }
  }

  // 鼠标点击事件
  function onMouseClick(event) {
    var x, y;
    if (event.changedTouches) {
      x = event.changedTouches[0].pageX;
      y = event.changedTouches[0].pageY;
    } else {
      x = event.clientX;
      y = event.clientY;
    }
    mouse.x = (x / window.innerWidth) * 2 - 1;
    mouse.y = -(y / window.innerHeight) * 2 + 1;
    // raycaster 选择物体
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([scene], true);
    if (intersects.length > 0) {
      //给选中的线条和物体加发光特效
      const SelectedObject = intersects[0].object;
     
      selectedObjects = [];
      selectedObjects.push(SelectedObject);
      outlinePass.selectedObjects = selectedObjects;
      //控制台打印
      var Msg = intersects[0].object.name.split("$");
      console.log(Msg);
      
      params.test =Msg;

      
    } else {
      // outlinePass.selectedObjects = [];
    }
  }
}

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);

  effectFXAA.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
}

function animate() {
  requestAnimationFrame(animate);

  stats.begin();

  const timer = performance.now();

  if (params.rotate) {
    group.rotation.y = timer * 0.0001;
  }

  controls.update();

  composer.render();

  stats.end();
}
