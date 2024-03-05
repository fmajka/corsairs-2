import Collider from "../components/Collider.js";
import Entity from "./Entity.js";

export default class EntityCannonball extends Entity {

	constructor(x = 0, y = 0) {
		super(x, y);

		this.spritePath = "cannonball";

		this.speed = 512;
		this.collider = new Collider(0, 0, 10, 10);
	}

}