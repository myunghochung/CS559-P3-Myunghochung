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

const size = 10;
let selectedGrObj;
let selectedPiece;
let selectedSquare;
let possibleMoves;
let turn = 0; //keep track of whose turn it is. 0 for white, 1 for black.
let pieces = []; //array tracking GrObjects
let capturedWhite = []; //captured white pieces
let capturedBlack = []; //captured balck pieces



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

//helper function to set userData for all descendants of an object
function setUserDataRecursive(object, userData) {
    // Set userData for the current object
    object.userData = userData;

    // Iterate through each child of the current object
    object.children.forEach(child => {
        // Recursively set userData for each child
        setUserDataRecursive(child, userData);
    });
}

//helper function to get board position from the world position
function getBoardPosition(position) {
    return [position.x-3.5*size,position.z+3.5*size];
}

//helper function to get board index from the board position
function getBoardIndex(position) {
    let x;
    let z;
    let row;
    let column;
    if(position instanceof T.Vector3) {
        x = position.x + 3.5*size;
        z = position.z - 3.5*size;
    }else {
        x = position[0] + 3.5*size;
        z = position[1] - 3.5*size;
    }
    row = -Math.floor(z/size);
    column = Math.floor(x/size);
    return column + row*8;
}

//heper function to get previous board index from current piece's world position
function getPrevBoardIndex(worldPosition) {
    let x = worldPosition.x + 3.5*size;
    let z = -worldPosition.z + 3.5*size;
    let row = Math.floor(z/size);
    let column = Math.floor(x/size);
    return column + row*8;
}

//helper function to find position of captured white pieces
function capturedWhitePosition(piece) {
    capturedWhite.push(piece);
    let x;
    let z;
    if (capturedWhite.length < 8){
        x = 4.5*size;
        z = capturedWhite.length *size - 4.5*size;
    } else {
        x = 5.5*size;
        z = (capturedWhite.length - 7) *size - 4.5*size;
    }
    return([x,z]);    
}

//helper function to find position of captured black pieces
function capturedBlackPosition(piece) {
    capturedBlack.push(piece);
    let x;
    let z;
    if (capturedBlack.length < 8){
        x = -4.5*size;
        z = capturedBlack.length *size - 4.5*size;
    } else {
        x = -5.5*size;
        z = (capturedBlack.length - 7) *size - 4.5*size;
    }
    return([x,z]);    
}


//////////////////////////////////// Spot Light ///////////////////////////////////////
let spotlight = new T.SpotLight("green",1000)
spotlight.angle = Math.PI/25;
spotlight.castShadow = true;


//////////////////////////////////// GAME MECHANICS ///////////////////////////////////////


const raycaster = new T.Raycaster();
const pointer = new T.Vector2();

const onMouseMove = (event) => {
    // calculate pointer position in normalized device coordinates
	// (-1 to +1) for both components

    pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, world.camera);
}

function onClick(event) {
    pointer.x = (event.offsetX / canvas.clientWidth) * 2 - 1;
    pointer.y = -(event.offsetY / canvas.clientHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, world.camera);
    let intersects = raycaster.intersectObjects(world.scene.children);
    if (intersects.length>0) {
        intersects = intersects[0];
    }
    if(intersects.length !=0) {
        let selection = intersects.object.userData;
        makeMoveOrShowMoves(selection);
    }
}

window.addEventListener('mousemove',onMouseMove);
window.addEventListener('click',onClick);

let makeMoveOrShowMoves = function(selection) {
    if(selectedPiece == null || isValidPiece(selection)) { //don't have a previously selected piece or we selected a different piece
        showMoves(selection);
    } else { // we selected a square or opponent piece, so try to move
        makeMove(selection);
    }
}

