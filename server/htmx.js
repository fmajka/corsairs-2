import express from "express";
import { crews, getCrewById, userCreateCrew, userLeaveCrew, c2u, getRandomName } from "./state.js";

import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { refStats } from "./firebase-admin.js";

import io from "./io-server.js";

const router = express.Router();

router.get("/main-menu", (_, res) => {
	res.render('main-menu');
});

router.post("/crew-change", (req, res) => {
	const type = req.body.type;
	const crewId = req.body.crewId;
	const crew = getCrewById(crewId);

	if(type === "crew") {
		res.render("includes/lobby-list", {crew});
	}
	else if(type === "tavern") {
		if(!crew) res.send("");
		else res.render("includes/tavern-el", {crew});
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
		res.render('includes/lobby-list-el', { user: null });
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
		res.render('lobby-crew', { crew });

		// Update other users' UI
		user.socket.broadcast.emit("crew-change", { id: crew.id });
	}
	else {
		res.render('tavern', { user, crews });
	}
});

router.get("/crew-leave", (req, res) => {
	const user = c2u(req.headers.cookie);
	const crew = user.crew;

	userLeaveCrew(user);
	res.render('tavern', { user, crews });

	// Update other users' UI
	user.socket.broadcast.emit("crew-change", { id: crew.id }); 
});

router.get("/tavern", (req, res) => {
	const user = c2u(req.headers.cookie);

	res.render('tavern', { user, crews });
});

router.get("/lobby-crew", (req, res) => {
	const user = c2u(req.headers.cookie);

	if(!user.crew) {
		userCreateCrew(user);
		
		// Update other users' UI
		user.socket.broadcast.emit("crew-change", { id: user.crew.id }); 
	}
	res.render('lobby-crew', { crew: user.crew });
});

router.get("/lobby-training", (req, res) => {
	const user = c2u(req.headers.cookie);
	res.render('lobby-training', { user });
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
		io.to(user.socket.id).emit("user-change", { name: user.name });
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
		io.to(user.socket.id).emit("user-change", { name: user.name });
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
	io.to(user.socket.id).emit("user-change", { name: user.name });
	res.render('includes/topbar-profile', { user });
});

export default router;