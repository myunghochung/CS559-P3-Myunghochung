/*jshint esversion: 6 */

/**
 * Graphics Town Framework - "Main" File
 *
 * This is the main file - it creates the world, populates it with
 * objects and behaviors, and starts things running
 *
 * The initial distributed version has a pretty empty world.
 * There are a few simple objects thrown in as examples.
 *
 * It is the students job to extend this by defining new object types
 * (in other files), then loading those files as modules, and using this
 * file to instantiate those objects in the world.
 */

import { GrWorld } from "../libs/CS559-Framework/GrWorld.js";
import { WorldUI } from "../libs/CS559-Framework/WorldUI.js";
import * as T from "../libs/CS559-Three/build/three.module.js";
import { GrObject } from "../libs/CS559-Framework/GrObject.js";
import { shaderMaterial } from "../libs/CS559-Framework/shaderHelper.js";
// import {main} from "../examples/main.js";

/**m
 * The Graphics Town Main -
 * This builds up the world and makes it go...
 */

// make the world
let world = new GrWorld({
    width: 800,
    height: 600,
    groundplanesize: 250, // make the ground plane big enough for a world of stuff
    groundplanecolor: "blue"
});



// put stuff into the world
// this calls the example code (that puts a lot of objects into the world)
// you can look at it for reference, but do not use it in your assignment
// main(world);

// while making your objects, be sure to identify some of them as "highlighted"

///////////////////////////////////////////////////////////////
// because I did not store the objects I want to highlight in variables, I need to look them up by name
// This code is included since it might be useful if you want to highlight your objects here
function highlight(obName) {
    const toHighlight = world.objects.find(ob => ob.name === obName);
    if (toHighlight) {
        toHighlight.highlighted = true;
    } else {
        throw `no object named ${obName} for highlighting!`;
    }
}

let tiles =[];
const r = 50;
const h = r/2*Math.sqrt(3);
let loader = new T.TextureLoader();



//================================== HELPER FUNCTIONS ==================================
//helper function to find the random position within a circle except for center
function randomPositionInCircle(radius,height,offset) {
    let off = offset?? 5;
    // Generate a random angle in radians between 0 and 2*pi
    var theta = Math.random() * Math.PI * 2;
    
    // Generate a random radius between 0 and the given radius
    var r = Math.random() * (radius-off) +off;
    
    // Calculate the x and z coordinates using polar to Cartesian conversion
    var x = r * Math.cos(theta);
    var z = r * Math.sin(theta);
    
    // Return the random position as a THREE.Vector3
    return new T.Vector3(x,height,z);
}

//helper function find coordinates on plane given the index i
function coordinates(i) {
    let x;
    let z;
    if(i<3) { //row 1
        x = h*2*(i-1);
        z = -3*r;
    } else if(i < 7) { // row 2
        x = (i-3)*2*h-3*h;
        z = -3*r/2;
    } else if (i < 12) { // row 3
        x = (i-7)*2*h-4*h;
        z= 0;
    } else if (i < 16) { // row 4
        x  = (i-12)*2*h-3*h;
        z = 3*r/2;
    } else { //row 5
        x = h*2*(i-17);
        z = 3*r;
    }
    return [x,z];
}

//helper function to find vertices of hexagon where i is the index of tile and j is vertex position of hexagon going clockwise
function vertex_coord(i,j){
    let x;
    let z;
    let cx = coordinates(i)[0];
    let cz = coordinates(i)[1];
    switch (j) {
        case 0:
            x = cx;
            z = cz - r;
            break;
        case 1:
            x = cx + h;
            z = cz - h/2;
            break;
        case 2:
            x = cx + h;
            z = cz + h/2;
            break;
        case 3:
            x = cx;
            z = cz + r;
            break;
        case 4:
            x = cx - h;
            z = cz + h/2;
            break;
        case 5:
            x = cx - h;
            z = cz - h/2;
            break;
        
    }
    return [x,z];
}

//helper function to find edge coordinates of hexagon and the rotation of object
function edge_coord(i,j){
    let x;
    let z;
    let rot;
    let cx = coordinates(i)[0];
    let cz = coordinates(i)[1];
    switch (j) {
        case 0:
            x = cx + h/2;
            z = cz - Math.sqrt(3)*h/2;
            rot = Math.PI/3;
            break;
        case 1:
            x = cx + h;
            z = cz;
            rot = 0;
            break;
        case 2:
            x = cx + h/2;
            z = cz + Math.sqrt(3)*h/2;
            rot = -Math.PI/3;
            break;
        case 3:
            x = cx - h/2;
            z = cz + Math.sqrt(3)*h/2;
            rot = Math.PI/3;
            break;
        case 4:
            x = cx - h;
            z = cz;
            rot = 0;
            break;
        case 5:
            x = cx - h/2;
            z = cz - Math.sqrt(3)*h/2;
            rot = -Math.PI/3;
            break;
    }
    return[x,z,rot]
}

