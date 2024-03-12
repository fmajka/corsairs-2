import EventManager from "./managers/EventManager.js";
import InputManager from "./managers/InputManager.js";

import Sprite from "./components/Sprite.js";
import Player from "./components/Player.js";

import EntityBadShip from "./entities/EntityBadShip.js";
import EntityCannonball from "./entities/EntityCannonball.js";
import EntityShip from "./entities/EntityShip.js";

import AbilitySystem from "./systems/AbilitySystem.js";
import AISystem from "./systems/AISystem.js";
import ClearSystem from "./systems/ClearSystem.js";
import CollisionSystem from "./systems/CollisionSystem.js";
import MovementSystem from "./systems/MovementSystem.js";
import PlayerSystem from "./systems/PlayerSystem.js";
import RenderSystem from "./systems/RenderSystem.js";
import InterfaceSystem from "./systems/InterfaceSystem.js";

import CorsairsSession from "./CorsairsSession.js";

import ControllerType from "./enums/ControllerType.js";
import Input from "./enums/Input.js";

export default class Corsairs {
	static wrapper = null;
	static ctx = null;
	static ctxScale = 1;
	static ctxRotated = false;
	// TODO: init?
	static ctxRect;

	// Stores references to Entity subclasses, allowing to instantiate them by name
	static classMap = {
		EntityBadShip: EntityBadShip,
		EntityCannonball: EntityCannonball,
		EntityShip: EntityShip
	};

	// Socket now passed as mount argument
	static socket = null;

	// Local game session
	static session = new CorsairsSession();

	// Controller array, initializes the session's "players" map when session starts
	static controllers = [];

	// Loaded sprites!
	static sprites = new Map();

	// Set this to true when all the DOM elements are ready
	static mounted = false;
	// Set this to true when all the assets are loaded
	static loaded = false;

	// Attach game-related elements to a wrapper & initialize stuff...
	static async mount(wrapperQuery, socket) {
		this.wrapper = document.querySelector(wrapperQuery);
		let canvas = document.createElement("canvas");
		let overlay = document.createElement("div");
		
		overlay.classList.add("game-overlay");

		this.wrapper.appendChild(canvas);
		this.wrapper.appendChild(overlay);

		// Mobile gaming
		canvas.addEventListener('touchstart', event => event.preventDefault());
		overlay.addEventListener('touchstart', event => event.preventDefault());
		
		Corsairs.ctx = canvas.getContext("2d");
		resizeCanvas();

		// Multiplayer capabilities
		this.socket = socket;

		this.mounted = true;

		return await this.load();
	}

	// Load game assets
	static async load() {
		// Ignore when assets are already loaded
		if(this.loaded) {
			return true;
		}

		EventManager.init();

		// Controller setup
		for(let i = 0; i < 4; i++) {
			const player = new Player(i);
			if(i > 0) {
				player.typeId = 0;
			}

			this.controllers.push(player);
		}

		// Set all in-game sprites
		Sprite.directory = "./corsairs/gfx/";
		this.sprites.set("ship", new Sprite("ship/ship1.png"));
		this.sprites.set("allyShip", new Sprite("ship/allyShip1.png"));
		this.sprites.set("cannonball", new Sprite("badCannonball.png"));
		this.sprites.set("badCannonball", new Sprite("cannonball.png"));
		for(let i = 1; i <= 3; i++) { 
			this.sprites.set(`ship${i}`, new Sprite(`ship/ship${i}.png`));
			this.sprites.set(`allyShip${i}`, new Sprite(`ship/allyShip${i}.png`));
		}
		for(let i = 1; i <= 8; i++) { this.sprites.set(`badShip${i}`, new Sprite(`badShip/badShip${i}.png`)); }

		// Load sprites
		let promises = [];
		this.sprites.forEach((sprite, key) => {
			promises.push(sprite.init());
		});

		// When loading finishes, start the game
		await Promise.all(promises)
			.then(() => {
				console.log("Corsairs: Locked & loaded!");
				// Passess a pointer so that systems can refer to the session
				this.session.sprites = this.sprites;
				this.loaded = true;
				return true;
			})
			.catch(() => {
				console.log("Corsairs: loading failed (nobody knows why...)")
				return false;
			});
	}

