import Vector from "./Vector.js";
import Input from "./../enums/Input.js"

export default class Player {

	// Tracks player inputs
	inputs = new Set();
	lastPressed = new Set();
	lastReleased = new Set();
	clearable = false;

	// Packets only sent to specific players (stored on the server)
	// TODO: create a new class inheriting from Player (PlayerServerSide?)
	localPacketBuffer = [];

	constructor(playerId = 0, controls = {}) {
		this.id = playerId;		// Refers to socketId for multiplayer games
		this.typeId = 1;		// Type of device

		this.entity = null;

		// Tracks player's mouse position relative to the game
		this.mousePos = new Vector();

		// EXPERIMENTAL: check for screentouches (mobile gaming)
		this.touchOrigin = new Vector();
		this.touchPos = new Vector();
		this.everTouched = false;
		this.touching = false;

		// Controls
		// TODO: seperate class for mapping controls (client-side only)
		this.controls = {
			up: 	controls.up 	??	Input.Key.W,
			down:   controls.down 	?? 	Input.Key.S,
			left:   controls.left 	?? 	Input.Key.A,
			right:	controls.right 	??	Input.Key.D,
			attack: controls.attack ?? 	Input.Key.SPACE
		}
	}

	addInput(input){
		this.inputs.add(input);

		this.lastReleased.delete(input);
		this.lastPressed.add(input);

		this.clearable = true;
	}

	removeInput(input){
		this.inputs.delete(input);

		this.lastPressed.delete(input);
		this.lastReleased.add(input);

		this.clearable = true;
	}

	clear(){
		if(this.clearable){
			this.lastPressed.clear();
			this.lastReleased.clear();
			this.clearable = false;
		}
	}

	////////////
	// USABLE //
	////////////

	holds(input){
		return this.inputs.has(input);
	}

	justPressed(input){
		return this.lastPressed.has(input);
	}

	justReleased(input){
		return this.lastReleased.has(input);
	}

}