//helper function to generate indicies
function generateIndices(numRowsSquare,numbRowsTri) {
    let indices = [];
    let baseIndex=0;
    for (let i = 0; i < numRowsSquare; i++) {
        baseIndex = i * 4;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        indices.push(baseIndex, baseIndex + 2, baseIndex + 3);
    }
    for (let i = 0; i < numbRowsTri; i++) {
        baseIndex = numRowsSquare * 4 + i*3;
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
    }
    return indices;
}

//helper function to find the distance given x and z
function distance(x,z) {
    let d = Math.sqrt(x*x + z*z);
    return d;
}



//================================== OBJECT CLASSES ==================================
//Land
let hex_geo = new T.CircleGeometry(r-0.1,6);
let land_mat = new T.MeshStandardMaterial({color:"tan", roughness: 1});
let border_geo = new T.RingGeometry(r-0.1,r,6,10);
let border_mat = new T.MeshStandardMaterial({color:"black",roughness: 1});

class GrLand extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        const land = new T.Group();
        for (let i = 0; i <19; i ++) {
            let hex = new T.Mesh(hex_geo,land_mat);
            let border = new T.Mesh(border_geo,border_mat);
            if(i<3) { //row 1
                hex.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
                border.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
            } else if(i < 7) { // row 2
                hex.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
                border.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
            } else if (i < 12) { // row 3
                hex.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
                border.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
            } else if (i < 16) { // row 4
                hex.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
                border.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
            } else { //row 5
                hex.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
                border.position.set(coordinates(i)[0],0.3,coordinates(i)[1]);
            }
            hex.rotateX(-Math.PI/2);
            hex.rotateZ(Math.PI/2);
            border.rotateX(-Math.PI/2);
            border.rotateZ(Math.PI/2);
            tiles.push(hex);
            land.add(hex);
            land.add(border);
        }
        super("GrLand",land);
    }
}

//Forest tiles
let forest_texture = loader.load("forestground.jpg");
let tile_geo = new T.CircleGeometry(r-3,6);
let forest_tile_mat = new T.MeshStandardMaterial({color: "green",map:forest_texture,});
let trunk_geo = new T.CylinderGeometry(1,1,7);
let trunk_mat = new T.MeshStandardMaterial({color: "brown", roughness: 0.7});
let leaves_geo = new T.DodecahedronGeometry(5);
let leaves_mat = new T.MeshStandardMaterial({color:"darkgreen"});
class GrForest extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        const forestAll = new T.Group();
        let index = params.index?? 0;
        let forest = new T.Group();
        let tile = new T.Mesh(tile_geo,forest_tile_mat);
        for (let i = 0; i < 100; i ++) {
            let tree = new T.Group();
            let trunk = new T.Mesh(trunk_geo,trunk_mat);
            let leaves = new T.Mesh(leaves_geo,leaves_mat);
            trunk.translateY(3);
            let randomscale = Math.random()+0.5;
            leaves.translateY(randomscale*2 + 7);
            leaves.scale.set(randomscale,randomscale,randomscale);
            leaves.rotateY(randomscale*Math.PI*2);
            tree.add(leaves);
            tree.add(trunk);
            tree.position.set(...randomPositionInCircle(h-5));
            forest.add(tree);
        }
        forest.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        tile.rotateX(-Math.PI/2);
        tile.rotateZ(Math.PI/2);
        forest.add(tile);
        forestAll.add(forest);
        super("GrForest " + index,forestAll);
    }
}


//Plains tiles
let plains_texture = loader.load("plains.jpg");
let plains_tile_mat = new T.MeshStandardMaterial({color:"lightgreen", roughness: 1,map:plains_texture});

//Sheep
let wool = loader.load(["wool.jpg"]);