	// TODO: this shouldn't be here...?
	// TODO: find another way of handling this
	static initController(controller) {
		switch(controller.typeId) {
			case ControllerType.KEYBOARD:
				return controller;
			case ControllerType.MOUSE:
				let player = new Player(controller.id, { attack: Input.Button.LMB });
				player.typeId = ControllerType.MOUSE;
				return player;
			default:
				console.log(`Corsairs: unknown ControllerTypeID: ${controller.typeId}`);
				return null;
		}
	}

	// Runs the game
	static run(gameType) {
		// TODO: this looks kinda ugly...
		this.wrapper.style.display = ""
		
		// Prevent spacebar from triggering start button and restarting the game
		const input = document.getElementById("ready-btn");
		input.blur();

		// TODO: this is pretty random
		InputManager.controller.inputs.clear();
		this.ctxRect = this.ctx.canvas.getBoundingClientRect();

		// Reset session's player controllers
		this.session.players.clear();
		for(let controller of this.controllers) {
			if(controller.typeId == 0) {
				continue;
			}
			this.session.players.set(controller.id, this.initController(controller));
		}

		this.session.start(gameType);
		console.log(`Corsairs.run(): ${gameType}`)
		// Canvas dimensions fix
		resizeCanvas();

		window.requestAnimationFrame(this.update);
	}

	// Starts up / resets the game
	static start() {
		if(!this.loaded) {
			console.log("Corsairs still loading...");
			return;
		}

		const gameType = (window.innerWidth > window.innerHeight) ? "classic" : "mobile";

		// (Re)start a server-side session for the player
		if(this.session.multiplayer) {
			// Tell the server to start, response ("runGame") is handled in socket.js
			this.socket.emit("corsairs-start", { gameType: gameType });
		}
		// Singleplayer experience
		else {
			this.run(gameType);	
		}
	}

	static leave() {
		if(!this.session.running) { return; }

		// Leave the game
		this.session.running = false;
		
		// Emit info to the server to end session
		if(this.session.multiplayer) {
			this.socket.emit("corsairs-leave", {});
		}

		// Hide the display
		this.wrapper.style.display = "none";
	}

	static update(){
		let currentTime = Date.now();
		let dt = Math.min(0.05, (currentTime - Corsairs.session.lastTime) / 1000);
		Corsairs.session.lastTime = currentTime;
		Corsairs.session.upTime += dt;

		// Epic slow-motion
		if(Corsairs.session.gameOver)
			dt /= 2;
		else
			dt *= Corsairs.session.speed;

		// Update loop
		PlayerSystem.update(Corsairs.session, dt);
		MovementSystem.update(Corsairs.session, dt);
		CollisionSystem.update(Corsairs.session);
		AbilitySystem.update(Corsairs.session, dt);
		AISystem.update(Corsairs.session, dt);
		ClearSystem.update(Corsairs.session, dt);
		InterfaceSystem.update(Corsairs.session);

		// Clean up & render
		InputManager.clear();
		RenderSystem.draw(Corsairs.session);

		// Request another frame if the game is still running
		if(Corsairs.session.running && !Corsairs.session.paused)
			window.requestAnimationFrame(Corsairs.update);
	}

}

window.Corsairs = Corsairs;

// TODO: where to put this guy?
function resizeCanvas(event) {
	let ctx = Corsairs.ctx;
	if(ctx === null)
		return;

	const ratio = Corsairs.session.width / Corsairs.session.height;

	let width = window.innerWidth;
	let height = window.innerHeight;

	// DESKTOP - default view
	//if(width > height) {
		Corsairs.ctxRotated = false;
		if(height * ratio > width)
			height = width / ratio;
		else
			width = height * ratio;
	//}
	// MOBILE - affects rendering & touch controls
	//else {
		/*
		Corsairs.ctxRotated = true;
		if(width * ratio > height)
			width = height / ratio;
		else
			height = width * ratio;
		*/
	//}

	const scale = Corsairs.ctxScale = (Corsairs.ctxRotated) ? height / Corsairs.session.width : width / Corsairs.session.width;

	// Store canvas coordinates for easier access
	Corsairs.ctxRect = ctx.canvas.getBoundingClientRect();

	ctx.canvas.setAttribute("style" ,`width: ${width}px`);
	ctx.canvas.setAttribute("style" ,`height: ${height}px`);
	ctx.canvas.width = width;
	ctx.canvas.height = height;
	ctx.scale(scale, scale);
	ctx.setImageSmoothingEnabled = false;
	console.log(width, height, scale);
}

// Listeners, move to some manager
window.addEventListener("resize", resizeCanvas);