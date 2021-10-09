import "./style.css";
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module.js";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MapControls } from "./MapControls"; //拖动camera 控制

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
const raycaster = new THREE.Raycaster(); //射线选择
const mouse = new THREE.Vector2();

const obj3d = new THREE.Object3D();
const group = new THREE.Group();

const params = {
  test: "货物",
  rotate: false,
  usePatternTexture: false,
};

// Init gui
const gui = new GUI({ width: 300 });
gui.add(params, "rotate");
gui.add(params, "usePatternTexture").onChange(function (value) {
  outlinePass.usePatternTexture = value;
});

gui.add(params, "test").name("选中的物体:").listen();

init();
animate();

/** 放置虚线框区域和库区名称 */
function addArea(x, z, width, length, scene, name, textColor, font_size) {
  var planeMat = new THREE.MeshLambertMaterial();
  new THREE.TextureLoader().load("images/plane.png", function (map) {
    planeMat.map = map;
    planeMat.transparent = true;
    planeMat.opacity = 0.8;
    planeMat.needsUpdate = true;
  });

  var geometry = new THREE.PlaneGeometry(width, length);
  var obj = new THREE.Mesh(geometry, planeMat);
  obj.position.set(x, 0.01, z);
  obj.rotation.x = -Math.PI / 2.0;
  obj.name = "库区" + "$" + name.split("$")[1];
  scene.add(obj);

  new THREE.FontLoader().load("/font/FZYaoTi_Regular.json", function (font) {
    var text = new THREE.TextGeometry(name.split("$")[1], {
      // 设定文字字体
      font: font,
      //尺寸
      size: font_size,
      //厚度
      height: 0.01,
    });
    text.computeBoundingBox();
    //3D文字材质
    var m = new THREE.MeshStandardMaterial({ color: "#" + textColor });
    var mesh = new THREE.Mesh(text, m);
    mesh.position.x = -10;
    mesh.position.y = 0.01;
    mesh.position.z = 5;
    mesh.rotation.x = -Math.PI / 2.0; //立体/平面
    scene.add(mesh);
  });
}

function skybox() {
  // skybox

  const cubeTextureLoader = new THREE.CubeTextureLoader();
  cubeTextureLoader.setPath("images/");

  const cubeTexture = cubeTextureLoader.load([
    "px.jpg",
    "nx.jpg",
    "py.jpg",
    "ny.jpg",
    "pz.jpg",
    "nz.jpg",
  ]);
  scene.background = cubeTexture;
}


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

  skybox(); //天空盒

  camera = new THREE.PerspectiveCamera(75, width / height, 1, 100);
  camera.position.set(4, 4, 5);

  //controls 
  controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI * 0.4; //最大角度 地平面与camera
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

  addArea(0, 0, 20, 10, group, "ID1$库区1号", "FF0000", 0.5); //区域
  // box ==========================================================

  const cubeGeo = new THREE.BoxBufferGeometry(0.5, 0.3, 0.5);
  const cubeMaterial = new THREE.MeshLambertMaterial({
    color: 0xfeb74c,
    map: new THREE.TextureLoader().load("images/box.png"),
  });
  const voxel = new THREE.Mesh(cubeGeo, cubeMaterial);
  voxel.position.set(-1.65, 1.2, 0);
  voxel.name = "货物$1";
  group.add(voxel);

  const voxel2 = voxel.clone();
  voxel2.position.set(-1.1, 0.4, 0);
  voxel2.name = "货物$2";
  group.add(voxel2);

  const voxel3 = voxel.clone();
  voxel3.position.set(-0.55, 0.4, 0);
  voxel3.name = "货物$3";
  group.add(voxel3);

  const voxel4 = voxel.clone();
  voxel4.position.set(0, 1.2, 0);
  voxel4.name = "货物$4";
  group.add(voxel4);

  const voxel5 = voxel.clone();
  voxel5.position.set(0.55, 2, 0);
  voxel5.name = "货物$5";
  group.add(voxel5);

  const voxel6 = voxel.clone();
  voxel6.position.set(1.1, 0.4, 0);
  voxel6.name = "货物$6";
  group.add(voxel6);

  const voxel7 = voxel.clone();
  voxel7.position.set(1.65, 2.0, 0);
  voxel7.name = "货物$7";
  group.add(voxel7);

  ////
  const voxel11 = voxel.clone();
  voxel11.position.set(-1.65, 2.8, 0);
  voxel11.name = "货物$8";
  group.add(voxel11);

  const voxel12 = voxel.clone();
  voxel12.position.set(-1.1, 1.6, 0);
  voxel12.name = "货物$9";
  group.add(voxel12);

  const voxel13 = voxel.clone();
  voxel13.position.set(-1.1, 2.8, 0);
  voxel13.name = "货物$10";
  group.add(voxel13);

  const voxel14 = voxel.clone();
  voxel14.position.set(0, 0.8, 0);
  voxel14.name = "货物$11";
  group.add(voxel14);

  const voxel15 = voxel.clone();
  voxel15.position.set(0.55, 2.8, 0);
  voxel15.name = "货物$12";
  group.add(voxel15);

  const voxel16 = voxel.clone();
  voxel16.position.set(1.1, 2.8, 0);
  voxel16.name = "货物$13";
  group.add(voxel16);

  const voxel17 = voxel.clone();
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
  textureLoader.load("images/tri_pattern.jpg", function (texture) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    outlinePass.patternTexture = texture;
  });

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

      params.test = Msg;
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