let makeMove = function(selection) {
    let newPosition;
    let currentPosition;
    let capture;
    let newBoardIndex;
    if(selection instanceof GrObject) { //we selected opponent piece, try capturing
        newPosition =selection.objects[0].position;
        currentPosition = selectedPiece.position;
        capture = 1;
    }else { //selected a square, try moving
        selectedSquare = selection;
        newPosition = getBoardPosition(selectedSquare.position);
        newBoardIndex = getBoardIndex(newPosition);
        currentPosition = selectedPiece.position;
        if(!isSquareEmpty(newBoardIndex) && pieces[newBoardIndex].color != turn) {
            selection = pieces[newBoardIndex];
            capture = 1;
        }
    }
    if(isValidMove(currentPosition,newPosition)) { // move piece
        let currentIndex = getPrevBoardIndex(currentPosition);
        newBoardIndex = getBoardIndex(newPosition);
        if (newPosition instanceof T.Vector3) {
            selectedPiece.position.set(newPosition.x,0,newPosition.z);
        }else {
            selectedPiece.position.set(newPosition[0],0,newPosition[1]);
        }
        pieces[newBoardIndex] = selectedGrObj;
        pieces[currentIndex] = null;
        if(selectedGrObj instanceof GrPawn ) {
            selectedGrObj.firstMove = 0;
        }
        if(capture) {
            selection.captured = 1;
            let position;
            if(selection.color == 0) {
                position = capturedWhitePosition(selection);
            } else {
                position = capturedBlackPosition(selection);
            }
            selection.objects[0].position.set(position[0],-2,position[1]);
        }
        changeTurn();
    } 
    selectedGrObj = null;
    selectedPiece = null;
    selectedSquare = null;
    spotlight.intensity = 0;
    
}

let showMoves = function(selection) {
    if(isValidPiece(selection) && selection instanceof GrObject){ //we selected a piece, so display its possible moves
        selectedGrObj = selection;
        selectedPiece = selection.objects[0];
        spotlight.intensity = 10000;
        spotlight.position.set(selectedPiece.position.x,35,selectedPiece.position.z);
        spotlight.target = selectedPiece;
        selectedPiece.position;
        let possibleMoves = getPossibleMoves(getPrevBoardIndex(selectedPiece.position));  
    }
}

let isValidMove = function(currentPosition ,newPosition) {
    let valid = 0;
    if(currentPosition == null) {
        return 0;
    }
    let currentIndex = getPrevBoardIndex(currentPosition);
    let newIndex = getBoardIndex(newPosition);
    let possibleMoves = getPossibleMoves(currentIndex);
    possibleMoves.forEach(index => {
        if(index == newIndex) {
            valid = 1;
        }
    })
    return valid;
}

let isValidPiece = function(selection) {
    let valid = 0;
    if(turn == 0) {
        if(selection.color == 0) {
            valid = 1;
        }
    } else {
        if(selection.color == 1) {
            valid = 1;
        }
    }
    if(selection.captured==1) {
        valid = 0;
    }
    return valid;
}

