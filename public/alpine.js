import { socket } from "./io-client.js";

document.addEventListener("alpine:init", () => {
	console.log("Alpine is ready!");

	Alpine.store("router", {
		view: "main-menu",

		is(view) {
			return this.view == view;
		},

		setView(view) {
			this.view = view;
		},
	});

	Alpine.store("user", {
		avatar: "",
		crew: null,
		name: "No name",
	});

	// crewmate: { avatar: String, name: String }
	Alpine.store("crews", []);

	// Emitting socket messages, always prefixed with 'client:'
	Alpine.store("emit", (msg, data) => socket.emit(`client:${msg}`, data));

	// Interactions with corsairs backend
	Alpine.store("corsairs", {
		onCrewButton() {
			// TODO: only when request succeeds
			//Alpine.store("router").setView('lobby-crew')
			// TODO: new paradigm?
			socket.emit("client:onCrewButton");
		},
		onCrewAdd() {
			socket.emit("client:onCrewAdd");
		},
	});
})