let body_geo = new T.CapsuleGeometry(2,3,10,50);
let sheep_mat = new T.MeshStandardMaterial({color:"white",map:wool});
let leg_geo = new T.CylinderGeometry(0.5,0.5,2);
let head_geo = new T.CapsuleGeometry(1,1.5,10,50);
let tail_geo = new T.CapsuleGeometry(0.3,1,10,50);
let neck_geo = new T.CapsuleGeometry(0.7,1,10,50);
let ear_geo = new T.CylinderGeometry(0.5,0.5,0.3,8,1,false,0,Math.PI);
class GrSheep extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    * @param {number} params.index index
    */
    constructor (params = {}) {
        //create sheep 
        let sheepPivotList = []; //list of T.Object3D to store sheep's pivot of head
        let sheepEatTime = []; // list to store the random eating time of each sheep
        let headrotation = [];
        let index = params.index?? 0;
        const sheeps = new T.Group();     
        for (let i = 0; i < 3; i++){
            const sheep = new T.Group();  
            let body = new T.Mesh(body_geo,sheep_mat);        
            let leg1 = new T.Mesh(leg_geo,sheep_mat);
            let leg2 = new T.Mesh(leg_geo,sheep_mat);
            let leg3 = new T.Mesh(leg_geo,sheep_mat);
            let leg4 = new T.Mesh(leg_geo,sheep_mat);        
            let head = new T.Mesh(head_geo,sheep_mat);        
            let tail = new T.Mesh(tail_geo,sheep_mat);        
            let neck = new T.Mesh(neck_geo,sheep_mat);
            let ear1 = new T.Mesh(ear_geo,sheep_mat);
            let ear2 = new T.Mesh(ear_geo,sheep_mat);
            let pivot = new T.Object3D();
            body.translateY(3);
            body.rotateX(Math.PI/2);
            leg1.position.set(1,1,1.5);
            leg2.position.set(1,1,-1.5);
            leg3.position.set(-1,1,1.5);
            leg4.position.set(-1,1,-1.5);
            neck.translateY(-0.5);
            neck.rotateX(-Math.PI/3);
            neck.translateY(-1);
            pivot.position.set(0,4,2);
            head.translateZ(2);
            head.translateY(2);
            head.rotateX(Math.PI/2);
            ear1.position.set(0.6,-0.7,-0.6);
            ear2.position.set(-0.6,-0.7,-0.6);
            ear1.rotateY(Math.PI/4);
            ear2.rotateY(Math.PI-Math.PI/4);
            tail.position.set(0,3,-3.7);
            tail.rotateX(Math.PI/6);
            pivot.add(head);
            head.add(neck);
            head.add(ear1);
            head.add(ear2);
            sheep.add(pivot);
            sheep.add(body);
            sheep.add(leg1);
            sheep.add(leg2);
            sheep.add(leg3);
            sheep.add(leg4);
            sheep.add(tail);
            let random_pos = randomPositionInCircle(r/2,0.4,10);
            let x = coordinates(index)[0]+random_pos.x;
            let z = coordinates(index)[1]+random_pos.z;
            sheep.position.set(x,0,z);
            sheep.rotateY(Math.random() * Math.PI*2);
            sheeps.add(sheep);
            sheepPivotList.push(pivot);
            let random_time = Math.random() * 5000 + 6400;
            sheepEatTime.push(random_time);
            headrotation.push(0);
        }
        super("GrSheep " + index,sheeps);
        this.sheepPivotList=sheepPivotList;
        this.sheepEatTime = sheepEatTime;
        this.headrotation = headrotation;
        this.time=6401;
    }
    stepWorld(delta) {
        this.time += delta;
        for(let i = 0; i < this.sheepPivotList.length; i++) {
            if (this.time % this.sheepEatTime[i] <6400 && Math.abs(this.headrotation[i]- Math.PI/2) <= Math.PI/2) {
                let rotation = 0.005*Math.sin(this.time%this.sheepEatTime[i]/1000)*delta/6;
                this.sheepPivotList[i].rotateX(rotation);
                this.headrotation[i]+= rotation;
            }
        }
    }
}
class GrPlains extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const plainsAll = new T.Group();
        let index = params.index ?? 0;
        let plains = new T.Group();
        let tile = new T.Mesh(tile_geo,plains_tile_mat);

        plains.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        tile.rotateX(-Math.PI/2);
        tile.rotateZ(Math.PI/2);
        plains.add(tile);
        plainsAll.add(plains);
        super("GrPlains " + index,plainsAll);
    }
}

//Clay Tiles
let clay_texture = loader.load("clay.jpg");
let clay_tile_mat = new T.MeshStandardMaterial({color:"rgb(201,94,12)", roughness: 1,map:clay_texture});
class GrClay extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const clayAll = new T.Group();
        let index = params.index?? 0;
        let clay1 = new T.Group();
        let tile1 = new T.Mesh(tile_geo,clay_tile_mat);

        clay1.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        tile1.rotateX(-Math.PI/2);
        tile1.rotateZ(Math.PI/2);
        clay1.add(tile1);
        clayAll.add(clay1);
        super("GrClay " + index,clayAll);
    }
}

