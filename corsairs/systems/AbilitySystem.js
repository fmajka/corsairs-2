import GameMath from "../GameMath.js";
import EntityCannonball from "../entities/EntityCannonball.js";

export default class AbilitySystem {
	
	static update(session, dt) {
		
		for(let [casterId, caster] of session.entities.entries()) {

			// Loop through all abilities of the caster
			for(let [abilityId, abilityInstance] of caster.spellbook.entries()) {
				if(abilityId != caster.abilityCast)
					abilityInstance.cooldown -= dt;
			}

			// Now casting - process
			if(caster.isCasting) {
				let abilityId = caster.abilityCast;
				let abilityCast = session.abilities.get(abilityId);
				let abilityInstance = caster.spellbook.get(abilityId);

				caster.abilityTime += dt;

				if(!caster.abilityStarted) {
					caster.abilityStarted = true;
					this.#startAbility(session, abilityId, casterId);
				}
				if(caster.abilityTime >= abilityCast.castPoint && !caster.abilityFired) {
					caster.abilityFired = true;
					abilityInstance.cooldown = abilityCast.cooldown;
					this.#castAbility(session, abilityId, casterId);
				}
				if(caster.abilityTime >= abilityCast.castDuration) {
					caster.abilityTime = 0;
					caster.abilityCast = null;
					caster.isCasting = caster.abilityStarted = caster.abilityFired = false;
					this.#finishAbility(session, abilityId, casterId);
				}
			}

		}
		        
	}

	static #startAbility(session, abilityId, casterId) {}

	static #castAbility(session, abilityId, casterId) {
		let caster = session.entities.get(casterId);

		switch(abilityId) {
		// Player ship's ability to fire cannons
		case 'cannons':
			for(let i = 0; i < 2; i++) {
				let cannonball = new EntityCannonball(caster.pos.x, caster.pos.y);
				let angle = caster.angle - Math.PI / 2 + (i*Math.PI);
				this.#entityLaunchProjectile(caster, cannonball, angle);
				// Has to be at the end so the data sent to the client is up-to-date
				session.entityAdd(cannonball, ["angle", "vel", "parentId"]);
			}
			break;
		// Enemy ships firing at the player
		case 'badCannon':
			let target = session.entities.get(caster.currentTarget);
			if(!target)
				return;
			let cannonball = new EntityCannonball(caster.pos.x, caster.pos.y);
			let angle = GameMath.getAngle(caster.pos, target.pos);
			this.#entityLaunchProjectile(caster, cannonball, angle);
			session.entityAdd(cannonball, ["angle", "vel", "parentId"]);
			//cannonball.sprite = Corsairs.sprites.get("badCannonball");
			session.setEntitySprite(cannonball, "badCannonball");
			break;
		}
	}
	static #entityLaunchProjectile(entity, projectile, angle) {
		projectile.vel.x = Math.cos(angle) * projectile.speed;
		projectile.vel.y = Math.sin(angle) * projectile.speed;
		projectile.parentId = entity.id;
	}

	static #finishAbility(session, abilityId, casterId) {}

}