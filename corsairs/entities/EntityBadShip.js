import Collider from "../components/Collider.js";
import Entity from "./Entity.js";

export default class EntityBadShip extends Entity {

	constructor(x = 0, y = 0) {
		super(x, y);

		this.spritePath = "badShip7";

		this.speed = 256;
		this.collider = new Collider(0, 0, 24, 24);
		this.addAbility('badCannon');
		// Initial cooldown
		this.spellbook.get('badCannon').cooldown = 0.5;
	}

}