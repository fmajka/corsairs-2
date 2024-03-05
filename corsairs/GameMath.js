export default class GameMath {

	static clamp(lower, value, upper) {
		return Math.max(lower, Math.min(upper, value));
	}

	static properAngle(angle) {
		return (angle > 0) ? angle : 2 * Math.PI + angle;
	}

	static getDistance(a, b) {
		const x = b.x - a.x, y = b.y - a.y;
		return Math.sqrt(x*x + y*y);
	}

	static getAngle(a, b) {
		const x = b.x - a.x, y = b.y - a.y;
		return Math.atan2(y, x);
	}

	static getProperAngle(a, b) {
		return this.properAngle(this.getAngle(a, b))
	}
}