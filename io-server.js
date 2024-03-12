import { Server } from "socket.io";
import { createPlayer, deletePlayer, getRandomName, s2p } from "./server/State.js";
import { server } from "./app.js";
import CorsairsServer from "./corsairs/CorsairsServer.js";

// IO stuff
const io = new Server(server);

io.sockets.on('connection', socket => {
	console.log(`${socket.id} connected!`);

	const player = createPlayer(socket, getRandomName());
	io.to(socket.id).emit("socket-id", {id: socket.id, name: player.name, avatar: player.avatar});

	// Clean up when a user disconnects
	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected!`);
		deletePlayer(s2p(socket.id));
	});

	// Start a Corsairs game session on the server for the client
	socket.on("corsairs-start", ({ gameType }) => {
		const player = s2p(socket.id);
		const crew = player?.crew;

		if(!player || !crew) {
			console.log("io/corsairs-start: ", !!player, !!crew);
		}

		// Return and send notification if someone else than the party owner tries to start the game
		// if(player !== crew.owner) {
				//return ChatHandler.notifyById("error", `Tylko kapitan załogi może rozpocząć grę`, socket.id);
				// TODO: chat system, notifyCrew
		// }

		// Send info to all the party members
		for(const crewPlayer of crew.players) {
				// TODO: maybe players should first respond if they are ready?
				io.to(crewPlayer.socket.id).emit("corsairs-run", {gameType});
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
		const player = s2p(socket.id);
		const sessionPlayer = player?.session?.players.get(socket.id);

		sessionPlayer?.addInput(key);
	});
	
	socket.on("corsairs-keyup", key => {
		const player = s2p(socket.id);
		const sessionPlayer = player?.session?.players.get(socket.id);

		sessionPlayer?.removeInput(key);
	});
});

export default io;