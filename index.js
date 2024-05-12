import { app } from "./server/app.js";
import io from "./server/io-server.js";
import { s2u } from "./server/state.js";

import CorsairsServer from "./corsairs/CorsairsServer.js";
import Player from "./corsairs/components/Player.js";

import { FieldPath } from "firebase-admin/firestore";
import { refStats } from "./server/firebase-admin.js";

app.get("/", (_, res) => {
	res.render("index");
});

CorsairsServer.init(io)
	.setOnStart(session => {
		const crew = s2u(session.socketId)?.crew;
		if(!crew) { return console.log("CorsiarsServer.onStart", !!crew); }

		// Init server-side players from the party
		session.players.clear();
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
		const uids = [];
		for(const crewmate of crew.mates) {
			crewmate.session = null;
			if(crewmate.uid) { uids.push(crewmate.uid); }
		}
		if(uids.length == 0) { return; }
		
		// Update stats
		refStats.where(FieldPath.documentId(), "in", uids).get()
		.then(snapshot => {
			const docs = [];
			for(const doc of snapshot.docs) { docs.push({ uid: doc.id, ...doc.data() }); }

			for(const doc of docs) {
				const updated = { 
					score: doc.score + session.score,
					highscore: Math.max(doc.highscore, session.score),
				}
				console.log(updated);
				refStats.doc(doc.uid).update(updated);
			}
		})
		.catch(err => console.log(err));
	
	});

CorsairsServer.start();
