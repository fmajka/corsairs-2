


import { socket } from "./io-client.js";

// Functions
(function() {
	const buttons = document.querySelectorAll("button");
	window.processHotkey = (key) => {
		key = key.toLowerCase();
	
		for(const button of buttons) {
			if(Corsairs.session.running) { return; }
	
			if(key === "escape" && button.checkVisibility() && button.classList.contains("bg-grey")) {
				return button.click();
			}
			else if(button.checkVisibility() && key === button.innerText[0]?.toLowerCase()) {
				return button.click();
			}
		}
	}
})();

// Alpine
document.addEventListener("alpine:init", () => {

	// TODO: no need, just emit onclick
	Alpine.store("stats", {
		data: [],
		getStats() {
			Alpine.store("emit")("onStats");
		}
	});

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
		onkeydown(event) {
			if(event.key === "Escape") {
				this.form.setType(null);
			}  
			event.stopPropagation();
		}
	});
	
	Alpine.store("router", {
		view: "main-menu",
		is(view) { return this.view == view; },
		setView(view) { 
			this.view = view;
			// Exceptions:
			if(view === "ranking") {
				Alpine.store("emit")("onStats");
			}
		},
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
