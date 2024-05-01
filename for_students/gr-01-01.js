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
    let x = (i%10-1) * size - 3.5 * size;
    let z = -(Math.floor(i/10) -1)* size + 3.5 * size;
    return [x,z];
}

//helper function to find the distance given x and z
function distance(x,z) {
    let d = Math.sqrt(x*x + z*z);
    return d;
}

//================================== OBJECT CLASSES ==================================
let square_geo = new T.BoxGeometry(size,2,size);
let white_square_mat = new T.MeshStandardMaterial({color: "rgb(196,164,132)",roughness:1});
let black_square_mat = new T.MeshStandardMaterial({color: "rgb(55,33,0)",roughness:1});
class GrChessBoard extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        let chessboard = new T.Group();
        for(let i=0; i< 8; i++){
            for(let j =0; j<8; j++) {
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
        chessboard.position.set(-size*3.5,0,size*3.5);
        super("GrChessBoard",chessboard);
    }
}

let white_piece_mat = new T.MeshStandardMaterial({color: "white",roughness:1});
let black_piece_mat = new T.MeshStandardMaterial({color:"rgb(100,100,100)",roughness:1});
let base_geo1 = new T.CylinderGeometry(3,3,1);
let base_geo2 = new T.CylinderGeometry(2,3,1);
let base_geo3 = new T.CylinderGeometry(1,2,3);
let base_geo4 = new T.CylinderGeometry(2,1,0.5);
let base_geo5 = new T.CylinderGeometry(1,2,0.5);
let pawn_head_geo = new T.SphereGeometry(1.5);

class GrPawn extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
    constructor(params = {}) {
        let color = params.color?? "white"; //0 - white, 1 - black 
        let index = params.index?? 21;
        let pawn = new T.Group();
        let base1;
        let base2;
        let base3;
        let base4;
        let base5;
        let head;
        if(color == "white"){
            base1 = new T.Mesh(base_geo1,white_piece_mat);
            base2 = new T.Mesh(base_geo2,white_piece_mat);
            base3 = new T.Mesh(base_geo3,white_piece_mat);
            base4 = new T.Mesh(base_geo4,white_piece_mat);
            base5 = new T.Mesh(base_geo5,white_piece_mat);
            head = new T.Mesh(pawn_head_geo,white_piece_mat);
        }else {
            base1 = new T.Mesh(base_geo1,black_piece_mat);
            base2 = new T.Mesh(base_geo2,black_piece_mat);
            base3 = new T.Mesh(base_geo3,black_piece_mat);
            base4 = new T.Mesh(base_geo4,black_piece_mat);
            base5 = new T.Mesh(base_geo5,black_piece_mat);
            head = new T.Mesh(pawn_head_geo,black_piece_mat);
        }
        base1.translateY(2.5);
        base2.translateY(3.5);
        base3.translateY(5.5);
        base4.translateY(7.25);
        base5.translateY(7.75);
        head.translateY(8.75);
        pawn.add(base1);
        pawn.add(base2);
        pawn.add(base3);
        pawn.add(base4);
        pawn.add(base5);
        pawn.add(head);
        let coord = coordinates(index);
        pawn.position.set(coord[0],0,coord[1]);
        super(color+" GrPawn "+index%10,pawn);
    }
}

