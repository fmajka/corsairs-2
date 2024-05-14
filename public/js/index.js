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
		lastKey: "",
		lastOrder: 1,
		get() {
			Alpine.store("emit")("onStats");
			console.log("Getting stats...");
		},
		sort(key) {
			const isNumber = typeof this.data[0]?.[key] === "number";
			const order = key === this.lastKey ? (-1 * this.lastOrder) : 1;
			if(isNumber) {
				this.data.sort((a,b) => order * (b[key] - a[key]));
			} 
			else {
				this.data.sort((a,b) => order * (a[key] > b[key] ? 1 : -1));
			}
			this.lastKey = key;
			this.lastOrder = order;
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
				Alpine.store("stats").get();
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