// let camera, controls, scene, renderer;

// 			init();
// 			//render(); // remove when using next line for animation loop (requestAnimationFrame)
// 			animate();

// 			function init() {

// 				scene = new THREE.Scene();
// 				scene.background = new THREE.Color( 0xcccccc );
// 			//	scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

// 				renderer = new THREE.WebGLRenderer( { antialias: true } );
// 				renderer.setPixelRatio( window.devicePixelRatio );
// 				renderer.setSize( window.innerWidth, window.innerHeight );
// 				document.body.appendChild( renderer.domElement );

// 				camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 5000 );
// 				camera.position.set( 400, 200, 0 );

// 				// controls

// 				controls = new MapControls( camera, renderer.domElement );

// 				//controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

// 				controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// 				controls.dampingFactor = 0.5;

// 				controls.screenSpacePanning = false;

// 				controls.minDistance = 100;
// 				controls.maxDistance = 500;

// 				controls.maxPolarAngle = Math.PI / 2;

// 				// world

// 				const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// 				geometry.translate( 0, 0.5, 0 );
// 				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );

// 				for ( let i = 0; i < 500; i ++ ) {

// 					const mesh = new THREE.Mesh( geometry, material );
// 					mesh.position.x = Math.random() * 1600 - 800;
// 					mesh.position.y = 0;
// 					mesh.position.z = Math.random() * 1600 - 800;
// 					mesh.scale.x = 20;
// 					mesh.scale.y = Math.random() * 80 + 10;
// 					mesh.scale.z = 20;
// 					mesh.updateMatrix();
// 					mesh.matrixAutoUpdate = false;
// 					scene.add( mesh );

// 				}

// 				// lights

// 				const dirLight1 = new THREE.DirectionalLight( 0xffffff );
// 				dirLight1.position.set( 1, 1, 1 );
// 				scene.add( dirLight1 );

// 				const dirLight2 = new THREE.DirectionalLight( 0x002288 );
// 				dirLight2.position.set( - 1, - 1, - 1 );
// 				scene.add( dirLight2 );

// 				const ambientLight = new THREE.AmbientLight( 0x222222 );
// 				scene.add( ambientLight );

// 				//

// 				window.addEventListener( 'resize', onWindowResize );

// 				const gui = new GUI();
// 				gui.add( controls, 'screenSpacePanning' );

// 			}

// 			function onWindowResize() {

// 				camera.aspect = window.innerWidth / window.innerHeight;
// 				camera.updateProjectionMatrix();

// 				renderer.setSize( window.innerWidth, window.innerHeight );

// 			}

// 			function animate() {

// 				requestAnimationFrame( animate );

// 				controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true

// 				render();

// 			}

// 			function render() {

// 				renderer.render( scene, camera );

// 			}