let rook_body_geo = new T.CylinderGeometry(1.5,2,5);
let rook_head_geo = new T.CylinderGeometry(2,2,1);
let rook_crown_geo = new T.BoxGeometry(1.5,1,1);
class GrRook extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
   constructor(params = {}) {
    let color = params.color?? "white"; //0 - white, 1 - black 
    let index = params.index?? 11;
    let rook = new T.Group();
    let base1;
    let base2;
    let base3;
    let head;
    let crown1;
    let crown2;
    let crown3;
    let crown4;
    if(color == "white"){
        base1 = new T.Mesh(base_geo1,white_piece_mat);
        base2 = new T.Mesh(base_geo2,white_piece_mat);
        base3 = new T.Mesh(rook_body_geo,white_piece_mat);
        head = new T.Mesh(rook_head_geo,white_piece_mat);
        crown1 = new T.Mesh(rook_crown_geo,white_piece_mat);
        crown2 = new T.Mesh(rook_crown_geo,white_piece_mat);
        crown3 = new T.Mesh(rook_crown_geo,white_piece_mat);
        crown4 = new T.Mesh(rook_crown_geo,white_piece_mat);
    }else {
        base1 = new T.Mesh(base_geo1,black_piece_mat);
        base2 = new T.Mesh(base_geo2,black_piece_mat);
        base3 = new T.Mesh(rook_body_geo,black_piece_mat);
        head = new T.Mesh(rook_head_geo,black_piece_mat);
        crown1 = new T.Mesh(rook_crown_geo,black_piece_mat);
        crown2 = new T.Mesh(rook_crown_geo,black_piece_mat);
        crown3 = new T.Mesh(rook_crown_geo,black_piece_mat);
        crown4 = new T.Mesh(rook_crown_geo,black_piece_mat);
    }
    base1.translateY(2.5);
    base2.translateY(3.5);
    base3.translateY(6.5);
    head.translateY(9.5);
    crown1.position.set(0,1,1.4);
    crown2.position.set(0,1,-1.4);
    crown3.position.set(1.4,1,0);
    crown4.position.set(-1.4,1,0);
    crown3.rotateY(Math.PI/2);
    crown4.rotateY(Math.PI/2);
    rook.add(base1);
    rook.add(base2);
    rook.add(base3);
    rook.add(head);
    head.add(crown1);
    head.add(crown2);
    head.add(crown3);
    head.add(crown4);
    let coord = coordinates(index);
    rook.position.set(coord[0],0,coord[1]);
    super(color + " GrRook " + index,rook);
   }
}
const knight_shape = new T.Shape();
knight_shape.moveTo(0,-1);
knight_shape.lineTo(2,-1);
knight_shape.lineTo(2,0);
knight_shape.lineTo(1.9,1);
knight_shape.lineTo(2,2);
knight_shape.lineTo(2,3);
knight_shape.lineTo(1.5,4);
knight_shape.lineTo(1,4);
knight_shape.lineTo(0.75,4.8);
knight_shape.lineTo(0.5,4);
knight_shape.lineTo(0,3.8);
knight_shape.lineTo(-0.2,3);
knight_shape.lineTo(-1,2.5);
knight_shape.lineTo(-0.8,1.8);
knight_shape.lineTo(0,2);
knight_shape.lineTo(0.6,1.8);
knight_shape.lineTo(0.4,1);
knight_shape.lineTo(0,0);
knight_shape.lineTo(0,-1);

const extrudeSettings = {
	steps: 2,
	depth: 0.5,
	bevelEnabled: true,
	bevelThickness: 1,
	bevelSize: 0.5,
	bevelOffset: 0,
	bevelSegments: 2
};
let knight_geo = new T.ExtrudeGeometry(knight_shape,extrudeSettings);
class GrKnight extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
   constructor(params = {}) {
    let color = params.color?? "white"; //0 - white, 1 - black 
    let index = params.index?? 12;
    let knight = new T.Group();
    let base1;
    let base2;
    let head;
    if(color == "white"){
        base1 = new T.Mesh(base_geo1,white_piece_mat);
        base2 = new T.Mesh(base_geo2,white_piece_mat);
        head = new T.Mesh(knight_geo,white_piece_mat);
        knight.rotateY(-Math.PI/2);
    }else {
        base1 = new T.Mesh(base_geo1,black_piece_mat);
        base2 = new T.Mesh(base_geo2,black_piece_mat);
        head = new T.Mesh(knight_geo,black_piece_mat);
        knight.rotateY(Math.PI/2);
    }
    base1.translateY(2.5);
    base2.translateY(3.5);
    head.position.set(-1.2,5.8,-0.35);
    head.scale.set(1.2,1.2,1.2);
    knight.add(base1);
    knight.add(base2);
    knight.add(head);
    let coord = coordinates(index);
    knight.position.set(coord[0],0,coord[1]);
    super(color + " GrKnight " + index,knight);
   }
}

let bishop_body_geo = new T.CylinderGeometry(1,2,6);
let bishop_head_geo1 = new T.CylinderGeometry(1,0.5,1);
let bishop_head_geo2 = new T.CylinderGeometry(1,1,0.5);
let bishop_head_geo3 = new T.ConeGeometry(1,2);

class GrBishop extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
   constructor(params = {}) {
    let color = params.color?? "white"; //0 - white, 1 - black 
    let index = params.index?? 13;
    let bishop = new T.Group();
    let base1;
    let base2;
    let base3;
    let base4;
    let base5;
    let head1;
    let head2;
    let head3;
    if(color == "white"){
        base1 = new T.Mesh(base_geo1,white_piece_mat);
        base2 = new T.Mesh(base_geo2,white_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,white_piece_mat);
        base4 = new T.Mesh(base_geo4,white_piece_mat);
        base5 = new T.Mesh(base_geo5,white_piece_mat);
        head1 = new T.Mesh(bishop_head_geo1,white_piece_mat);
        head2 = new T.Mesh(bishop_head_geo2,white_piece_mat);
        head3 = new T.Mesh(bishop_head_geo3,white_piece_mat);
    }else {
        base1 = new T.Mesh(base_geo1,black_piece_mat);
        base2 = new T.Mesh(base_geo2,black_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,black_piece_mat);
        base4 = new T.Mesh(base_geo4,black_piece_mat);
        base5 = new T.Mesh(base_geo5,black_piece_mat);
        head1 = new T.Mesh(bishop_head_geo1,black_piece_mat);
        head2 = new T.Mesh(bishop_head_geo2,black_piece_mat);
        head3 = new T.Mesh(bishop_head_geo3,black_piece_mat);
    }
    base1.translateY(2.5);
    base2.translateY(1);
    base3.translateY(3.5);
    base4.translateY(3);
    base5.translateY(0.5);
    bishop.add(base1);
    base1.add(base2);
    base2.add(base3);
    base3.add(base4);
    base4.add(base5);
    head1.translateY(11);
    head2.translateY(0.75);
    head3.translateY(1.25);
    bishop.add(head1);
    head1.add(head2);
    head2.add(head3);
    let coord = coordinates(index);
    bishop.position.set(coord[0],0,coord[1]);
    super(color + " GrBishop " + index,bishop);
   }
}

