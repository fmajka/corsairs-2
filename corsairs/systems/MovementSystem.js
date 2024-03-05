import EntityShip from "../entities/EntityShip.js";

export default class MovementSystem {

	static update(session, dt) {
		
		for(let [id, entity] of session.entities.entries()) {
			entity.pos.x += entity.vel.x * dt;
			entity.pos.y += entity.vel.y * dt;

			// Delete non-ships leaving the area
			if(!(entity instanceof EntityShip)) {
				if(entity.pos.x < 0 || entity.pos.x > session.width || entity.pos.y < 0 || entity.pos.y > session.height) {
					entity.life = 0;
					continue;
				}
			}

			// Horizontal wrap - snap to another edge
			if(entity.pos.x > session.width)
				entity.pos.x -= session.width;
			if(entity.pos.x < 0)
				entity.pos.x += session.width;
			// Stop unit when trying to leave vertically
			if(entity.pos.y > session.height)
				entity.pos.y = session.height;
			if(entity.pos.y < 0)
				entity.pos.y = 0;
		}
		        
	}

}