let getPossibleMoves = function(index) {
    let possibleMoves = [];
    if(selectedGrObj instanceof GrPawn) {
        if(selectedGrObj.color == 0) { // white
            let forward = index+8;
            if(forward < 64 && isSquareEmpty(forward)) { //move forward 
                possibleMoves.push(forward);
            }
            let forwardRight = index + 9;
            if(forwardRight < 64 && !isSquareEmpty(forwardRight)) { //take forward right piece
                if (pieces[forwardRight].color == 1) {
                    possibleMoves.push(forwardRight);
                }
            }
            let forwardLeft = index + 7;
            if(forwardLeft < 64 && !isSquareEmpty(forwardLeft)) { //take forward left piece
                if (pieces[forwardLeft].color == 1) {
                    possibleMoves.push(forwardLeft);
                }
            }
            if(selectedGrObj.firstMove == 1) { //first move
                let forward2 = index+16;
                if(forward2 < 64 && isSquareEmpty(forward2) && isSquareEmpty(forward)) { //move forward 
                    possibleMoves.push(forward2);
                }
            }
        }else { // black
            let forward = index-8;
            if(forward >= 0 && isSquareEmpty(forward)) { //move forward 
                possibleMoves.push(forward);
            }
            let forwardRight = index - 7;
            if(forwardRight >= 0 && !isSquareEmpty(forwardRight)) { //take forward right piece
                if (pieces[forwardRight].color == 0) {
                    possibleMoves.push(forwardRight);
                }
            }
            let forwardLeft = index - 9;
            if(forwardLeft >= 0 && !isSquareEmpty(forwardLeft)) { //take forward left piece
                if (pieces[forwardLeft].color == 0) {
                    possibleMoves.push(forwardLeft);
                }
            }
            if(selectedGrObj.firstMove == 1) { //first move
                let forward2 = index-16;
                if(forward2 >= 0 && isSquareEmpty(forward2) && isSquareEmpty(forward)) { //move forward 
                    possibleMoves.push(forward2);
                }
            }
        }
    } else if(selectedGrObj instanceof GrRook){
        let forward = index +8;
        while(forward < 64 && (isSquareEmpty(forward) || (pieces[forward].color != selectedGrObj.color))) {
            possibleMoves.push(forward);
            forward = forward +8;
        }
        let right = index +1;
        while(right%8 != 0 && (isSquareEmpty(right) || (pieces[right].color != selectedGrObj.color))) {
            possibleMoves.push(right);
            right = right +1;
        }
        let left = index -1;
        while(left%8 != 7 && (isSquareEmpty(left) || (pieces[left].color != selectedGrObj.color))) {
            possibleMoves.push(left);
            left = left -1;
        }
        let down = index -8;
        while(down >= 0 && (isSquareEmpty(down) || (pieces[down].color != selectedGrObj.color))) {
            possibleMoves.push(down);
            down = down -8;
        }
    } else if(selectedGrObj instanceof GrBishop){
        let forwardRight = index + 9;
        while(forwardRight % 8 != 0 && forwardRight < 64 && (isSquareEmpty(forwardRight) || (pieces[forwardRight].color != selectedGrObj.color))) {
            possibleMoves.push(forwardRight);
            forwardRight = forwardRight +9;
        }
        let forwardLeft = index + 7;
        while(forwardLeft % 8 != 7 && forwardLeft < 64 && (isSquareEmpty(forwardLeft) || (pieces[forwardLeft].color != selectedGrObj.color))) {
            possibleMoves.push(forwardLeft);
            forwardLeft = forwardLeft +7;
        }
        let backRight = index - 7;
        while(backRight % 8 != 0 && backRight >0 && (isSquareEmpty(backRight) || (pieces[backRight].color != selectedGrObj.color))) {
            possibleMoves.push(backRight);
            backRight = backRight -7;
        }
        let backLeft = index - 9;
        while(backLeft % 8 != 7 && backLeft >0 && (isSquareEmpty(backLeft) || (pieces[backLeft].color != selectedGrObj.color))) {
            possibleMoves.push(backLeft);
            backLeft = backLeft - 9;
        }
    } else if(selectedGrObj instanceof GrQueen){
        let forward = index +8;
        while(forward < 64 && (isSquareEmpty(forward) || (pieces[forward].color != selectedGrObj.color))) {
            possibleMoves.push(forward);
            forward = forward +8;
        }
        let right = index +1;
        while(right%8 != 0 && (isSquareEmpty(right) || (pieces[right].color != selectedGrObj.color))) {
            possibleMoves.push(right);
            right = right +1;
        }
        let left = index -1;
        while(left%8 != 7 && (isSquareEmpty(left) || (pieces[left].color != selectedGrObj.color))) {
            possibleMoves.push(left);
            left = left -1;
        }
        let down = index -8;
        while(down >= 0 && (isSquareEmpty(down) || (pieces[down].color != selectedGrObj.color))) {
            possibleMoves.push(down);
            down = down -8;
        }
        let forwardRight = index + 9;
        while(forwardRight % 8 != 0 && forwardRight < 64 && (isSquareEmpty(forwardRight) || (pieces[forwardRight].color != selectedGrObj.color))) {
            possibleMoves.push(forwardRight);
            forwardRight = forwardRight +9;
        }
        let forwardLeft = index + 7;
        while(forwardLeft % 8 != 7 && forwardLeft < 64 && (isSquareEmpty(forwardLeft) || (pieces[forwardLeft].color != selectedGrObj.color))) {
            possibleMoves.push(forwardLeft);
            forwardLeft = forwardLeft +7;
        }
        let backRight = index - 7;
        while(backRight % 8 != 0 && backRight >0 && (isSquareEmpty(backRight) || (pieces[backRight].color != selectedGrObj.color))) {
            possibleMoves.push(backRight);
            backRight = backRight -7;
        }
        let backLeft = index - 9;
        while(backLeft % 8 != 7 && backLeft >0 && (isSquareEmpty(backLeft) || (pieces[backLeft].color != selectedGrObj.color))) {
            possibleMoves.push(backLeft);
            backLeft = backLeft - 9;
        }
    } else if(selectedGrObj instanceof GrKing){
        let forward = index +8;
        if(forward < 64 && (isSquareEmpty(forward) || (pieces[forward].color != selectedGrObj.color))) {
            possibleMoves.push(forward);
        }
        let right = index +1;
        if(right%8 != 0 && (isSquareEmpty(right) || (pieces[right].color != selectedGrObj.color))) {
            possibleMoves.push(right);
        }
        let left = index -1;
        if(left%8 != 7 && (isSquareEmpty(left) || (pieces[left].color != selectedGrObj.color))) {
            possibleMoves.push(left);
        }
        let down = index -8;
        if(down < 64 && (isSquareEmpty(down) || (pieces[down].color != selectedGrObj.color))) {
            possibleMoves.push(down);
        }
        let forwardRight = index + 9;
        if(forwardRight % 8 != 0 && (isSquareEmpty(forwardRight) || (pieces[forwardRight].color != selectedGrObj.color))) {
            possibleMoves.push(forwardRight);
        }
        let forwardLeft = index + 7;
        if(forwardLeft % 8 != 7 && (isSquareEmpty(forwardLeft) || (pieces[forwardLeft].color != selectedGrObj.color))) {
            possibleMoves.push(forwardLeft);
        }
        let backRight = index - 7;
        if(backRight % 8 != 0 && (isSquareEmpty(backRight) || (pieces[backRight].color != selectedGrObj.color))) {
            possibleMoves.push(backRight);
        }
        let backLeft = index - 9;
        if(backLeft % 8 != 7 && (isSquareEmpty(backLeft) || (pieces[backLeft].color != selectedGrObj.color))) {
            possibleMoves.push(backLeft);
        }
    } else if(selectedGrObj instanceof GrKnight){
        let fr = index + 17;
        let rf = index + 10;
        let rb = index - 6;
        let br = index - 15;
        let bl = index - 17;
        let lb = index - 10;
        let lf = index + 6;
        let fl = index + 15;
        if(fr %8 !=0 && fr < 64 && (isSquareEmpty(fr) || (pieces[fr].color != selectedGrObj.color))) {
            possibleMoves.push(fr);
        }
        if(rf %8 !=1 && rf < 64 && (isSquareEmpty(rf) || (pieces[rf].color != selectedGrObj.color))) {
            possibleMoves.push(rf);
        }
        if(fl %8 !=7 && fl < 64 && (isSquareEmpty(fl) || (pieces[fl].color != selectedGrObj.color))) {
            possibleMoves.push(fl);
        }
        if(lf %8 !=2 && lf < 64 && (isSquareEmpty(lf) || (pieces[lf].color != selectedGrObj.color))) {
            possibleMoves.push(lf);
        }
        if(br %8 !=0 && fr >= 0 && (isSquareEmpty(br) || (pieces[br].color != selectedGrObj.color))) {
            possibleMoves.push(br);
        }
        if(rb %8 !=1 && rf >= 0 && (isSquareEmpty(rb) || (pieces[rb].color != selectedGrObj.color))) {
            possibleMoves.push(rb);
        }
        if(bl %8 !=7 && fl >= 0 && (isSquareEmpty(bl) || (pieces[bl].color != selectedGrObj.color))) {
            possibleMoves.push(bl);
        }
        if(lb %8 !=2 && lf >= 0 && (isSquareEmpty(lb) || (pieces[lb].color != selectedGrObj.color))) {
            possibleMoves.push(lb);
        }
    }
    return possibleMoves;
}

