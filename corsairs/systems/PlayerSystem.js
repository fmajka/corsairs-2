import GameMath from "../GameMath.js";
import EntitySetPacket from "../packets/EntitySetPacket.js";

export default class PlayerSystem {

	// TODO: seperate globally accessible enum?
	static ControllerType = {
		none: 0,
		keyboard: 1,
		mouse: 2
	}
	
	static update(session, dt) {

		const sqrt2by2 = Math.sqrt(2) / 2;

		// Loop through all controllers
		for(const [playerId, player] of session.players.entries()) {
			if(!player.entity)
				continue;

			// For the server each player stores their inputs
			// For the clients inputs are tracked by the InputManager

			const controller = player;

			
			// Abilities
			if(controller.holds("attack")) {
				session.entityCast(player.entity, "cannons");
			}

			// Movement
			const speed = player.entity.speed;
			let x = 0, y = 0;

			// EXPERIMENTAL: screentouch (mobile gaming)
			if(player.everTouched) {

				if(player.touching) {
					const angle = GameMath.getAngle(player.touchOrigin, player.touchPos);
					const distance = GameMath.getDistance(player.touchOrigin, player.touchPos);
					// TODO: change the divisor to some constant
					const currentSpeed = speed * Math.min(1, distance / 32);
					// Change speed & angle
					player.entity.angle = angle;
					player.entity.vel.x = Math.cos(angle) * currentSpeed; 
					player.entity.vel.y = Math.sin(angle) * currentSpeed;
					session.insertPacket(new EntitySetPacket(player.entity, ["pos", "angle", "vel"]));
				}
				else if(player.entity.vel.x != player.entity.vel.y != 0) {
					player.entity.vel.x = player.entity.vel.y = 0;
					session.insertPacket(new EntitySetPacket(player.entity, ["vel"]));
				}

				continue;
			}

			// Movement controls are checked differently based on controller type
			switch(player.typeId) {

				// Keyboard controls
				case this.ControllerType.keyboard:

					if(controller.holds("up") && !controller.holds("down"))
						y = -1;
					else if(controller.holds("down") && !controller.holds("up"))
						y = 1;
					if(controller.holds("left") && !controller.holds("right"))
						x = -1;
					else if(controller.holds("right") && !controller.holds("left"))
						x = 1;
		
					if(x != 0 && y != 0) {
						x *= sqrt2by2;
						y *= sqrt2by2;
					}
		
					if(x != 0 || y != 0) {
						let lastAngle = player.entity.angle;
						let angle = Math.atan2(y, x);
		
						if(lastAngle != angle) {
							player.entity.angle = angle;
							// Directly update player's position when their ship changes angle to avoid long-term desyncs
							session.insertPacket(new EntitySetPacket(player.entity, ["pos", "angle"]));
						}
					}
		
					if(player.entity.vel.x != x * speed || player.entity.vel.y != y * speed) {
						// TODO: change values instead of assigning a new object
						player.entity.vel.x = x * speed; 
						player.entity.vel.y = y * speed;
						session.insertPacket(new EntitySetPacket(player.entity, ["vel"]));
					}
		
					break;

				// Mouse control
				case this.ControllerType.mouse:

					// Don't move if too close (otherwise movement is laggy)
					if(GameMath.getDistance(player.entity.pos, controller.mousePos) <= speed * dt) {
						if(player.entity.vel.x != player.entity.vel.y != 0) {
							player.entity.vel.x = player.entity.vel.y = 0;
							session.insertPacket(new EntitySetPacket(player.entity, ["vel"]));
						}
					}
					// Set velocity towards target location
					else {
						const angle = GameMath.getAngle(player.entity.pos, controller.mousePos);
						if(angle != player.entity.angle) {
							player.entity.angle = angle;
							player.entity.vel.x = Math.cos(angle) * speed; 
							player.entity.vel.y = Math.sin(angle) * speed;
							session.insertPacket(new EntitySetPacket(player.entity, ["pos", "angle", "vel"]));
						}
					}

					break;

				default:
			}

		}
	}

	// Clears the lastPressed & lastReleased keys
	static clear(session) {
		// Clear all the players' inputs
		if(session.serverSide) {
			for(const [playerId, player] of session.players.entries()) {
				player.clear();
			}
		}
		// Clear the InputManager for the client
		else {
			InputManager.clear();
		}
	}

}