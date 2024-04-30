import CorsairsSession from "./CorsairsSession.js";

import EntityAddPacket from "./packets/EntityAddPacket.js";
import PlayerBindEntityPacket from "./packets/PlayerBindEntityPacket.js";
import EntityCastPacket from "./packets/EntityCastPacket.js";
import EntityDeletePacket from "./packets/EntityDeletePacket.js";
import SetEntitySpritePacket from "./packets/SetEntitySpritePacket.js";

import CorsairsServer from "./CorsairsServer.js";

export default class CorsairsSessionServer extends CorsairsSession {
	// Id of this session's owner
	socketId;
	// Data to be sent to client
	packetBuffer = [];

	// Initialize player for the requesting user
	constructor(socketId) {
		super(socketId);

		this.socketId = socketId;
		this.serverSide = true;
	}

	// Adds game data to the packetBuffer
	insertPacket(packet) {
		// Local packet is only sent to a specific player
		if(packet.local) {
			const player = this.players.get(packet.playerId);
			if(player) {
				packet.playerId = 0;	// Reset so the socketId is not exposed to the client
				player.localPacketBuffer.push(packet);
			}
			else {
				// TODO: temp err msg
				console.log(`${packet.playerId} not found within ${socketId}'s session`);
			}
		}
		// Packet sent to all players
		else {
			this.packetBuffer.push(packet);
		}
	}

	// Starts up / resets the game
	start(gameType) {
		CorsairsServer.onStart(this);

		// Resets game state & creates starting entities
		super.start(gameType);
	}

	// End the game and free the players when they are defeated
	end() {
		super.end();

		// Callback that handles submitting score and sending info to players
		CorsairsServer.onEnd(this);
	}

	// Insert entity to the game
	entityAdd(entity, propArr = []) {
		// It's the server - just insert the new entity
		entity.id = this.entityCount;
		this.entities.set(this.entityCount++, entity);
		
		// Send info about new entity to client
		this.insertPacket(new EntityAddPacket(entity, propArr));

		return entity;
	}

	// Make unit cast given ability - if it succeeds, send info to clients
	entityCast(entity, abilityId) {
		let success = super.entityCast(entity, abilityId);
		if(success) {
			this.insertPacket(new EntityCastPacket(entity, abilityId));
		}

		return success;
	}

	// Removes the entity from the game (also for the clients)
	entityDelete(entity) {
		super.entityDelete(entity);
		this.insertPacket(new EntityDeletePacket(entity));
	}

	// Binds player to entity and sends info about it to specified client
	playerBindEntity(player, entity) {
		super.playerBindEntity(player, entity);
		this.insertPacket(new PlayerBindEntityPacket(player, entity));
		console.log(player.id + " bound to " + entity.id);
	}

	// Sends info about changing an entity's sprite
	setEntitySprite(entity, spriteName) {
		this.insertPacket(new SetEntitySpritePacket(entity, spriteName));
	}

	// Sends info about changing an entity's sprite for specified player (used for ship colors)
	setEntitySpriteForPlayer(entity, spriteName, playerId) {
		let packet = new SetEntitySpritePacket(entity, spriteName);
		packet.playerId = playerId;
		packet.local = true;
		this.insertPacket(packet);
	}
}