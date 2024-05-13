import Corsairs from "../../corsairs/Corsairs.js";

//const URL = "http://localhost:2137";
export const socket = io();

function setUser(auth, name, avatar) {
	const user = Alpine.store("user");
	user.auth = auth;
	user.name = name;
	if(avatar) { user.avatar = avatar; }
	return user;
}

socket.on("connect", () => {
	console.log("Connected!");
	Corsairs.socket = socket;
});

socket.on("disconnect", () => {
	console.log("Disconnected!");
});

// Cookies!
socket.on("init", ({name, avatar}) => {
	const user = setUser(false, name, avatar);

	// Reset some local alpine store props
	user.crew = null;
	Alpine.store("crews", []);
});

socket.on("user-change", ({auth, name, avatar}) => {
	setUser(auth, name, avatar);
	const form = Alpine.store("form");
	form.setType(null);
	form.email = form.password = "";
})

// UI updates
socket.on("crew-change", ({id, crew}) => {
	if(!crew) { return console.log("io-client @crew-change: null crew"); }
	const update = crew.mates.length > 0; // !update == delete
	
	const user = Alpine.store("user");
	if(!update && crew.id === user.crew?.id) {
		user.crew = null; // User's crew deleted
	}
	else if(crew.mates.some(mate => mate.name === user.name)) {
		user.crew = crew; // User now belongs to an updated crew
	}
	
	const crews = Alpine.store("crews");
	for(let i = 0; i < crews.length; i++) {
		if(crews[i].id === id) {
			return update ? crews[i] = crew : crews.splice(i, 1);
		}
	}

	// Insert new crew as it doesn't exist yet
	crews.push(crew);
});

socket.on("view-change", (view) => {
	Alpine.store("router").setView(view);
});

socket.on("stats-change", (stats) => {
	Alpine.store("stats").data = stats;
})

// Game updates
socket.on("corsairs-run", ({gameType}) => {
  // TODO: set it somewhere else?
  Corsairs.session.multiplayer = true;
  Corsairs.run(gameType);
});

socket.on("corsairs-data", dataArr => {
  if(!Corsairs.session.running) {
    console.log(`Received corsairs-data (length: ${dataArr.length}) when the game isn't running`);
    return;
  }
    
  // Loop through all data packets in the array
  for(const data of dataArr) {
    let entity = null;
    let player = null;
    
    switch(data.type) {
      // Insert entity to the game
      case "EntityAdd":
        // Gets class from object storing references to all Corsairs Entity subclasses
        entity = new Corsairs.classMap[data.entityClass](data.x, data.y);
        entity.id = parseInt(data.entityId);
        for(const prop in data.props) {
          entity[prop] = data.props[prop];
          //console.log(`EntityAdd: class=${data.entityClass} ${prop}=${data.props[prop]}`);
        }
        Corsairs.session.entityAdd(entity);
        break;

      // Make entity cast an ability
      case "EntityCast":
        entity = Corsairs.session.entities.get(data.entityId);
        if(entity) {
          // Passing true enables casting for multiplayer games
          Corsairs.session.entityCast(entity, data.abilityId, true);
        }
        break;

      // Delete entity from the game
      case "EntityDelete":
        //console.log(`EntityDelete: id=${data.entityId}`);
        entity = Corsairs.session.entities.get(data.entityId);
        Corsairs.session.entityDelete(entity);
        break;

      // Set entities properties
      case "EntitySet":
        entity = Corsairs.session.entities.get(data.entityId);
        if(entity) {
          for(const prop in data.props) {
            entity[prop] = data.props[prop];
          }
        }
        break;

      // Allows the player to control certain entity
      case "PlayerBindEntity":
        entity = Corsairs.session.entities.get(data.entityId);
        // TODO: this only works for 1 player (which is fine, locally we don't see other players, only their entities)
        if(entity) {
          player = Corsairs.session.players.get(0);
          player.entity = entity;
          //console.log(`PlayerBindEntity: bound ${data.entityId} to some player`);
        } 
        else {
          console.log(`PlayerBindEntity: entity with id ${data.entityId} not found`);
        }
        break;

        // Update game properties
        case "GameState":
          for(const prop in data.props) {
            Corsairs.session[prop] = data.props[prop];
            //console.log(`GameState: ${prop} set to ${Corsairs.session[prop]}`);
          }
          break;

        // Update game properties
        case "SetEntitySprite":
          entity = Corsairs.session.entities.get(data.entityId);
          if(entity) {
            Corsairs.session.setEntitySprite(entity, data.spriteName);
          }
          break;

      default:
        console.log(`Unknown socket corsairs-data type: ${data.type}`);
    }

  }
});