import express from "express";
import { crews, getCrewById, userCreateCrew, userLeaveCrew, c2u, getRandomName } from "./state.js";

import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { refStats } from "./firebase-admin.js";

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

////////////
// Topbar //
////////////
router.get("/topbar-profile", (req, res) => {
	const user = c2u(req.headers.cookie);
	res.render('includes/topbar-profile', { user });
});

router.get("/topbar-login", (req, res) => {
	res.render('includes/topbar-login');
});

router.post("/topbar-login", (req, res) => {
	console.log("Cookie:", req.headers.cookie)
	const user = c2u(req.headers.cookie);
	const { email, password } = req.body;
	console.log("topbar-login post:", email, password);

	signInWithEmailAndPassword(auth, email, password)
	.then(cred => {
		console.log("Verified", email);
		user.name = cred.user.displayName;
		user.uid = cred.user.uid;
		res.render('includes/topbar-profile', { user });
	})
	.catch(err => {
		console.log(err);
		res.render('includes/topbar-login');
	});
});

router.get("/topbar-register", (req, res) => {
	res.render('includes/topbar-register');
});

router.post("/topbar-register", (req, res) => {
	console.log("Cookie:", req.headers.cookie)
	const user = c2u(req.headers.cookie);
	const { email, password } = req.body;
	console.log("topbar-register post:", email, password);

	createUserWithEmailAndPassword(auth, email, password)
	.then(cred => {
		// Set name to email's first part
		const displayName = email.split("@")[0];
		updateProfile(cred.user, { displayName });

		// Insert player stats document to firestore
		refStats.doc(cred.user.uid).set({
			score: 0,
			highscore: 0,
		});

		console.log("User created", email, displayName);
		user.name = displayName;
		user.uid = cred.user.uid;
		res.render('includes/topbar-profile', { user });
	})
	.catch(err => {
		console.log(err);
		res.render('includes/topbar-register');
	});
});

router.post("/topbar-logout", (req, res) => {
	console.log("Cookie:", req.headers.cookie)
	const user = c2u(req.headers.cookie);
	user.name = getRandomName();
	user.uid = null;
	res.render('includes/topbar-profile', { user });
});

export default router;