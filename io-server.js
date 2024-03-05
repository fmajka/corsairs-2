import { Server } from "socket.io";
import { createPlayer, deletePlayer, playerNameMap, s2p } from "./server/State.js";
import { server } from "./app.js";

// IO stuff
const io = new Server(server);

io.sockets.on('connection', socket => {
	console.log(`${socket.id} connected!`);

	let name = "";
	do {
		const id = Math.floor(Math.random() * 1000);
		name = `Corsair${id}`;
	} while(playerNameMap.has(name));
	createPlayer(socket, name);

	io.to(socket.id).emit("socketid", {id: socket.id, name});
	
	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected!`);
		deletePlayer(s2p(socket.id));
	});
});

export default io;