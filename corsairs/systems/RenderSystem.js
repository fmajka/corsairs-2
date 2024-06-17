import Corsairs from "../Corsairs.js";
import InputManager from "../managers/InputManager.js";

export default class RenderSystem {
	static SPRITE_SCALE = 3;

	static draw(session) {
		let ctx = Corsairs.ctx;
		ctx.clearRect(0, 0, ctx.canvas.width / Corsairs.ctxScale, ctx.canvas.height / Corsairs.ctxScale);

		ctx.save();
		if(Corsairs.ctxRotated) {
			ctx.translate(0, session.width);
			ctx.rotate(-Math.PI / 2);
		}

		for(let [id, entity] of session.entities.entries()) {
			const sprite = entity.sprite;
			const image = sprite.image;
			const width = image.width;
			const height = image.height;
			const ax = image.width  * sprite.anchor.x;
			const ay = image.height * sprite.anchor.y;
			const tx = entity.pos.x;
			const ty = entity.pos.y;
			const scale = this.SPRITE_SCALE;

			ctx.save();

			ctx.translate(tx, ty);
			ctx.rotate(entity.angle);
			ctx.drawImage(image, -ax * scale, -ay * scale, width * scale, height * scale);

			ctx.restore(); 
			
			// let c = entity.collider;
			// let p = entity.pos;
			// ctx.fillStyle = "red";
			// ctx.fillRect(p.x + c.x - c.w, p.y + c.y - c.h, 2*c.w, 2*c.h);
		}

		ctx.restore();

		// let str = `${entity.angle}, ${InputManager.controller.mousePos.x}, ${InputManager.controller.mousePos.y}`;
		// for(let [entityId, entity] of session.entities.entries()) {
		// 	str += `${entityId}: ${entity.constructor.name}`;
		// 	ctx.fillText(`x: ${entity.vel.x}, y: ${entity.vel.y}`, 0, 150);
		// 	break;
		// }
		// ctx.fillText(str, 0, 100);

		const player = session.players.get(0);
		if(player) {
			const ox = Math.round(player.touchOrigin.x - player.touchPos.x), oy = Math.round(player.touchOrigin.y - player.touchPos.y);
			let str = `${player.touching}, [${ox}, ${oy}]`;
			ctx.fillText(str, 0, 100);
		}

		// TEMP: mobile gaming better view
		const menu = document.getElementById("game-over-mobile");
		
		// Draw some overlay...
		if(session.gameOver) {
			if(menu) { menu.style.display = ""; }

			ctx.font = "bold 24px sans-serif";
			ctx.textAlign = "center";

			// Dark fade-in overlay
			ctx.fillStyle = "black";
			ctx.globalAlpha = Math.min(0.5, session.upTime / 3);
			ctx.fillRect(0, 0, ctx.canvas.width / Corsairs.ctxScale, ctx.canvas.height / Corsairs.ctxScale);
			ctx.globalAlpha = 1;
			
			// Ending text
			let x = ctx.canvas.width / Corsairs.ctxScale / 2, y = ctx.canvas.height / Corsairs.ctxScale / 2 - 30;
			ctx.fillStyle = "#D88B46";
			ctx.fillText(`Wynik: ${session.score}`, x, y);
			ctx.fillText(`Spróbuj ponownie (R)`, x, y += 75);
			ctx.fillText(`Zakończ (Escape)`, x, y += 45);
		} 
		else {
			if(menu) { menu.style.display = "none"; }

			ctx.fillStyle = "#D88B46";
			ctx.font = "bold 24px sans-serif";
			ctx.textAlign = "left";

			// Draw player stats
			ctx.fillText(`Wynik: ${session.score}`, 10, 34);
			let player = session.players.get(0);
			if(player && player.entity) {
				let hp = "";
				for(let i = 0; i < player.entity.life; i++) {
					hp += "|";
				}
				ctx.fillText(`HP: ${hp}`, 10, 68);
			}
			
		}

	}

}