let clay_mat = new T.MeshStandardMaterial({color:"rgb(226,114,91)",roughness:1,map:clay_texture});
let mound_geo = new T.CylinderGeometry(20,25,5,9,1);
let claymoundsAll = [];
class GrClayMounds extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    * @param {number} params.index index
    */
    constructor (params = {}) {
        let index = params.index?? 9;
        
        let claymounds = new T.Group();
        let mound1 = new T.Mesh(mound_geo,clay_mat);
        let mound2 = new T.Mesh(mound_geo,clay_mat);
        let mound3 = new T.Mesh(mound_geo,clay_mat);
        let position = randomPositionInCircle(h/3,0);
        mound1.position.set(position.x,2.5,position.z);
        mound2.scale.set(0.7,0.8,0.7);
        mound3.scale.set(0.6,0.6,0.6);
        mound2.translateY(4);
        mound3.translateY(4);
        claymounds.add(mound1);
        mound1.add(mound2);
        mound2.add(mound3);
        claymounds.position.set(coordinates(index)[0],0,coordinates(index)[1]);
        claymoundsAll.push([mound1,index]);
        
        super("GrClayMounds " + index,claymounds);
    }
}

let excavator_mat = new T.MeshStandardMaterial({color: "yellow",metalness: 1});
let wheel_mat = new T.MeshStandardMaterial({color: "gray", rougness: 0.8,side: T.DoubleSide});
let excavator_body_geo = new T.BoxGeometry(5,3,5);
let excavator_head_geo = new T.BoxGeometry(2,3,3.5);
let wheel_geo = new T.BoxGeometry(3,2,7);
let wheelend_geo = new T.CylinderGeometry(1,1,3,12,1,false,-Math.PI/2,Math.PI);
let arm1_geo = new T.BoxGeometry(1,1,6);
class GrExcavator extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    * @param {number} params.index index
    */
    constructor (params = {}) {
        let index = params.index?? 9;
        let excavator = new T.Group();
        let body = new T.Mesh(excavator_body_geo,excavator_mat);
        let head = new T.Mesh(excavator_head_geo,wheel_mat);
        let wheel1 = new T.Mesh(wheel_geo,wheel_mat);
        let wheel2 = new T.Mesh(wheel_geo,wheel_mat);
        let wheelend1 = new T.Mesh(wheelend_geo,wheel_mat);
        let wheelend2 = new T.Mesh(wheelend_geo,wheel_mat);
        let wheelend3= new T.Mesh(wheelend_geo,wheel_mat);
        let wheelend4 = new T.Mesh(wheelend_geo,wheel_mat);
        let base1_pivot = new T.Object3D();
        let base2_pivot = new T.Object3D();
        let base3_pivot = new T.Object3D();
        let arm1 = new T.Mesh(arm1_geo,excavator_mat);
        let arm2 = new T.Mesh(arm1_geo,excavator_mat);
        let armhead = new T.Mesh(wheelend_geo,wheel_mat);
        wheel1.position.set(1.7,-2.5,0);
        wheel2.position.set(-1.7,-2.5,0);
        wheelend1.position.set(1.7,-2.5,3.5);
        wheelend1.rotateZ(Math.PI/2);
        wheelend2.position.set(1.7,-2.5,-3.5);
        wheelend2.rotateY(Math.PI);
        wheelend2.rotateZ(Math.PI/2);
        wheelend3.position.set(-1.7,-2.5,3.5);
        wheelend3.rotateZ(Math.PI/2);
        wheelend4.position.set(-1.7,-2.5,-3.5);
        wheelend4.rotateY(Math.PI);
        wheelend4.rotateZ(Math.PI/2);
        head.translateY(3);
        head.translateZ(-0.75);
        //arm1 and pivot
        base1_pivot.position.set(0,0,2);
        base1_pivot.rotateX(-Math.PI/4);
        arm1.translateZ(3);
        //arm2 and pivot
        base2_pivot.position.set(0,0,6);
        base2_pivot.rotateX(Math.PI/3);
        arm2.translateZ(3);
        //armhead and pivot
        base3_pivot.position.set(0,0,6);
        armhead.translateY(-1);
        armhead.rotateZ(Math.PI/2);
        //body
        body.translateY(4);
        body.add(wheel1);
        body.add(wheel2);
        body.add(wheelend1);
        body.add(wheelend2);
        body.add(wheelend3);
        body.add(wheelend4);
        body.add(head);
        body.add(base1_pivot);
        base1_pivot.add(arm1);
        base1_pivot.add(base2_pivot);
        base2_pivot.add(arm2);
        base2_pivot.add(base3_pivot);
        base3_pivot.add(armhead);
        excavator.add(body);
        //rotate random amount
        excavator.rotateY(Math.random() * Math.PI * 2);

        //move to top of claymound
        let claymound_position = new T.Vector3();
        claymoundsAll.forEach(function(claymound) {
            if(claymound[1] == index){
                claymound_position = claymound[0].position;
                console.log(claymound_position);
            }
        });
        excavator.position.set(coordinates(index)[0]+claymound_position.x,10.4,coordinates(index)[1]+claymound_position.z);
        super("GrExcavator " + index,excavator);
        this.excavator = excavator;
        this.pivot1 = base1_pivot;
        this.pivot2 = base2_pivot;
        this.pivot3 = base3_pivot;
        this.rotation1 = 0;
        this.rotation2 = 0;
        this.rotation3 = 0;
        this.dir1 = 1;
        this.dir2 = 1;
        this.dir3 = 1;
        this.time = 0;
    }
    stepWorld(delta){
        this.time +=delta;
        if(this.rotation1 < -Math.PI/6 || this.rotation1 > Math.PI/6) {
            this.dir1 *= -1;
        } 
        if(this.rotation2 < -Math.PI/6 || this.rotation2 > Math.PI/6) {
            this.dir2 *= -1;
        } 
        if(this.rotation3 < -Math.PI/6 || this.rotation3 > Math.PI/6) {
            this.dir3 *= -1;
        } 
        this.excavator.rotateY(0.001*Math.sin(this.time/1000));
        this.pivot1.rotateX(delta/5000 * this.dir1);
        this.rotation1 += delta/5000 * this.dir1;
        this.pivot2.rotateX(delta/5000 * this.dir2);
        this.rotation2 += delta/5000 * this.dir1;
        this.pivot3.rotateX(delta/5000 * this.dir3);
        this.rotation3 += delta/5000 * this.dir3;
    }
}

