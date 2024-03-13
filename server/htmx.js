import express from "express";
import { crews, getCrewById, playerCreateCrew, playerLeaveCrew, c2p } from "./state.js";

const router = express.Router();

router.get("/main-menu", (_, res) => {
	res.render('includes/main-menu');
});

router.post("/crew-change", (req, res) => {
	const type = req.body.type;
	const crewId = req.body.crewId;
	const crew = getCrewById(crewId);

	if(type === "crew") {
		res.render("includes/crew-list", {crew});
	}
	else if(type === "tavern") {
		if(!crew) res.send("");
		else res.render("includes/tavern-member", {crew});
	}
	else {
		res.end();
	}
});

router.get("/crew-add", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crew = player.crew;

	if(crew && crew.slotsMax < 5) {
		crew.slotsMax++;
		res.render('includes/crew-member', { player: null });
		player.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.end();
	}
});

router.post("/crew-join", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crewId = req.body.crewId;

	const crew = getCrewById(crewId);
	if(!crew) { res.end(); return; }
	const slot = crew.count();

	// If doesn't belong to this crew and slot is free - join!
	if(!crew.players.includes(player) && slot < crew.slotsMax) {
		// TODO: if in a different crew, warn before join
		if(player.crew) {
			playerLeaveCrew(player);
			player.socket.broadcast.emit("crew-change", { id: player.crew.id });
		}
		player.crew = crew;
		crew.players[slot] = player;
		res.render('includes/crew-lobby', { crew });

		// Update other players' UI
		player.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.render('includes/tavern-list', { player, crews });
	}
});

router.get("/crew-leave", (req, res) => {
	const player = c2p(req.headers.cookie);
	const crew = player.crew;

	playerLeaveCrew(player);
	res.render('includes/tavern-list', { player, crews });

	// Update other players' UI
	player.socket.broadcast.emit("crew-change", { id: crew.id }); 
});

router.get("/tavern-list", (req, res) => {
	const player = c2p(req.headers.cookie);

	res.render('includes/tavern-list', { player, crews });
});

router.get("/crew-lobby", (req, res) => {
	const player = c2p(req.headers.cookie);

	if(!player.crew) {
		playerCreateCrew(player);
		
		// Update other players' UI
		player.socket.broadcast.emit("crew-change", { id: player.crew.id }); 
	}
	res.render('includes/crew-lobby', { crew: player.crew });
});

export default router;