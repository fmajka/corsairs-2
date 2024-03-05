import AbilityInstance from "../components/AbilityInstance.js";
import Vector from "../components/Vector.js";

export default class Entity {

	constructor(x = 0, y = 0) {
		this.id = -1;
		this.pos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.angle = 0;					// Facing angle

		// Subclasses set the spritePath, when the entity is initialized sprite is set from the path
		this.spritePath;
		this.sprite = null;

		this.life = 1;
		this.speed = 0;				// Movement speed
		this.collider = null;
		this.parentId = -1;

		this.currentTarget = null;	// Can be: entityId, vector, number(angle)
		// Ability data
		this.isCasting = false;
		this.abilityCast = null;	// abilityId, points to spellbook and the ability at the same time
		this.abilityTime = 0;
		this.abilityStarted = false;
		this.abilityFired = false;
		// The spellbook
		this.spellbook = new Map();
	}

	addAbility(abilityId) {
		this.spellbook.set(abilityId, new AbilityInstance(abilityId));
	}

}