//wheat
let wheat_tile_texture = loader.load("wheat.jpg");
let wheat_tile_mat = new T.MeshStandardMaterial({color: "rgb(245, 202, 49)", roughness: 1,map:wheat_tile_texture});
class GrWheat extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const wheatAll = new T.Group();
        let index = params.index?? 0;
        let wheat1 = new T.Group();
        let tile1 = new T.Mesh(tile_geo,wheat_tile_mat);

        wheat1.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        tile1.rotateX(-Math.PI/2);
        tile1.rotateZ(Math.PI/2);
        wheat1.add(tile1);
        wheatAll.add(wheat1);

        super("GrWheat " + index,wheatAll);
    }
}

let bale_geo = new T.BoxGeometry(5,5,8);
let wheat_texture = loader.load("wheatbale.jpg");
let wheat_mat = new T.MeshStandardMaterial({color: "yellow",map: wheat_texture});

class GrWheatBales extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    * @param {number} params.index index
    */
    constructor (params = {}) {
        let index = params.index?? 9;
        let wheatbalesAll = new T.Group();
        for(let i = 0; i < 3; i ++){
            let wheatbales = new T.Group();
            let bale1 = new T.Mesh(bale_geo,wheat_mat);
            let bale2 = new T.Mesh(bale_geo,wheat_mat);
            let bale3 = new T.Mesh(bale_geo,wheat_mat);
            let position = randomPositionInCircle(h-10,0.4,5);
            bale1.position.set(position.x,0,position.z);
            bale2.position.set(5.4,0,0);
            bale3.position.set(2.7,5,0);
            bale1.rotateY(Math.random()*Math.PI*2);
            bale1.add(bale2);
            bale1.add(bale3);
            wheatbales.add(bale1);
            wheatbales.position.set(coordinates(index)[0],2.5,coordinates(index)[1]);
            wheatbalesAll.add(wheatbales);
        }
        super("GrWheatBales "+index,wheatbalesAll);
    }
}

