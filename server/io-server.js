import { Server } from "socket.io";
import { createUser, deleteUser, getRandomName, s2u } from "./state.js";
import { server } from "./app.js";
import CorsairsServer from "../corsairs/CorsairsServer.js";

// IO stuff
const io = new Server(server);

io.sockets.on('connection', socket => {
	console.log(`${socket.id} connected!`);

	const user = createUser(socket, getRandomName());
	io.to(socket.id).emit("socket-id", {id: socket.id, name: user.name, avatar: user.avatar});

	// Clean up when a user disconnects
	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected!`);
		deleteUser(s2u(socket.id));
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
	socket.on("corsairs-keydown", key => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		player?.addInput(key);
	});
	
	socket.on("corsairs-keyup", key => {
		const user = s2u(socket.id);
		const player = user?.session?.players.get(socket.id);

		player?.removeInput(key);
	});
});

export default io;