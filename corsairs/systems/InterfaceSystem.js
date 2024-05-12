import Corsairs from "../Corsairs.js";
import InputManager from "../managers/InputManager.js";
import TouchManager from "../managers/TouchManager.js";
import Input from "../enums/Input.js"
import ControllerType from "../enums/ControllerType.js";

// TODO: rename to InputSystem (client-side only reminder)
export default class InterfaceSystem {

	static update(session) {

		// Leave the game
		if(InputManager.justPressed(Input.Key.ESCAPE)) {
			Corsairs.leave()
		}

		// Restart the game
		if(session.gameOver && InputManager.justPressed(Input.Key.R)) {
				// This method's behaviour varies based on session.multiplayer, it's cool
				Corsairs.start();
		}

		// TODO: mouse changes
		// TODO: make local player controller's mousePos point to InputManager controller's mousePos
		if(InputManager.mouseMoved) {
				// Update local players' mouse positions
				for(let [playerId, player] of session.players.entries()) {
					player.mousePos.x = InputManager.controller.mousePos.x;
					player.mousePos.y = InputManager.controller.mousePos.y;
				}
				// Send updates to the server if online
				if(Corsairs.session.multiplayer) {
					Corsairs.socket.emit("mouseMoved", InputManager.controller.mousePos);
				}

				InputManager.mouseMoved = false;
		}

		// EXPERIMENTAL: touch response
		if(TouchManager.touchStarted) {
			// Set new touch positions
			for(const player of session.players.values()) {
				player.touchPos.x = player.touchOrigin.x = TouchManager.touchOrigin.x;
				player.touchPos.y = player.touchOrigin.y = TouchManager.touchOrigin.y;
				player.everTouched = player.touching = true;
			}
			if(Corsairs.session.multiplayer) {
				Corsairs.socket.emit("corsairs-touchstart", TouchManager.touchOrigin);
			}
			TouchManager.touchStarted = false;
		}

		if(TouchManager.touchMoved) {
			// Update local players' touch positions
			for(const player of session.players.values()) {
				player.touchPos.x = TouchManager.touchPos.x;
				player.touchPos.y = TouchManager.touchPos.y;
			}
			if(Corsairs.session.multiplayer) {
				Corsairs.socket.emit("corsairs-touchmove", TouchManager.touchPos);
			}
			TouchManager.touchMoved = false;
		}

		if(TouchManager.touchEnded) {
			// Reset local players' touch positions
			for(const player of session.players.values()) {
				player.touching = false;
			}
			if(Corsairs.session.multiplayer) {
				Corsairs.socket.emit("corsairs-touchend", {});
			}
			TouchManager.touchEnded = false;
		}


		// Keyboards inputs & mouse clicks
		const inputs = InputManager.inputs;

		// Skip if no input was given last frame
		if(inputs.size == 0) {
				return;
		}

		// Loop through keypress changes
		for(const [key, change] of inputs.entries()) {
			// Loops through players to check if any control key was pressed / released
			for(const [playerId, player] of session.players.entries()) {
				if(!player.entity)
						continue;

				// Loops through player controls...
				for(const action in player.controls) {
					const correspondingKey = player.controls[action];

					// Check if key corresponding to any actions was pressed / released
					if(key == correspondingKey) {
						if(change == "pressed") {
							player.addInput(action);
							if(Corsairs.session.multiplayer) {
								Corsairs.socket.emit("corsairs-keydown", action);
							}
						}
						else {
							player.removeInput(action);
							if(Corsairs.session.multiplayer) {
								Corsairs.socket.emit("corsairs-keyup", action);
							}
						}  
					}

				}
			}
		}

	}

}