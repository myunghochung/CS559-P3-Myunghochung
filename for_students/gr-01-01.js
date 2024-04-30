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
    groundplanesize: 64, // make the ground plane big enough for a world of stuff
    groundplanecolor: "green"
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

let squares =[];
const size = 10;
let loader = new T.TextureLoader();



//================================== HELPER FUNCTIONS ==================================
//helper function find coordinates on plane given the index i
function coordinates(i) {
    let x;
    let z;
    let u = i%8;
    x = i%8 * size - 4.5 * size;
    z = Math.floor(i/8)* size + 4.5 * size;
    return [x,z];
}

//helper function to find the distance given x and z
function distance(x,z) {
    let d = Math.sqrt(x*x + z*z);
    return d;
}

//================================== OBJECT CLASSES ==================================
let square_geo = new T.BoxGeometry(size,1,size);
let white_square_mat = new T.MeshStandardMaterial({color: "rgb(196,164,132)",roughness:1});
let black_square_mat = new T.MeshStandardMaterial({color: "rgb(55,33,0)",roughness:1});
class GrChessBoard extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        let chessboard = new T.Group();
        for(let i=1; i< 9; i++){
            for(let j =1; j<9; j++) {
                if((i+j)%2==1){
                    let white_squre = new T.Mesh(square_geo,white_square_mat);
                    white_squre.position.set(i*size,1,-j*size);
                    chessboard.add(white_squre);
                }else {
                    let black_squre = new T.Mesh(square_geo,black_square_mat);
                    black_squre.position.set(i*size,1,-j*size);
                    chessboard.add(black_squre);
                }
            }
        }
        chessboard.position.set(-size*4.5,0,size*4.5);
        super("GrChessBoard",chessboard);
    }
}

let white_piece_mat = new T.MeshStandardMaterial({color:"white",roughness:1});
let black_piece_mat = new T.MeshStandardMaterial({color:"white",roughness:1});

class GrPawn extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        let color = params.color?? 0; //0 - white, 1 - black 

    }
}
///////////////////////////////////////////////////////////////

let chessboard = new GrChessBoard();
world.add(chessboard);
// build and run the UI
// only after all the objects exist can we build the UI
// @ts-ignore       // we're sticking a new thing into the world
world.ui = new WorldUI(world);
// now make it go!
world.go();
