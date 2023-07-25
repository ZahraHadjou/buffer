import {
  AmbientLight,
  AxesHelper,
  DirectionalLight,
  GridHelper,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  Raycaster,
  Vector2,
  MeshLambertMaterial,
  MeshBasicMaterial,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { IFCLoader } from "web-ifc-three";

import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import { IFCBUILDING } from "web-ifc";

//Creates the Three.js scene
const scene = new Scene();

//Object to store the size of the viewport
const size = {
  width: window.innerWidth,
  height: window.innerHeight,
};

//Creates the camera (point of view of the user)
const camera = new PerspectiveCamera(75, size.width / size.height);
camera.position.z = 15;
camera.position.y = 13;
camera.position.x = 8;

//Creates the lights of the scene
const lightColor = 0xffffff;

const ambientLight = new AmbientLight(lightColor, 0.5);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(lightColor, 2);
directionalLight.position.set(0, 10, 0);
scene.add(directionalLight);

//Sets up the renderer, fetching the canvas of the HTML
const threeCanvas = document.getElementById("three-canvas");
const renderer = new WebGLRenderer({ canvas: threeCanvas, alpha: true });
renderer.setSize(size.width, size.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

//Creates grids and axes in the scene
const grid = new GridHelper(50, 30);
scene.add(grid);

const axes = new AxesHelper();
axes.material.depthTest = false;
axes.renderOrder = 1;
scene.add(axes);

//Creates the orbit controls (to navigate the scene)
const controls = new OrbitControls(camera, threeCanvas);
controls.enableDamping = true;
controls.target.set(-2, 0, 0);

//Animation loop
const animate = () => {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();

//Adjust the viewport to the size of the browser
window.addEventListener("resize", () => {
  (size.width = window.innerWidth), (size.height = window.innerHeight);
  camera.aspect = size.width / size.height;
  camera.updateProjectionMatrix();
  renderer.setSize(size.width, size.height);
});

//IFC loading
const loadingScreen = document.getElementById("loader-container");

const progressText = document.getElementById("progress-text");

const Loader = new IFCLoader();

const input = document.getElementById("file-input");

Loader.ifcManager.setupThreeMeshBVH(
  computeBoundsTree,
  disposeBoundsTree,
  acceleratedRaycast
);

var ifcModels = [];

input.addEventListener(
  "change",
  async (event) => {
    // la première fois ça n'a pas marché car les fichiers wasm étaient dans nodes
    // modules, il fallait les mettre dans le repertoire racine du projet
    // une autre option c'est de rajouter le path comme suit :
    // await Loader.ifcManager.setWasmPath('/nodes_modules/....')
    
    eventList = event.target.files
    // console.log("eventList : " + eventList)
    
    // console.log("eventList[1] : " + eventList[1])
    // console.log("eventList[0][0] : " + eventList[0][0])
    // console.log("eventList[0][1] : " + eventList[0][1])

    const ifcURL = URL.createObjectURL(event.target.files[0]);
    //console.log("URL : " + ifcURL)
    //console.log("eventList[0] : " + eventList[0])
    //console.log(event.target.files[0])
    //console.log("eventList[0][0] : " + eventList[0][0])
    var model = await Loader.loadAsync(ifcURL);
    // console.log("model : " + model); 
    // console.log("model[0]: " + model[0]); 
    // console.log("model[1]: " + model[1]); 

    scene.add(model);
    
    //console.log(model)
    ifcModels.push(model)
    
  }
);
//console.log(ifcModels)
const raycaster = new Raycaster();
raycaster.firstHitOnly = true;
const mouse = new Vector2();

// we create a function that cast a ray from mouse
function cast(event) {
  //bounds: get the size of the canvas element in order to compute the position of the mouse in the screen
  //because the canvas element may not occupy all the screen
  const bounds = threeCanvas.getBoundingClientRect();

  const x1 = event.clientX - bounds.left;
  const x2 = bounds.right - bounds.left;
  mouse.x = (x1 / x2) * 2 - 1;

  const y1 = event.clientY - bounds.top;
  const y2 = bounds.bottom - bounds.top;
  mouse.y = -(y1 / y2) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // console.log("A : " + ifcModels)
  // console.log( `B ${ifcModels}`)
  // console.log(ifcModels)
  // console.log("raycaster")
  // console.log(raycaster.intersectObjects(ifcModels))

  // console.log("ifcModels")
  //console.log(ifcModels)
  // console.log("IfcModels : " + ifcModels)
  // console.log("listOut : " + listOut)
  // console.log("model :" + ifcModels[0][1])
  // console.log("IfcModel :" + ifcModels[0])
  return raycaster.intersectObjects(ifcModels)[0];
  
  
}
//Highlighting object with mouse 
const highlightMaterial = new MeshBasicMaterial({
  transparent: true, 
  opacity: 0.3,
  color: "red",
  depthTest: false
})

const selectionMaterialBlue = new MeshBasicMaterial({
  transparent: true, 
  opacity: 0.7,
  color: "blue",
  depthTest: false
})

// we create another function that picks the raycasted object
async function pick(event,material, getProperties ) {
  //create an object 'found' with the raycasting function above 
  const found = cast(event);
  let lastModel
  // if there is an object found by casting a ray 
  if (found){ 
    // we instanciate the index (the index of the face the raycaster collided with),
    // a geometry (retrieve the geometry of the object), id (which is the id of the object that 
    //collided with the raycaster
   // and that has geometry and index as arguments )
    const index = found.faceIndex;
    const lastModel = found.object
    const geometry = found.object.geometry ;
    const ifc = Loader.ifcManager
    const id = ifc.getExpressId(geometry,index)

    if(getProperties){
      const properties = await ifc.getItemProperties(lastModel.modelID, id);
      console.log(properties)

      const propertySet = await ifc.getPropertySets(lastModel.modelID, id, );
      console.log(propertySet)

      const typeProperties = await ifc.getTypeProperties(lastModel.modelID, id);
      
      console.log(typeProperties)
      const materialProperties = await ifc.getMaterialsProperties(lastModel.modelID, id);
      console.log(materialProperties)

      const buildingsIDs = await ifc.getAllItemsOfType(lastModel.modelID, IFCBUILDING )
      console.log(buildingsIDs)
      const buildingID = buildingsIDs[0]

      const buildingProperties = await ifc.getItemProperties(lastModel.modelID, buildingID, true)
      console.log(buildingProperties)

      let realValue = [];

      for (const pset of propertySet){

        for ( const prop of pset.HasProperties){
          const id = prop.value
          const value = await ifc.getItemProperties(lastModel.modelID, id);
          realValue.push(value); 
        }
        
        pset.HasProperties = realValue
      }

      // to log values of the attribute HasPropertySets of typeProperties : We can do the same to log anything we want 
      let realTypeValue = [];
      for (const propertyType of typeProperties){
        for ( const propType of propertyType.HasPropertySets){
          const id = propType.value
          const value = await ifc.getItemProperties(lastModel.modelID, id);
          realTypeValue.push(value); 
        }
        
        propertyType.HasPropertySets = realTypeValue
      }
    }
    


    const subsetRed = Loader.ifcManager.createSubset({
      modelID: lastModel.modelID,
      ids: [id],
      material: material,
      scene,
      removePrevious: true
    });
  
    // In order to highlight objects we need to use subsets (a subset in ifcjs is
   // an object created on top of the original object and to which we can apply another 
   //material ). So the method .createSubset is provided by the ifcManager 

  } else if(lastModel) {
      Loader.ifcManager.removeSubset(lastModel.modelID, material)
     lastModel = undefined
    }
}

//threeCanvas.ondblclick = (event) => pick(event)
threeCanvas.onmousemove = (event) => pick(event, highlightMaterial,false);
threeCanvas.onmousedown = (event) => pick(event,selectionMaterialBlue, true);