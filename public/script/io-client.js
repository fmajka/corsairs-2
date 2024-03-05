import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";

const URL = "http://localhost:2137";
//const URL = `http://${host}:3000`;
export const socket = io(URL);

socket.on("connect", () => {
	console.log("Connected!");
});

socket.on("disconnect", () => {
	console.log("Disconnected!");
});

socket.on("socketid", ({id, name}) => {
	console.log(id);

	document.getElementById("player-name").innerHTML = name;
	document.getElementById("player-avatar").style.backgroundImage = `url('avatars/Corsair.jpg')`;

	fetch("/socketid", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
		body: JSON.stringify({id})
  });
});

socket.on("crew-change", ({id}) => {
	const event = new CustomEvent("crew-change");

	// Update tavern list's target attribute
	const el = document.querySelector(".tavern-list");
	if(el) {
		el.setAttribute("hx-target", `#crew-${id}`);
		el.setAttribute("hx-vals", `{"type": "tavern", "crewId": ${id}}`);
	}
	
	console.log("gonna dispatch the event", event)
	document.body.dispatchEvent(event);
})

socket.on("crew-join", ({avatar, name, crewId, slotId}) => {
	let el = document.querySelector(`.tavern-list > #crew-${crewId}`);
	// Crew list update
	if(el) {
		if(el = el.querySelectorAll(".avatars > .avatar")[slotId]) {
			el.style.backgroundImage = `url('${avatar}')`;
		}
	}
	// Crew update
	else {
		el = document.querySelector(".crew-lobby");
		if(el && el.dataset.crewId == crewId) {
			if(el = el.querySelectorAll(".player-list > .list-element")[slotId]) {
				el.querySelector(".avatar").style.backgroundImage = `url('${avatar}')`;
				el.querySelector(".name").innerHTML = name;
			}
		}
	}
});

socket.on("crew-leave", ({crewId, slotId}) => {
	let el = document.querySelector(`.tavern-list > #crew-${crewId}`);
	// Crew list update
	if(el) {
		if(el = el.querySelectorAll(".avatars > .avatar")[slotId]) {
			el.style.backgroundImage = '';
		}
	}
	// Crew update
	else {
		el = document.querySelector(".crew-lobby");
		if(el && el.dataset.crewId == crewId) {
			if(el = el.querySelectorAll(".player-list > .list-element")[slotId]) {
				el.querySelector(".avatar").style.backgroundImage = '';
				el.querySelector(".name").innerHTML = "Puste";
			}
		}
	}
});