let isSquareEmpty = function(index) {
    return pieces[index] == null;
}

let changeTurn = function() {
    if (turn == 0) {
        turn = 1;
    } else {
        turn = 0;
    }
}


//////////////////////////////////// OBJECT CLASSES /////////////////////////////////////////////
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
                    let white_square = new T.Mesh(square_geo,white_square_mat);
                    white_square.position.set(i*size,1,-j*size);
                    white_square.userData = white_square;
                    chessboard.add(white_square);
                }else {
                    let black_square = new T.Mesh(square_geo,black_square_mat);
                    black_square.position.set(i*size,1,-j*size);
                    black_square.userData = black_square;
                    chessboard.add(black_square);
                }
            }
        }
        chessboard.position.set(-size*3.5,0,size*3.5);
        super("GrChessBoard",chessboard);

        // setUserDataRecursive(chessboard,this);
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
        let color = params.color?? "white"; 
        let index = params.index?? 21;
        let num = params.num?? 1;
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
        super(color+"_Pawn_"+num,pawn);
        setUserDataRecursive(pawn,this);
        this.pawn = pawn;
        if(color == "white") {
            this.color = 0;
        } else {
            this.color = 1;
        }
        this.firstMove = 1;
        this.captured = 0;
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
    let num = params.num?? 1;
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
    super(color+"_Rook_"+num,rook);
    setUserDataRecursive(rook,this);
    if(color == "white") {
        this.color = 0;
    } else {
        this.color = 1;
    }
    this.capture = 0;
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
    let num = params.num?? 1;
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
    super(color+"_Knight_"+num,knight);
    setUserDataRecursive(knight,this);
    if(color == "white") {
        this.color = 0;
    } else {
        this.color = 1;
    }
    this.capture = 0;
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
    let num = params.num?? 1;
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
    super(color+"_Bishop_"+num,bishop);
    setUserDataRecursive(bishop,this);
    if(color == "white") {
        this.color = 0;
    } else {
        this.color = 1;
    }
    this.capture = 0;
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
    super(color + "_Queen",queen);
    setUserDataRecursive(queen,this);
    if(color == "white") {
        this.color = 0;
    } else {
        this.color = 1;
    }
    this.capture = 0;
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
    super(color + "_King ",king);
    setUserDataRecursive(king,this);
    if(color == "white") {
        this.color = 0;
    } else {
        this.color = 1;
    }
    this.capture = 0;
   }
}
///////////////////////////////////////////////////////////////
//Add objects to GrWorld
let chessboard = new GrChessBoard();
world.add(chessboard);
world.scene.add(spotlight);
// world.scene.add(spotLightHelper);
let white_pawn_1 = new GrPawn({color:"white",index: 21,num: 1});
let white_pawn_2 = new GrPawn({color:"white",index: 22,num: 2});
let white_pawn_3 = new GrPawn({color:"white",index: 23,num: 3});
let white_pawn_4 = new GrPawn({color:"white",index: 24,num: 4});
let white_pawn_5 = new GrPawn({color:"white",index: 25,num: 5});
let white_pawn_6 = new GrPawn({color:"white",index: 26,num: 6});
let white_pawn_7 = new GrPawn({color:"white",index: 27,num: 7});
let white_pawn_8 = new GrPawn({color:"white",index: 28,num: 8});
let black_pawn_1 = new GrPawn({color:"black",index: 71,num: 1});
let black_pawn_2 = new GrPawn({color:"black",index: 72,num: 2});
let black_pawn_3 = new GrPawn({color:"black",index: 73,num: 3});
let black_pawn_4 = new GrPawn({color:"black",index: 74,num: 4});
let black_pawn_5 = new GrPawn({color:"black",index: 75,num: 5});
let black_pawn_6 = new GrPawn({color:"black",index: 76,num: 6});
let black_pawn_7 = new GrPawn({color:"black",index: 77,num: 7});
let black_pawn_8 = new GrPawn({color:"black",index: 78,num: 8});
let white_rook_1 = new GrRook({color:"white",index: 11,num: 1});
let white_rook_2 = new GrRook({color:"white",index: 18,num: 2});
let black_rook_1 = new GrRook({color:"black",index: 81,num: 1});
let black_rook_2 = new GrRook({color:"black",index: 88,num: 2});
let white_knight_1 = new GrKnight({color:"white",index: 12,num: 1});
let white_knight_2 = new GrKnight({color:"white",index: 17,num: 2});
let black_knight_1 = new GrKnight({color:"black",index: 82,num: 1});
let black_knight_2 = new GrKnight({color:"black",index: 87,num: 2});
let white_bishop_1 = new GrBishop({color:"white",index: 13,num: 1});
let white_bishop_2 = new GrBishop({color:"white",index: 16,num: 2});
let black_bishop_1 = new GrBishop({color:"black",index: 83,num: 1});
let black_bishop_2 = new GrBishop({color:"black",index: 86,num: 2});
let white_queen = new GrQueen({color:"white",index: 14});
let black_queen = new GrQueen({color:"black",index: 84});
let white_king = new GrKing({color:"white",index: 15});
let black_king = new GrKing({color:"black",index: 85});
world.add(white_pawn_1);
world.add(white_pawn_2);
world.add(white_pawn_3);
world.add(white_pawn_4);
world.add(white_pawn_5);
world.add(white_pawn_6);
world.add(white_pawn_7);
world.add(white_pawn_8);
world.add(black_pawn_1);
world.add(black_pawn_2);
world.add(black_pawn_3);
world.add(black_pawn_4);
world.add(black_pawn_5);
world.add(black_pawn_6);
world.add(black_pawn_7);
world.add(black_pawn_8);
world.add(white_rook_1);
world.add(white_rook_2);
world.add(black_rook_1);
world.add(black_rook_2);
world.add(white_knight_1);
world.add(white_knight_2);
world.add(black_knight_1);
world.add(black_knight_2);
world.add(white_bishop_1);
world.add(white_bishop_2);
world.add(black_bishop_1);
world.add(black_bishop_2);
world.add(white_queen);
world.add(black_queen);
world.add(white_king);
world.add(black_king);

//add GrObjects to pieces array
pieces = [white_rook_1,white_knight_1,white_bishop_1,white_queen,white_king,white_bishop_2,white_knight_2,white_rook_2,
          white_pawn_1,white_pawn_2,white_pawn_3,white_pawn_4,white_pawn_5,white_pawn_6,white_pawn_7,white_pawn_8];
for(let i = 0; i < 32; i++) {
    pieces.push(null);
}
pieces.push(black_pawn_1,black_pawn_2,black_pawn_3,black_pawn_4,black_pawn_5,black_pawn_6,black_pawn_7,black_pawn_8);
pieces.push(black_rook_1,black_knight_1,black_bishop_1,black_queen,black_king,black_bishop_2,black_knight_2,black_rook_2);



// build and run the UI
// only after all the objects exist can we build the UI
// @ts-ignore       // we're sticking a new thing into the world
world.ui = new WorldUI(world);
// now make it go!
world.go();
