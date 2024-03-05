import Ability from "./components/Ability.js";

import EntityShip from "./entities/EntityShip.js";

export default class CorsairsSession {
	width = 800;
	height = 600;

	abilities = new Map();
	entities = new Map();
	players = new Map();

	// Corsairs sets a pointer to its sprite map
	sprites = null;

	entityCount = 0;
	score = 0;
	speed = 1.00;

	lastTime;
	upTime = 0;
	dt = 0;

	alivePlayers = 0;

	// Client: is it a local or multiplayer game?
	multiplayer = false;	
	// Session belongs to the client or to the server? 
	// CorsairsSessionServer sets this to true
	serverSide = false;

	// Dynamic game props
	ready = false;
	running = false;
	paused = false;
	gameOver = false;

	// Some used-to-be-system-props
	spawnTimer = 0.0;
	SPAWN_INTERVAL = 1;

	constructor(ownerId = 0) {
		this.init(ownerId);
	}

	// This has nothing to do for the client, but since the systems are shared it has to be kept here...
	insertPacket(packet) {}

	// Initializes the session for a user
	init(ownerId){
		// Create starting abilities & players
		let ability = new Ability({ cooldown: 0.65 });
		this.abilities.set('cannons', ability);
		let ability2 = new Ability({ cooldown: 1 });
		this.abilities.set('badCannon', ability2);

		// TODO: socketId already exists for this purpose (rename socketId to ownerId?)
		this.ownerId = ownerId;
		this.ready = true;
	}

	// Starts up / resets the game
	start(gameType) {
		if(!this.ready) {
			console.log("CorsairsSession not initialized for some reason");
			return;
		}

		// Game type settings
		switch(gameType) {
			case "classic":
				this.width = 800;
				this.height = 600;
				break;
			case "mobile":
				this.width = 600;
				this.height = 800;
				break;
		}

		// Reset just in case
		this.entityCount = this.score = this.upTime = 0;
		this.speed = 1.00;
		this.gameOver = false;
		this.entities = new Map();

		// Create the party owner's player controller / local player
		this.alivePlayers = this.players.size;
		
		// Init players (skip if multiplayer game for the client)
		if(!this.multiplayer || this.serverSide) {
			const size = this.players.size;
			const sep = this.width / (size + 1);
			let x = 0;
			for(let [playerId, player] of this.players.entries()) {
				x = x + sep;
				// Create starting entities
				let ship = new EntityShip(x, this.height);
				ship.pos.y -= 2 * ship.collider.h;
				ship.angle = -Math.PI / 2;
				this.entityAdd(ship, ["pos", "angle"]);
				// Sets a custom sprite for the local player (to see their ship more easily)
				this.setEntitySpriteForPlayer(ship, "ship3", playerId);
				// Bind entities to players, send packet binding entity to player for the client
				this.playerBindEntity(player, ship);
			}
		}

		// Run the game
		this.running = true;
		this.lastTime = Date.now();
	}

	// Called when all of the players are defeated
	end() {
		this.gameOver = true;
		this.upTime = 0;
	}

	// Insert entity to the game
	entityAdd(entity, propArr = [], serverReq = false) {
		// Insert entity with specified id from the server
		if(this.multiplayer && entity.id >= 0) {
			this.entities.set(entity.id, entity);
		}
		// Singleplayer - automatically set new entity id
		if(!this.multiplayer) {
			entity.id = this.entityCount;
			this.entities.set(this.entityCount++, entity);
		}

		// Initializes the entity's sprite for the client's view
		if(entity.spritePath) {
			entity.sprite = this.sprites.get(entity.spritePath);
		}

		return entity;
	}

	// Make unit cast given ability - if it succeeds, send info to clients
	entityCast(entity, abilityId, serverReq = false) {
		// Skip if local request in a multiplayer game
		if(this.multiplayer && !serverReq)
			return false;

		// Skip if the entity can't cast... unless it's a server's request sent to the client
		if(!serverReq && (entity.isCasting || entity.spellbook.get(abilityId).cooldown > 0))
			return false;

		entity.isCasting = true;
		entity.abilityCast = abilityId;
		entity.abilityTime = 0;

		return true;
	}

	// Removes the entity from the game (also for the clients)
	entityDelete(entity) {
		this.entities.delete(entity.id);
	}

	// Binds player to entity and sends info about it to specified client
	playerBindEntity(player, entity) {
		player.entity = entity;
	}

	// Sets the entity's sprite
	setEntitySprite(entity, spriteName) {
		entity.sprite = this.sprites.get(spriteName);
	}

	// Only useful for the server-side
	setEntitySpriteForPlayer(entity, spriteName, playerId) {
		this.setEntitySprite(entity, spriteName);
	}
}