import CorsairsServer from "../corsairs/CorsairsServer.js";
import Crew from "./Crew.js";
import User from "./User.js";

// Party system
const crews = [];
const usernameMap = new Map(); // Maps usernames to Users
const socketMap = new Map(); // Map socket ids to User objects

/** 
 * Removes the first occurance of 'item' in array 'arr' 
 * @param {Array} arr - Array from which the item should be removed
 * @param {any} item - Item to remove from the array
 * */
const arrRemoveItem = (arr, item) => {
	const index = arr.indexOf(item);
  if (index > -1) { arr.splice(index, 1); }
}

/** 
 * Gets User object from 'socketMap' Map based on given parameter
 * @param {Socket|cookie<string>} from - Supported object containing user's socketId
 * @returns {User} User data object
 * */
function getUser(from) {
	// Get socketId from cookie
	if (typeof from === "string") {
		// TODO: make it more robust
		from = cookie.split("=").slice(1).join("=");
	}
	return socketMap.get(from);
}

// Get player from socketId
function s2u(socketId) {
	return socketMap.get(socketId);
}

function c2u(cookie) {
	// TODO: what if no cookie?
	const socketId = cookie.split("=").slice(1).join("=");
	return s2u(socketId);
}

function createUser(socket, name) {
	const player = new User(socket, name);
	socket.player = player;

	usernameMap.set(name, player);
	socketMap.set(socket.id, player);

	return player;
}

function getRandomName() {
	let name = "";
	do {
		const id = Math.floor(100 + Math.random() * 900);
		name = `Corsair${id}`;
	} while(usernameMap.has(name));
	return name;
}

function getCrewById(id) {
	return crews.find(crew => id == crew.id);
}

function userCreateCrew(player) {
	if(player.crew) { return player.crew; }

	const crew = new Crew(player);
	player.crew = crew;
	crews.push(crew);
	return crew;
}

function userLeaveCrew(player) {
	const crew = player.crew;
	if(!crew) { return; }

	if(player.socket) {
		CorsairsServer.endSession(player.socket.id);
	}

	player.crew = null;
	arrRemoveItem(crew.mates, player);
	// Crew with no members, is it lonely?
	if(crew.count() == 0) {
		arrRemoveItem(crews, crew);
		return false;
	}
	// New captain - first guy from the list
	if(crew.captain == player) {
		crew.captain = crew.mates[0];
	}

	return true;
}

function deleteUser(user) {
	usernameMap.delete(user.name);
	socketMap.delete(user.socket.id);
	if(user.crew) {
		const crewId = user.crew.id;
		userLeaveCrew(user);
		user.socket.broadcast.emit("crew-change", { id: crewId });
	}
}

export { 
	crews, 
	c2u, s2u, getUser, getCrewById, getRandomName,
	createUser, deleteUser, userCreateCrew, userLeaveCrew,
}