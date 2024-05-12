

import { socket } from "./io-client.js";

// Functions
window.processHotkey = (key) => {
	key = key.toLowerCase();

	for(const button of Alpine.store("buttons")) {
		if(Corsairs.session.running) { return; }

		if(key === "escape" && button.checkVisibility() && button.classList.contains("bg-grey")) {
			return button.click();
		}
		else if(button.checkVisibility() && key === button.innerText[0]?.toLowerCase()) {
			return button.click();
		}
	}
}

// Alpine
document.addEventListener("alpine:init", () => {
	Alpine.store("buttons", document.querySelectorAll("button"));

	Alpine.store("form", {
		type: null,
		label: "",
		email: "",
		password: "",
		setType(type) {
			this.type = type;
			this.label = type ? type[0].toUpperCase() : "";
			if(!type) { this.email = this.password = ""; }
		},
		submit() {
			Alpine.store("emit")("onUserSubmit", {
				type: this.type, 
				email: this.email, 
				password: this.password
			});
		},
		submit2(formData) {
			const data = Object.fromEntries(formData.entries());
			data.type = this.type;
			Alpine.store("emit")("onUserSubmit", data);
		},
	});
	
	Alpine.store("router", {
		view: "main-menu",
		is(view) { return this.view == view; },
		setView(view) { this.view = view; },
	});

	Alpine.store("user", {
		auth: false,
		avatar: "",
		crew: null,
		name: "No name",
	});

	// crewmate: { avatar: String, name: String }
	Alpine.store("crews", []);

	// Emitting socket messages, always prefixed with 'client:'
	Alpine.store("emit", (msg, data) => socket.emit(`client:${msg}`, data));
});
