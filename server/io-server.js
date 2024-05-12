import { Server } from "socket.io";
import { createUser, crews, deleteUser, getCrewById, getRandomName, s2u, userCreateCrew, userLeaveCrew } from "./state.js";
import { server } from "./app.js";
import CorsairsServer from "../corsairs/CorsairsServer.js";

// IO stuff
const io = new Server(server);

function emitCrewChange(crew, target = null) {
	const crewData = { id: crew.id, crew: crew.serialize() };
	if(target) { 
		io.to(target).emit("crew-change", crewData); 
	}
	else {
		io.emit("crew-change", crewData); 
	}
}

function emitViewToSocket(view, socket) {
	io.to(socket.id).emit("view-change", view);
}

io.sockets.on('connection', (socket) => {
	console.log(`${socket.id} connected!`);

	const user = createUser(socket, getRandomName());
	io.to(socket.id).emit("socket-id", {
		id: socket.id, 
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