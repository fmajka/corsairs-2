import Corsairs from "../Corsairs.js";
import Player from "../components/Player.js"
import { socket } from "/script/io-client.js";

export default class InputManager {

	// Kinda works like a decorator
	// TODO: Controller class, Player extends Controller?
	static controller = new Player();

	// Maps keys to state change (pressed, released)
	static inputs = new Map();
	// Informs that mouse position's update is needed (used in InputSystem)
	static mouseMoved = true;

	static add(input) {
		this.inputs.set(input, "pressed");
		this.controller.addInput(input);

		return;

		if(Corsairs.session.multiplayer) {
			socket.emit("keyDown", input);
		}	
	}

	static remove(input) {
		this.inputs.set(input, "released");
		this.controller.removeInput(input);

		return;

		if(Corsairs.session.multiplayer) {
			socket.emit("keyUp", input);	
		}
	}

	static move(event) {
		const mouseX = event.clientX, mouseY = event.clientY;
		this.mouseMoved = true;

		// Set controller's mouse position relative to the game
		const rect = Corsairs.ctxRect;
		const scale = Corsairs.ctxScale;

		this.controller.mousePos.x = (mouseX - rect.x) / scale;
		this.controller.mousePos.y = (mouseY - rect.y) / scale;
	}

	static clear(){
		this.inputs.clear();
		this.controller.clear();
	}

	////////////
	// USABLE //
	////////////

	// TODO: remove, things are now different

	static holds(input){
		return this.controller.holds(input);
	}

	static justPressed(input){
		return this.controller.justPressed(input);
	}

	static justReleased(input){
		return this.controller.justReleased(input);
	}
	
}