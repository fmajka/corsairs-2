import Corsairs from "../Corsairs.js";
import InputManager from "./InputManager.js";
import Input from "../enums/Input.js";
import Vector from "../components/Vector.js";
import GameMath from "../GameMath.js";

export default class TouchManager {
	// Info for the InterfaceSystem
	static touchStarted = false;
	static touchMoved = false;
	static touchEnded = false;

	// Remember specific touches to track movement / end
	static movementTouch = null;
	static attackTouch = null;

	// In-game touch positions
	static touchOrigin = new Vector();
	static touchPos = new Vector();

	// Those need client coords (not game coords)
	static joystickOrigin = new Vector();
	static joystickPos = new Vector();

	// Joystick DOM elements
	static joystickBase = null;
	static joystickStick = null;

	static getGameCoords(x, y) {
		const rect = Corsairs.ctxRect;
		const scale = Corsairs.ctxScale;

		const coords = new Vector((x - rect.x) / scale, (y - rect.y) / scale);
		if(Corsairs.ctxRotated) {
			const temp = coords.x;
			coords.x = -coords.y;
			coords.y = temp;
		}

		return coords;
	}

	static updateStickPos(x, y) {
		const rect = this.joystickBase.getBoundingClientRect();
		const xDiff = GameMath.clamp(-rect.width  / 2, x - this.joystickOrigin.x, rect.width  / 2);
		const yDiff = GameMath.clamp(-rect.height / 2, y - this.joystickOrigin.y, rect.height / 2);
		this.joystickStick.style.left = `${xDiff}px`;
		this.joystickStick.style.top  = `${yDiff}px`;
	}
	
	static start(event) {
		const touch = event.changedTouches[0];
		console.log(touch.target)
		// Only register if touches canvas or overlay
		if(touch.target !== Corsairs.overlay && touch.target !== Corsairs.ctx.canvas) { return; }
		// Only register touches on the lower half
		if(touch.clientY < window.innerHeight / 2) { return; }

		const pos = this.getGameCoords(touch.clientX, touch.clientY);

		// Movement
		if(touch.clientX < window.innerWidth / 2) {
			if(this.movementTouch) { return; }
			console.log("move");

			// Reset movement props
			this.movementTouch = touch;
			this.touchOrigin.x = this.touchPos.x = pos.x;
			this.touchOrigin.y = this.touchPos.y = pos.y;
			this.touchStarted = true;

			// Joystick sprite
			const wrapper = Corsairs.wrapper;
			if(!this.joystickBase) {
				const joystickBase = document.createElement("div");
				const joystickStick = document.createElement("div");
				joystickBase.classList.add("joystick");

				// TODO:check if necessary
				//joystickBase.addEventListener('touchstart', event => event.preventDefault());
				//joystickStick.addEventListener('touchstart', event => event.preventDefault());
		
				wrapper.appendChild(joystickBase);
				joystickBase.appendChild(joystickStick);
				this.joystickBase = joystickBase;
				this.joystickStick = joystickStick;
			}

			// Change joystick position
			this.joystickOrigin.x = touch.clientX;
			this.joystickOrigin.y = touch.clientY;
			this.joystickBase.style.left = this.joystickStick.style.left = `${touch.clientX}px`;
			this.joystickBase.style.top  = this.joystickStick.style.top  = `${touch.clientY}px`;

		}
		// Attacking
		else {
			if(this.attackTouch) { return; }
			console.log("atk");
			this.attackTouch = touch;
			InputManager.add(Input.Key.SPACE);
		}
	}

	static move(event) {
		const touch = event.changedTouches[0];
		const pos = this.getGameCoords(touch.clientX, touch.clientY);

		// Movement
		if(this.movementTouch && touch.identifier === this.movementTouch.identifier) {
			// Change direction
			this.touchPos.x = pos.x;
			this.touchPos.y = pos.y;
			this.touchMoved = true;
			// Change joystick stick position
			this.updateStickPos(touch.clientX, touch.clientY);
		}
	}

	static end(event) {
		const touch = event.changedTouches[0];

		// End movement
		if(this.movementTouch && touch.identifier === this.movementTouch.identifier) {
			this.movementTouch = null;
			this.touchPos.x = this.touchOrigin.x;
			this.touchPos.y = this.touchOrigin.y;
			this.touchEnded = true;
			// Return joystick stick position
			this.updateStickPos(this.joystickOrigin.x, this.joystickOrigin.y);
		}
		// End attacking 
		else if(this.attackTouch && touch.identifier === this.attackTouch.identifier) {
			this.attackTouch = null;
			InputManager.remove(Input.Key.SPACE);
		}
	}

}