//Ore
let Ore_tile_texture = loader.load("ore.jpg");
let ore_tile_mat = new T.MeshStandardMaterial({color: "lightgray", roughness: 1,map:Ore_tile_texture});
class GrOre extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const oreAll = new T.Group();
        let index = params.index?? 0;
        let ore1 = new T.Group();
        let tile1 = new T.Mesh(tile_geo,ore_tile_mat);
        ore1.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        tile1.rotateX(-Math.PI/2);
        tile1.rotateZ(Math.PI/2);
        ore1.add(tile1);
        oreAll.add(ore1);
        super("GrOre "+ index,oreAll);
    }
}
//mountain
const mountain_geo = new T.PlaneGeometry(55,55,50,50);
let disMap = new T.TextureLoader().load("heightmap.png");

// let mountain_mat = shaderMaterial("mountain.vs", "mountain.fs", {
//     side: T.DoubleSide,
//     uniforms: {
//       colormap: { value: disMap },
//     },
//   });
let mountain_mat = new T.MeshStandardMaterial({
    color: "lightgray",
    wireframe: false,
    map:Ore_tile_texture,
    displacementMap: disMap,
    displacementScale: 50
});
class GrMountain extends GrObject{
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const mountainAll = new T.Group();
        let index = params.index?? 0;
        let mountain = new T.Mesh(mountain_geo,mountain_mat);
        mountain.position.set(coordinates(index)[0],0.4,coordinates(index)[1]);
        mountain.rotateX(-Math.PI/2);
        mountain.rotateZ(Math.PI/2);
        mountainAll.add(mountain);
        super("GrMountain " + index,mountainAll);
    }
}

//desert
let desert_tile_texture = loader.load("desert.jpg");
let desert_tile_mat = new T.MeshStandardMaterial({ roughness: 1,map:desert_tile_texture});
class GrDesert extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        const desertTile = new T.Group();
        let desert = new T.Group();
        let tile = new T.Mesh(tile_geo,desert_tile_mat);
        desert.position.set(coordinates(9)[0],0.4,coordinates(9)[1]);
        tile.rotateX(-Math.PI/2);
        tile.rotateZ(Math.PI/2);
        desert.add(tile);
        desertTile.add(desert);

        super("GrDesert",desertTile);
    }
}

//robber
let robber_mat = new T.MeshStandardMaterial({color: "gray", roughness: 1});
let robber_base_geo = new T.CylinderGeometry(8,10,5);
let robber_body_geo = new T.SphereGeometry(10);
let particles = [];
let particles_direction = [];
class GrRobber extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        let robber = new T.Group();
        let base = new T.Mesh(robber_base_geo,robber_mat);
        let body = new T.Mesh(robber_body_geo,robber_mat);
        let head = new T.Mesh(robber_body_geo,robber_mat);
        base.translateY(2.5);
        body.translateY(15);
        body.scale.set(1,1.5,1);
        head.translateY(32);
        head.scale.set(0.7,0.7,0.7);
        robber.add(base);
        robber.add(body);
        robber.add(head);

        //particles
        for(let i = 0; i < 50; i ++){
            let particle = new T.Mesh(new T.SphereGeometry(1),robber_mat);
            let random_direction = Math.random() * Math.PI * 2;
            particles.push(particle);
            particles_direction.push(random_direction);
            robber.add(particle);
        }
        super("GrRobber",robber);
        this.amplitude = params.amplitude?? 50;
        this.robber = robber;
        this.time = 0;
        this.prevposition = robber.position;
        this.status = 0;
        this.nextpoint = [];
        this.nextIndex = 0;
        this.dx = 0;
        this.dz = 0;
        this.du = 0; //delta for robber y position
        this.dp = 0; //delta for particle y position
        this.u = 0;
        this.angle = 0;
        this.middistance = 0;
        this.rideable = head;
        this.particles = particles;
    }
    stepWorld(delta){
        this.time += delta;
        if (delta > 20) {
            this.status = 4; //skip the first delta
        }
        if(this.status == 0) { // find new index to jump to
            this.nextIndex = Math.floor(Math.random() * 19);
            this.prevposition=this.robber.position;
            this.nextpoint = coordinates(this.nextIndex);
            this.u=0;
            this.distance = distance(Math.abs(this.nextpoint[0] - this.prevposition.x),Math.abs(this.nextpoint[1] - this.prevposition.z));
            this.dx = (this.nextpoint[0] - this.prevposition.x)*0.001*delta;
            this.dz = (this.nextpoint[1] - this.prevposition.z)*0.001*delta;
            this.du = this.distance*0.001*delta;
            this.status = 1;
        } else if(this.status == 1) { //rotate to face new point
            let angle = Math.atan2(this.nextpoint[0] - this.prevposition.x, this.nextpoint[1] - this.prevposition.z);
            if (this.angle < angle) {
                this.robber.rotateY(delta/1000);
                this.angle += delta/1000;
            } else {
                this.robber.rotateY(-delta/1000);
                this.angle -= delta/1000;
            }
            if (Math.abs(this.angle - angle) <= 0.01) {
                this.status = 2;
            }
        } else if(this.status == 2) { //jump to new position
            this.robber.position.x += this.dx;
            this.robber.position.z += this.dz;
            this.u += this.du; 
            this.robber.position.y = -this.amplitude * 4/(this.distance**2)*(this.u - this.distance / 2)**2 + this.amplitude; //quadratic formula
            if (this.u >= this.distance){//old logic calculated difference in distance, but inconsistent so using u and distance instead.(Math.abs(this.robber.position.x - this.nextpoint[0]) <delta/6 && Math.abs(this.robber.position.z - this.nextpoint[1])<delta/6) {
                this.status = 3;
            }
        }else if(this.status == 3) { // particles move
            this.dp += 0.005*delta;
            for (let i =0; i < this.particles.length; i++){
                let particle = this.particles[i];
                particle.translateY(1.5*delta/6 - this.dp);
                particle.translateX(delta/12);
                particle.scale.x *= 0.99;
                particle.scale.y *= 0.99;
                particle.scale.z *= 0.99;
            }
            if(this.particles[0].position.y <-10 ){
                this.status = 4;
            }
        }else if(this.status == 4) { // resut particles
            for(let i =0; i < this.particles.length; i++){
                this.particles[i].rotateY(particles_direction[i]);
                this.particles[i].scale.set(1,1,1);
                this.particles[i].position.set(0,0,0);
            }
            this.dp = 0;
            this.status = 0;
        }
    }

}

