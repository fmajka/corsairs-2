import AbilitySystem from "./systems/AbilitySystem.js";
import AISystem from "./systems/AISystem.js";
import ClearSystem from "./systems/ClearSystem.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import MovementSystem from "./systems/MovementSystem.js";
import PlayerSystem from "./systems/PlayerSystem.js";

import CorsairsSessionServer from "./CorsairsSessionServer.js";

export default class CorsairsServer {
	static sessions = new Map();
	static interval = 33;
	static timeout = null;

	// Callbacks
	static onStart = (session) => {};
	static onEnd = (session) => {};

	static io = null;

	static init(io) {
		this.io = io;
		return this;
	}

	static setOnStart(onStart) { 
		this.onStart = onStart; 
		return this; 
	}
	
	static setOnEnd(onEnd) { 
		this.onEnd = onEnd; 
		return this; 
	}

	static createSession(socketId, {gameType = "classic"}) {
		let session = null;
		// User's session should be mapped to their socketId?
		if(!this.sessions.has(socketId)) {
			session = new CorsairsSessionServer(socketId);
			this.sessions.set(socketId, session);
			console.log(`Created new session for ${socketId}`);
		}
		else {
			console.log(`Session already established for ${socketId}, restarting`);
			session = this.sessions.get(socketId);
		}
		// OK. Let's go.
		session.start(gameType);
	}

	static endSession(socketId) {
		if(!this.sessions.has(socketId))
			return;
		
		const session = this.sessions.get(socketId);
		this.sessions.delete(socketId);
		if(!session.gameOver) {
			session.end();
		}
	}

	// Request game tick
	static start() {	
		CorsairsServer.timeout = setTimeout(CorsairsServer.update, CorsairsServer.interval);
	}

	// Updates all sessions
	static update() {
		let currentTime = Date.now();
		let globalDt = Math.min(0.05, (currentTime - CorsairsServer.lastTime) / 1000);
		CorsairsServer.lastTime = currentTime;
		CorsairsServer.upTime += globalDt;

		// Loop through all sessions
		for(let [userId, session] of CorsairsServer.sessions.entries()) {
			let dt = globalDt;

			// Don't update if session stopped
			if(!session.running || session.paused)
				continue;

			// Epic slow-motion
			if(session.gameOver)
				dt /= 2;
			else
				dt *= session.speed;

			// Update loop
			PlayerSystem.update(session, dt);
			MovementSystem.update(session, dt);
			CollisionSystem.update(session);
			AbilitySystem.update(session, dt);
			AISystem.update(session, dt);
			ClearSystem.update(session, dt);

			PlayerSystem.clear(session);

			// Send buffered data to clients (the entire array at once, why not?)
			// TODO: possibly large overhead generated for no real reason (because of local packets)
			for(let [playerId, player] of session.players.entries()) {
				let packets = session.packetBuffer.concat(player.localPacketBuffer);
				if(packets.length > 0) {
					CorsairsServer.io.to(playerId).emit("corsairs-data", packets);
					player.localPacketBuffer = [];
				}
			}
			session.packetBuffer = [];
		}

		// Request another frame	
		CorsairsServer.timeout = setTimeout(CorsairsServer.update, CorsairsServer.interval);
	}

}