let queen_head_geo = new T.SphereGeometry(1);
let spike_geo = new T.ConeGeometry(0.2,1);
class GrQueen extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
   constructor(params = {}) {
    let color = params.color?? "white"; //0 - white, 1 - black 
    let index = params.index?? 13;
    let queen = new T.Group();
    let base1;
    let base2;
    let base3;
    let base4;
    let base5;
    let head;
    let spike1;
    let spike2;
    let spike3;
    let spike4;
    let spike5;
    let spike6;
    let spike7;
    let spike8;
    let spikegroup = new T.Group();
    let headtop;
    let crownbase;
    if(color == "white"){
        base1 = new T.Mesh(base_geo1,white_piece_mat);
        base2 = new T.Mesh(base_geo2,white_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,white_piece_mat);
        base4 = new T.Mesh(base_geo4,white_piece_mat);
        base5 = new T.Mesh(base_geo5,white_piece_mat);
        head = new T.Mesh(queen_head_geo,white_piece_mat);
        spike1 = new T.Mesh(spike_geo,white_piece_mat);
        spike2 = new T.Mesh(spike_geo,white_piece_mat);
        spike3 = new T.Mesh(spike_geo,white_piece_mat);
        spike4 = new T.Mesh(spike_geo,white_piece_mat);
        spike5 = new T.Mesh(spike_geo,white_piece_mat);
        spike6 = new T.Mesh(spike_geo,white_piece_mat);
        spike7 = new T.Mesh(spike_geo,white_piece_mat);
        spike8 = new T.Mesh(spike_geo,white_piece_mat);
        headtop = new T.Mesh(queen_head_geo,white_piece_mat);
        crownbase = new T.Mesh(base_geo4,white_piece_mat);
    }else {
        base1 = new T.Mesh(base_geo1,black_piece_mat);
        base2 = new T.Mesh(base_geo2,black_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,black_piece_mat);
        base4 = new T.Mesh(base_geo4,black_piece_mat);
        base5 = new T.Mesh(base_geo5,black_piece_mat);
        head = new T.Mesh(queen_head_geo,black_piece_mat);
        spike1 = new T.Mesh(spike_geo,black_piece_mat);
        spike2 = new T.Mesh(spike_geo,black_piece_mat);
        spike3 = new T.Mesh(spike_geo,black_piece_mat);
        spike4 = new T.Mesh(spike_geo,black_piece_mat);
        spike5 = new T.Mesh(spike_geo,black_piece_mat);
        spike6 = new T.Mesh(spike_geo,black_piece_mat);
        spike7 = new T.Mesh(spike_geo,black_piece_mat);
        spike8 = new T.Mesh(spike_geo,black_piece_mat);
        headtop = new T.Mesh(queen_head_geo,black_piece_mat);
        crownbase = new T.Mesh(base_geo4,black_piece_mat);
    }
    base1.translateY(2.5);
    base2.translateY(1);
    base3.translateY(3.5);
    base4.translateY(3);
    base5.translateY(0.5);
    queen.add(base1);
    base1.add(base2);
    base2.add(base3);
    base3.add(base4);
    base4.add(base5);
    head.translateY(11.5);
    spike1.position.set(0,1.2,0.8);
    spike1.rotateX(Math.PI/6);
    spike2.position.set(0,1.2,-0.8);
    spike2.rotateX(-Math.PI/6);
    spike3.position.set(0.8,1.2,0);
    spike3.rotateY(Math.PI/2);
    spike3.rotateX(Math.PI/6);
    spike4.position.set(-0.8,1.2,0);
    spike4.rotateY(-Math.PI/2);
    spike4.rotateX(Math.PI/6);
    spike5.position.set(0,1.2,0.8);
    spike5.rotateX(Math.PI/6);
    spike6.position.set(0,1.2,-0.8);
    spike6.rotateX(-Math.PI/6);
    spike7.position.set(0.8,1.2,0);
    spike7.rotateY(Math.PI/2);
    spike7.rotateX(Math.PI/6);
    spike8.position.set(-0.8,1.2,0);
    spike8.rotateY(-Math.PI/2);
    spike8.rotateX(Math.PI/6);
    spikegroup.rotateY(Math.PI/4);
    headtop.translateY(1.1);
    headtop.scale.set(0.3,0.3,0.3);
    crownbase.translateY(0.6);
    crownbase.scale.set(0.5,0.5,0.5);
    queen.add(head);
    head.add(spike1);
    head.add(spike2);
    head.add(spike3);
    head.add(spike4);
    head.add(spikegroup);
    spikegroup.add(spike5);
    spikegroup.add(spike6);
    spikegroup.add(spike7);
    spikegroup.add(spike8);
    head.add(headtop);
    head.add(crownbase);
    let coord = coordinates(index);
    queen.position.set(coord[0],0,coord[1]);
    super(color + " GrQueen " + index,queen);
   }
}