//house
let house_geo = new T.BufferGeometry();
let uvs = [0,0,1,0,1,1,0,1];
let gab_front_vertices = [0,0,1, 1,0,1, 1,1,1, 0,1,1];
let gab_right_vertices = [1,0,1, 1,0,0, 1,1,0, 1,1,1];
let gab_left_vertices = [0,0,0, 0,0,1, 0,1,1, 0,1,0];
let gab_back_vertices = [1,0,0, 0,0,0, 0,1,0, 1,1,0];
let gab_bot_vertices = [0,0,0, 1,0,0, 1,0,1, 0,0,1];
let gab_topr_vertices = [1,1,1, 1,1,0, 0.5,1.5,0, 0.5,1.5,1];
let gab_topl_vertices = [0,1,0, 0,1,1, 0.5,1.5,1, 0.5,1.5,0];
let gab_front_top_vertices = [0,1,1, 1,1,1, 0.5,1.5,1];
let gab_back_top_vertices = [1,1,0, 0,1,0, 0.5,1.5,0];
let gab_vertices = [...gab_front_vertices,
                ...gab_right_vertices,
                ...gab_left_vertices,
                ...gab_back_vertices,
                ...gab_bot_vertices,
                ...gab_topr_vertices,
                ...gab_topl_vertices,
                ...gab_front_top_vertices,
                ...gab_back_top_vertices];
let gab_indices =  [...generateIndices(7,2)];
let gab_uvs =  [...uvs,...uvs,...uvs,...uvs,...uvs,...uvs,...uvs,...uvs,...uvs];
house_geo.setAttribute("position", new T.BufferAttribute(new Float32Array(gab_vertices),3));
house_geo.setIndex(gab_indices);
house_geo.setAttribute("uv", new T.BufferAttribute(new Float32Array(gab_uvs),2))

let house_texture = loader.load("wood.jpg");

class GrHouse extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        let i = params.index?? 9;
        let j = params.vertex?? 0;
        let color = params.color?? "red";
        let house_mat = new T.MeshStandardMaterial({color:color, map:house_texture});
        let house = new T.Group();
        let mesh = new T.Mesh(house_geo,house_mat);
        house.add(mesh);
        let point = vertex_coord(i,j);
        house.position.set(point[0],0,point[1]);
        house.scale.set(10,10,14);
        house.translateX(-5);
        house.translateZ(-7);
        super("GrHouse "+ i,house);
    }
}
//city

//road
let road_geo = new T.BoxGeometry(4,4,h-10);
class GrRoad extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor (params = {}) {
        let i = params.index?? 9;
        let j = params.vertex?? 0;
        let color = params.color?? "red";
        let road_mat = new T.MeshStandardMaterial({color:color, map:house_texture});
        let road = new T.Group();
        let mesh = new T.Mesh(road_geo,road_mat);
        road.add(mesh);
        let point = edge_coord(i,j);
        road.position.set(point[0],2.5,point[1]);
        road.rotateY(point[2]);
        super("GrRoad "+ i,road);
    }
}

