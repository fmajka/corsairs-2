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

socket.on("socket-id", ({id, name}) => {
	console.log(id);

	document.getElementById("player-name").innerHTML = name;
	document.getElementById("player-avatar").style.backgroundImage = `url('avatars/Corsair.jpg')`;

	fetch("/socket-id", {
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
	console.log(el)
	if(el) {
		const crewId = `#crew-${id}`;
		const target = el.querySelector(crewId);

		if(target) {
			el.setAttribute("hx-target", crewId);
			el.setAttribute("hx-swap", "outerHTML");
		}
		else {
			el.setAttribute("hx-target", "this");
			el.setAttribute("hx-swap", "beforeend");
		}
		el.setAttribute("hx-vals", `{"type": "tavern", "crewId": ${id}}`);
	}
	
	console.log("gonna dispatch the event", event)
	document.body.dispatchEvent(event);
})