let king_head_geo = new T.CylinderGeometry(1.5,1,2);
let cross_geo = new T.BoxGeometry(0.5,2,0.2);
class GrKing extends GrObject {
    /**
    * The constructor
    * @param {Object} params Parameters
    */
   constructor(params = {}) {
    let color = params.color?? "white"; //0 - white, 1 - black 
    let index = params.index?? 13;
    let king = new T.Group();
    let base1;
    let base2;
    let base3;
    let base4;
    let base5;
    let head;
    let cross1;
    let cross2;
    if(color == "white"){
        base1 = new T.Mesh(base_geo1,white_piece_mat);
        base2 = new T.Mesh(base_geo2,white_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,white_piece_mat);
        base4 = new T.Mesh(base_geo4,white_piece_mat);
        base5 = new T.Mesh(base_geo5,white_piece_mat);
        head = new T.Mesh(king_head_geo,white_piece_mat);
        cross1 = new T.Mesh(cross_geo,white_piece_mat);
        cross2 = new T.Mesh(cross_geo,white_piece_mat);
    }else {
        base1 = new T.Mesh(base_geo1,black_piece_mat);
        base2 = new T.Mesh(base_geo2,black_piece_mat);
        base3 = new T.Mesh(bishop_body_geo,black_piece_mat);
        base4 = new T.Mesh(base_geo4,black_piece_mat);
        base5 = new T.Mesh(base_geo5,black_piece_mat);
        head = new T.Mesh(king_head_geo,black_piece_mat);
        cross1 = new T.Mesh(cross_geo,black_piece_mat);
        cross2 = new T.Mesh(cross_geo,black_piece_mat);
    }
    base1.translateY(2.5);
    base2.translateY(1);
    base3.translateY(3.5);
    base4.translateY(3);
    base5.translateY(0.5);
    king.add(base1);
    base1.add(base2);
    base2.add(base3);
    base3.add(base4);
    base4.add(base5);
    head.translateY(11.75);
    cross1.translateY(2);
    cross2.rotateZ(Math.PI/2);
    king.add(head);
    head.add(cross1);
    cross1.add(cross2);
    let coord = coordinates(index);
    king.position.set(coord[0],0,coord[1]);
    super(color + " GrKing " + index,king);
   }
}
///////////////////////////////////////////////////////////////
let chessboard = new GrChessBoard();
world.add(chessboard);

let pieces = [];
for(let i = 0; i < 8; i++) {
    world.add(new GrPawn({color:"white",index: 21 + i}));
    world.add(new GrPawn({color:"black",index: 71 + i}));
}
world.add(new GrRook({color:"white",index: 11}));
world.add(new GrRook({color:"white",index: 18}));
world.add(new GrRook({color:"black",index: 81}));
world.add(new GrRook({color:"black",index: 88}));
world.add(new GrKnight({color:"white",index: 12}));
world.add(new GrKnight({color:"white",index: 17}));
world.add(new GrKnight({color:"black",index: 82}));
world.add(new GrKnight({color:"black",index: 87}));
world.add(new GrBishop({color:"white",index: 13}));
world.add(new GrBishop({color:"white",index: 16}));
world.add(new GrBishop({color:"black",index: 83}));
world.add(new GrBishop({color:"black",index: 86}));
world.add(new GrQueen({color:"white",index: 14}));
world.add(new GrQueen({color:"black",index: 84}));
world.add(new GrKing({color:"white",index: 15}));
world.add(new GrKing({color:"black",index: 85}));
// let pawn2 = new GrPawn({color:"black",index: 22});
// world.add(pawn2);
// build and run the UI
// only after all the objects exist can we build the UI
// @ts-ignore       // we're sticking a new thing into the world
world.ui = new WorldUI(world);
// now make it go!
world.go();
