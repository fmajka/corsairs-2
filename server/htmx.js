import express from "express";
import { crews, getCrewById, userCreateCrew, userLeaveCrew, c2u } from "./state.js";

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
	const user = c2u(req.headers.cookie);
	const crew = user.crew;

	if(crew && crew.slotsMax < 5) {
		crew.slotsMax++;
		res.render('includes/crew-member', { user: null });
		user.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.end();
	}
});

router.post("/crew-join", (req, res) => {
	const user = c2u(req.headers.cookie);
	const crewId = req.body.crewId;

	const crew = getCrewById(crewId);
	if(!crew) { res.end(); return; }
	const slot = crew.count();

	// If doesn't belong to this crew and slot is free - join!
	if(!crew.mates.includes(user) && slot < crew.slotsMax) {
		// TODO: if in a different crew, warn before join
		if(user.crew) {
			userLeaveCrew(user);
			user.socket.broadcast.emit("crew-change", { id: user.crew.id });
		}
		user.crew = crew;
		crew.mates[slot] = user;
		res.render('includes/crew-lobby', { crew });

		// Update other users' UI
		user.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.render('includes/tavern-list', { user, crews });
	}
});

router.get("/crew-leave", (req, res) => {
	const user = c2u(req.headers.cookie);
	const crew = user.crew;

	userLeaveCrew(user);
	res.render('includes/tavern-list', { user, crews });

	// Update other users' UI
	user.socket.broadcast.emit("crew-change", { id: crew.id }); 
});

router.get("/tavern-list", (req, res) => {
	const user = c2u(req.headers.cookie);

	res.render('includes/tavern-list', { user, crews });
});

router.get("/crew-lobby", (req, res) => {
	const user = c2u(req.headers.cookie);

	if(!user.crew) {
		userCreateCrew(user);
		
		// Update other users' UI
		user.socket.broadcast.emit("crew-change", { id: user.crew.id }); 
	}
	res.render('includes/crew-lobby', { crew: user.crew });
});

router.get("/training-lobby", (req, res) => {
	const user = c2u(req.headers.cookie);
	res.render('includes/training-lobby', { user });
});

export default router;