//bird

//ship

//camera

let land = new GrLand();
world.add(land);
let forest1 = new GrForest({index: 2});
let forest2 = new GrForest({index: 8});
let forest3 = new GrForest({index: 10});
let forest4 = new GrForest({index: 12});
world.add(forest1);
world.add(forest2);
world.add(forest3);
world.add(forest4);
let plains1 = new GrPlains({index:1});
let plains2 = new GrPlains({index:5});
let plains3 = new GrPlains({index:15});
let plains4 = new GrPlains({index:18});
world.add(plains1);
world.add(plains2);
world.add(plains3);
world.add(plains4);
let sheep1 = new GrSheep({index:1});
let sheep2 = new GrSheep({index:5});
let sheep3 = new GrSheep({index:15});
let sheep4 = new GrSheep({index:18});
world.add(sheep1);
world.add(sheep2);
world.add(sheep3);
world.add(sheep4);
let clay1 = new GrClay({index:4});
let clay2 = new GrClay({index:6});
let clay3 = new GrClay({index:16});
world.add(clay1);
world.add(clay2);
world.add(clay3);
let claymounds1 = new GrClayMounds({index:4});
let claymounds2 = new GrClayMounds({index:6});
let claymounds3 = new GrClayMounds({index:16});
world.add(claymounds1);
world.add(claymounds2);
world.add(claymounds3);
let excavator1 = new GrExcavator({index: 4});
let excavator2 = new GrExcavator({index: 6});
let excavator3 = new GrExcavator({index: 16});
world.add(excavator1);
world.add(excavator2);
world.add(excavator3);
let wheat1 = new GrWheat({index:3});
let wheat2 = new GrWheat({index:7});
let wheat3 = new GrWheat({index:14});
let wheat4 = new GrWheat({index:17});
world.add(wheat1);
world.add(wheat2);
world.add(wheat3);
world.add(wheat4);
let wheatbales1 = new GrWheatBales({index:3});
let wheatbales2 = new GrWheatBales({index:7});
let wheatbales3 = new GrWheatBales({index:14});
let wheatbales4 = new GrWheatBales({index:17});
world.add(wheatbales1);
world.add(wheatbales2);
world.add(wheatbales3);
world.add(wheatbales4);
let ore1 = new GrOre({index:0});
let ore2 = new GrOre({index:11});
let ore3 = new GrOre({index:13});
world.add(ore1);
world.add(ore2);
world.add(ore3);
let mountain1 = new GrMountain({index: 0});
let mountain2 = new GrMountain({index: 11});
let mountain3 = new GrMountain({index: 13});
world.add(mountain1);
world.add(mountain2);
world.add(mountain3);
let desert = new GrDesert();
world.add(desert);
let robber = new GrRobber({amplitude: 100});
world.add(robber);
let house1 = new GrHouse({index:0,vertex:2});
let house2 = new GrHouse({index:9,vertex:0,});
let house3 = new GrHouse({index:9,vertex:3,color:"blue"});
let house4 = new GrHouse({index:12,vertex:1,color:"blue"});
world.add(house1);
world.add(house2);
world.add(house3);
world.add(house4);
let road1 = new GrRoad({index:4,vertex:0});
let road2 = new GrRoad({index:4,vertex:1});
let road3 = new GrRoad({index:9,vertex:0});
let road4 = new GrRoad({index:13,vertex:5,color: "blue"});
let road5 = new GrRoad({index:13,vertex:0,color: "blue"});
let road6 = new GrRoad({index:13,vertex:1,color: "blue"});
let road7 = new GrRoad({index:14,vertex:3,color: "blue"});
world.add(road1);
world.add(road2);
world.add(road3);
world.add(road4);
world.add(road5);
world.add(road6);
world.add(road7);


highlight("GrRobber");
highlight("GrHouse 0");
highlight("GrRoad 4");
highlight("GrSheep 1");
highlight("GrPlains 1");
highlight("GrClay 4");
highlight("GrWheatBales 3");
highlight("GrWheat 3");
highlight("GrForest 2");
highlight("GrExcavator 4");
highlight("GrOre 0");
highlight("GrDesert");

///////////////////////////////////////////////////////////////
// build and run the UI
// only after all the objects exist can we build the UI
// @ts-ignore       // we're sticking a new thing into the world
world.ui = new WorldUI(world);
// now make it go!
world.go();
