import Vector from "./Vector.js"

export default class Sprite {

	static directory = "";

	constructor(filePath) {
		this.filePath = Sprite.directory + filePath
		this.image = new Image();

		this.anchor = new Vector(0.5, 0.5);
	}

	init() {
        return new Promise((resolve, reject) => {
            this.image.onload = resolve;
            this.image.src = this.filePath;
        });
    }
}