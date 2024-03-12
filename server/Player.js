export default class Player {
	constructor(socket, name) {
		this.avatar = "avatars/Corsair.jpg";
		this.crew = null;
		this.name = name;
		this.socket = socket;

		// When a CorsairsSessionServer is going, this is set
		this.session = null;
	}
}