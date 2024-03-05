import EntityCannonball from "../entities/EntityCannonball.js";
import EntityShip from "../entities/EntityShip.js";
import EntityBadShip from "../entities/EntityBadShip.js";

import GameStatePacket from "../packets/GameStatePacket.js";
import EntitySetPacket from "../packets/EntitySetPacket.js";

export default class CollisionSystem {

	static update(session) {
		// Server handles the collision for multiplayer games
		if(session.multiplayer)
			return;

		for(let [projectileId, projectile] of session.entities.entries()) {
			if(!this.#isProjectile(projectile))
				continue;

			for(let [targetId, target] of session.entities.entries()) {
				if(!this.#isProjectileTarget(projectile, target) || projectile == target || projectile.parentId == targetId)
					continue;

				if(this.#rect2Rect(projectile, target)) {
					// Player ships can't hurt each other
					// TODO: use parent instead of parentId...
					if(target instanceof EntityShip && session.entities.get(projectile.parentId) instanceof EntityShip) {
						continue;
					}

					// Generic hit
					projectile.life--;
					target.life--;

					if(target instanceof EntityShip) {
						// Send updated hp
						session.insertPacket(new EntitySetPacket(target, ["life"]));
						// Change sprite to reflect ship's damage
						if(target.life === 1 || target.life === 2) {
							for(const [playerId, player] of session.players.entries()) {
								if(target === player.entity) 
									session.setEntitySpriteForPlayer(target, `ship${target.life}`, playerId);
								else
									session.setEntitySpriteForPlayer(target, `allyShip${target.life}`, playerId);
							}
						}


						// Kamikaze bonus!
						if(projectile instanceof EntityBadShip){
							session.score++;	
						}

						// End the game if no players remain
						if(target.life <= 0) {
							if(--session.alivePlayers == 0) {
								session.end();
							}
						}

					}

					if(target instanceof EntityBadShip) {
						let parent = session.entities.get(projectile.parentId);
						if(parent instanceof EntityShip) {
							session.score++;
						}	
					}

					session.insertPacket(new GameStatePacket(session, ["score"]));
					if(session.gameOver) {
						session.insertPacket(new GameStatePacket(session, ["gameOver"]));
					}

					break;
				}
			}
		}

	}

	static #isValid(entity) {
		return entity.life > 0;
	}

	static #isProjectile(entity) {
		return (entity instanceof EntityCannonball || entity instanceof EntityBadShip) && this.#isValid(entity);
	}

	static #isProjectileTarget(projectile, target) {
		const ram = projectile instanceof EntityBadShip && target instanceof EntityShip;
		return (ram || target instanceof EntityShip || target instanceof EntityBadShip) && this.#isValid(target);
	}

	static #rect2Rect(entity1, entity2) {
		let rect1 = entity1.collider, rect2 = entity2.collider;
		if(!rect1 || !rect2)
			return false;

		let x1 = entity1.pos.x + entity1.collider.x, y1 = entity1.pos.y + entity1.collider.y;
		let x2 = entity2.pos.x + entity2.collider.x, y2 = entity2.pos.y + entity2.collider.y;
		return Math.abs(x2 - x1) <= rect1.w + rect2.w && Math.abs(y2 - y1) <= rect1.h + rect2.h;
	}

}