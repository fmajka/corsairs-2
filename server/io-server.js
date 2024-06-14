
import { createUser, crews, deleteUser, getCrewById, getRandomName, s2u, userCreateCrew, userLeaveCrew, emitCrewChange, emitUserChange, emitViewToSocket, getStats } from "./state.js";
import { io } from "./app.js";
import CorsairsServer from "../corsairs/CorsairsServer.js";
import { auth } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { refStats } from "./firebase-admin.js";

// IO stuff
io.sockets.on('connection', (socket) => {
	console.log(`${socket.id} connected!`);

	const user = createUser(socket, getRandomName());
	io.to(socket.id).emit("init", {
		name: user.name, 
		avatar: user.avatar
	});
	for(const crew of crews) {
		emitCrewChange(crew, socket.id);
	}

	// Clean up when a user disconnects
	socket.on("disconnect", _ => {
		console.log(`${socket.id} disconnected!`);
		deleteUser(s2u(socket.id));
	});

	////////////
	// Client //
	////////////

	socket.on("client:onCrewButton", _ => {
		const user = s2u(socket.id);
		if(!user.crew) {
			const crew = userCreateCrew(user);
			emitCrewChange(crew);
		}
		emitViewToSocket("lobby-crew", socket);
	});

	socket.on("client:onCrewAdd", _ => {
		const user = s2u(socket.id);
		const crew = user?.crew;
	
		if(crew && crew.slotsMax < 5) {
			crew.slotsMax++;
			emitCrewChange(crew);
		}
	});

	socket.on("client:onCrewJoin", (crewId) => {
		const user = s2u(socket.id);
		const crew = getCrewById(crewId);
		if(!crew) { return; }

		const slot = crew.count();
		// If doesn't belong to this crew and slot is free - join!
		if(!crew.mates.includes(user) && slot < crew.slotsMax) {
			// TODO: if in a different crew, warn before join
			if(user.crew) {
				const prevCrew = user.crew; 
				userLeaveCrew(user);
				emitCrewChange(prevCrew);
			}
			user.crew = crew;
			crew.mates[slot] = user;
			emitCrewChange(crew);
			emitViewToSocket("lobby-crew", socket);
		}
	});

	socket.on("client:onCrewLeave", _ => {
		const user = s2u(socket.id);
		const crew = user?.crew;

		if(crew) {
			userLeaveCrew(user);
			emitCrewChange(crew);
		}
		emitViewToSocket("tavern", socket);
	});

	socket.on("client:onUserSubmit", ({type, email, nick, password, repassword}) => {
		const user = s2u(socket.id);
		console.log("io-server @onUserSubmit:", email, password);

		if(type === "register") {
			if(password !== repassword) {
				console.log(`Passwords didn't match for ${email}!`);
				return;
			}
			createUserWithEmailAndPassword(auth, email, password)
			.then((cred) => {
				// Set name to email's first part
				const displayName = nick || email.split("@")[0];
				updateProfile(cred.user, { displayName });
		
				// Insert player stats document to firestore
				refStats.doc(cred.user.uid).set({
					score: 0,
					highscore: 0,
					name: displayName,
				});
		
				console.log("User created:", email, displayName);
				user.name = displayName;
				user.uid = cred.user.uid;
				emitUserChange(user);
			})
			.catch((err) => { console.log(err.message); });
		}
		else if(type === "login") {
			signInWithEmailAndPassword(auth, email, password)
			.then((cred) => {
				console.log("Verified:", email);
				// TODO: maybe fetch it from database instead?
				user.name = cred.user.displayName;
				user.uid = cred.user.uid;
				emitUserChange(user);
			})
			.catch((err) => { console.log(err.message); });
		}
		else {
			console.log("Unknown submit type:", type);
		}

	});

	socket.on("client:onUserLogout", _ => {
		const user = s2u(socket.id);
		user.name = getRandomName();
		user.uid = null;
		emitUserChange(user);
	});

	socket.on("client:onStats", async () => {
		const stats = (await getStats()).sort((a, b) => b.highscore - a.highscore);
		console.log(stats);
		io.to(socket.id).emit("stats-change", stats);
	})

	//////////////
	// Corsairs //
	//////////////

	// Start a Corsairs game session on the server for the client
	socket.on("corsairs-start", ({ gameType }) => {
		const user = s2u(socket.id);
		const crew = user?.crew;

		if(!user || !crew) {
			console.log("io/corsairs-start: ", !!user, !!crew);
			return;
		}

		// Return and send notification if someone else than the party owner tries to start the game
		if(user !== crew.captain) {
			// TODO: chat system, notifyCrew
			return;
			//return ChatHandler.notifyById("error", `Tylko kapitan załogi może rozpocząć grę`, socket.id);
		}

		// Send info to all the party members
		for(const crewmate of crew.mates) {
				// TODO: maybe users should first respond if they are ready?
				io.to(crewmate.socket.id).emit("corsairs-run", {gameType});
		}

		CorsairsServer.createSession(socket.id, {gameType});
	});

	// Client presses escape - end client's session
	socket.on("corsairs-leave", _ => {
			CorsairsServer.endSession(socket.id);
	});

	// Process keyDown event & add the input to the player object
	// PlayerSystem will process the inputs for the player in the session
	socket.on("corsairs-keydown", (key) => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		player?.addInput(key);
	});
	
	socket.on("corsairs-keyup", (key) => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		player?.removeInput(key);
	});

	// EXPERIMENTAL: mobile gaming
	socket.on("corsairs-touchstart", (touchPos) => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		if(player) {
			player.touchPos.x = player.touchOrigin.x = touchPos.x;
			player.touchPos.y = player.touchOrigin.y = touchPos.y;
			player.everTouched = player.touching = true;
		}
	});

	socket.on("corsairs-touchmove", (touchPos) => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		if(player) {
			player.touchPos.x = touchPos.x;
			player.touchPos.y = touchPos.y;
		}
	});
	
	socket.on("corsairs-touchend", _ => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		if(player) {
			player.touching = false;
		}
	});
});

export default io;