export default class User {
	constructor(socket, name) {
		this.avatar = "avatars/Corsair.jpg";
		this.crew = null;
		this.name = name;
		this.socket = socket;

		// When a CorsairsSessionServer is going, this is set
		this.session = null;
		// Firebase user ID
		this.uid = null;
	}
}