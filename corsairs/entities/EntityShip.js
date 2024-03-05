import Collider from "../components/Collider.js"
import Entity from "./Entity.js";

export default class EntityShip extends Entity {

	constructor(x = 0, y = 0) {
		super(x, y);

		this.spritePath = "allyShip3";

		this.life = 3;

		this.speed = 320;
		this.collider = new Collider(0, 0, 18, 18);
		this.addAbility('cannons');
	}

}