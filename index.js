import { app } from "./server/app.js";
import htmx from "./server/htmx.js"
import io from "./server/io-server.js";
import { s2u } from "./server/state.js";

import CorsairsServer from "./corsairs/CorsairsServer.js";
import Player from "./corsairs/components/Player.js";


app.use("/htmx", htmx);

app.get("/", (_, res) => {
	res.render("index");
});

app.post("/socket-id", (req, res) => {
	console.log("Sending cookie with id: ", req.body);
	res.cookie("id", req.body.id);
	res.send("Cookie Set");
});

CorsairsServer.init(io)
	.setOnStart(session => {
		const crew = s2u(session.socketId)?.crew;
		if(!crew) { return console.log("CorsiarsServer.onStart", !!crew); }

		// Init server-side players from the party
		for(const crewmate of crew.mates) {
			crewmate.session = session;

			const socketId = crewmate.socket.id;
			const player = new Player(socketId);
			session.players.set(socketId, player);
		}
	})
	.setOnEnd(session => {
		const crew = s2u(session.socketId)?.crew;
		if(!crew) { return console.log("CorsiarsServer.onEnd", !!crew); }
	
		// TODO: actually submit score
		console.log("Submitted score:", session.score);
		for(const crewmate of crew.mates) {
			crewmate.session = null;
		}
	});

CorsairsServer.start();
