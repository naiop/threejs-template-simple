import * as THREE from 'three';

import {camera, renderer, scene, cursorHoverObjects } from '../script';

export const pickPosition = { x: 0, y: 0 };


export function getCanvasRelativePosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * renderer.domElement.width) / rect.width,
    y: ((event.clientY - rect.top) * renderer.domElement.height) / rect.height,
  };
}

export function launchClickPosition(event) {
  const pos = getCanvasRelativePosition(event);
  pickPosition.x = (pos.x / renderer.domElement.width) * 2 - 1;
  pickPosition.y = (pos.y / renderer.domElement.height) * -2 + 1; // note we flip Y

  // cast a ray through the frustum
  const myRaycaster = new THREE.Raycaster();
  myRaycaster.setFromCamera(pickPosition, camera);
  // get the list of objects the ray intersected
  const intersectedObjects = myRaycaster.intersectObjects(scene.children);
  if (intersectedObjects.length) {
    // pick the first object. It's the closest one
    const pickedObject = intersectedObjects[0].object;
    if (intersectedObjects[0].object.userData.URL)
      window.open(intersectedObjects[0].object.userData.URL);
    else {
      return;
    }
  }
}


//Raycaster 选中时鼠标样式
export function launchHover(event) {
  event.preventDefault();
  var mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(cursorHoverObjects);
  if (intersects.length > 0) {
    document.querySelector("body").style.cursor = 'pointer';
  } else {
    document.querySelector("body").style.cursor = 'default';
  }
}