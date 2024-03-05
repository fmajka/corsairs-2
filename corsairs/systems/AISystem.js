import GameMath from "../GameMath.js";
import EntityShip from "../entities/EntityShip.js";
import EntityBadShip from "../entities/EntityBadShip.js";
import GameStatePacket from "../packets/GameStatePacket.js";

export default class AISystem {
	
	static update(session, dt) {
		session.spawnTimer += dt;

		// Spawn new badShips
		if(session.spawnTimer >= session.SPAWN_INTERVAL) {
			session.spawnTimer -= session.SPAWN_INTERVAL;

			// Create new BadShip
			let spawnX = Math.random() * session.width;
			let badShip = new EntityBadShip(spawnX, 0);
			badShip.vel.y = badShip.speed;
			session.entityAdd(badShip, ["vel"]);

			// Make things harder...
			session.speed += 0.01;
			session.insertPacket(new GameStatePacket(session, ["speed"]));
		}

		// Update badShips' aim
		for(let [entityId, entity] of session.entities.entries()) {
			if(!(entity instanceof EntityBadShip))
				continue;

			let nearestDistance = 99999;
			let nearestTarget = null;

			// Look for targets
			for(let [targetId, target] of session.entities.entries()) {
				if(!(target instanceof EntityShip))
					continue;

				// Check distance
				let targetDistance = GameMath.getDistance(entity.pos, target.pos);
				if(targetDistance < nearestDistance) {
					nearestDistance = targetDistance;
					nearestTarget = target;
				}
			}

			if(!nearestTarget)
				continue;

			// Apply target
			entity.currentTarget = nearestTarget.id;
			session.entityCast(entity, 'badCannon');

			// Change sprite to face target
			if(!session.serverSide) {
				let numAngles = 8;
				let baseAngle = Math.PI / numAngles;
				// TODO: jakis glupi wyjatek bo kat jest odwrocony nie wiem dlaczego
				let angle = 2* Math.PI - GameMath.getProperAngle(entity.pos, nearestTarget.pos);
				let spriteIndex = Math.floor(baseAngle + (numAngles * angle) / (2 * Math.PI)) % numAngles;
				// TEMP
				session.setEntitySprite(entity, `badShip${1+spriteIndex}`);
			}
		}
		        
	}

}