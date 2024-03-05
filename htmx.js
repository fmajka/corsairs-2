import express from "express";
import { crews, getCrewById, playerCreateCrew, playerLeaveCrew, c2p } from "./server/State.js";
import io from "./io-server.js";

const router = express.Router();

router.get("/main-menu", (_, res) => {
	res.render('partials/main-menu');
});

router.post("/crew-change", (req, res) => {
	const type = req.body.type;
	const crewId = req.body.crewId;
	const crew = getCrewById(crewId);

	if(type === "crew") {
		res.render("partials/crew-list", {crew});
	}
	else if(type === "tavern") {
		res.render("partials/tavern-member", {crew});
	}
	else {
		res.end();
	}
})
//

router.get("/crew-add", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crew = player.crew;

	if(crew && crew.slotsMax < 5) {
		crew.slotsMax++;
		res.render('partials/crew-member', { player: null });
		player.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.end();
	}
});

router.post("/crew-join", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crewId = req.body.crewId;
	const slotId = req.body.slotId;

	const crew = getCrewById(crewId);
	if(!crew) { res.end(); return; }

	// If doesn't belong to this crew and slot is free - join!
	if(!crew.players.includes(player) && !crew.players[slotId]) {
		// TODO: if in a different crew, warn before join
		if(player.crew) {
			playerLeaveCrew(player);
		}
		player.crew = crew;
		crew.players[slotId] = player;
		res.render('partials/crew-lobby', { crew });

		// Update other players' UI
		player.socket.broadcast.emit("crew-join", {avatar: player.avatar, name: player.name, crewId: crew.id, slotId});
	}
	else {
		res.render('partials/tavern-list', { crew: player?.crew, crews });
	}
});

router.get("/crew-leave", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crew = player.crew;
	const slotId = crew.players.indexOf(player);

	playerLeaveCrew(player);
	res.render('partials/tavern-list', { crews });

	// Update other players' UI
	player.socket.broadcast.emit("crew-leave", {crewId: crew.id, slotId});
});

router.get("/tavern-list", (req, res) => {
	const player = c2p(req.headers.cookie);

	res.render('partials/tavern-list', { crew: player?.crew, crews });
});

router.get("/crew-lobby", (req, res) => {
	const player = c2p(req.headers.cookie);

	if(!player.crew) {
		playerCreateCrew(player);
	}
	res.render('partials/crew-lobby', { crew: player.crew });
});

export default router;