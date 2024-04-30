//import { io } from "https://cdn.socket.io/4.7.4/socket.io.esm.min.js";
// import { io } from "socket.io-client";
import Corsairs from "../corsairs/Corsairs.js";

//const URL = "http://localhost:2137";
//const URL = "http://192.168.50.61:2137";
//const URL = `http://${host}:3000`;
export const socket = io();

socket.on("connect", () => {
	console.log("Connected!");
	Corsairs.socket = socket;
});

socket.on("disconnect", () => {
	console.log("Disconnected!");
});

// Cookies!
socket.on("socket-id", ({id, name, avatar}) => {
	console.log(id);

	document.getElementById("player-name").innerHTML = name;
	document.getElementById("player-avatar").style.backgroundImage = `url('${avatar}')`;

	fetch("/socket-id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
		body: JSON.stringify({id})
  });
});

// UI updates
socket.on("crew-change", ({id}) => {
	// Update tavern list's target attribute
	const el = document.querySelector(".tavern-list");
	if(el) {
		const crewId = `#crew-${id}`;
		const target = el.querySelector(crewId);

		if(target) {
			el.setAttribute("hx-target", crewId);
			el.setAttribute("hx-swap", "outerHTML");
		}
		else {
			el.setAttribute("hx-target", "this");
			el.setAttribute("hx-swap", "beforeend");
		}
		el.setAttribute("hx-vals", `{"type": "tavern", "crewId": ${id}}`);
	}
	
	document.body.dispatchEvent(new CustomEvent("crew-change"));
	console.log(`Crew ${id} changed!`)
});

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