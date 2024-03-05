import InputManager from "./InputManager.js";
import TouchManager from "./TouchManager.js";

export default class EventManager {

	static init(){
		window.addEventListener('keydown', this.keydown);
		window.addEventListener('keyup', this.keyup);
		window.addEventListener('resize', this.resize);
		window.addEventListener('mousedown', this.mousedown);
		window.addEventListener('mousemove', this.mousemove);
		window.addEventListener('mouseup', this.mouseup);
		window.addEventListener('touchstart', this.touchstart);
		window.addEventListener('touchmove', this.touchmove);
		window.addEventListener('touchend', this.touchend);
	}

	static keydown(event){
		if(event.repeat)
			return;
			
		InputManager.add(event.keyCode);
	}

	static keyup(event){
		InputManager.remove(event.keyCode);
	}

	static resize(event){
		// Canvas untracked scale reset fix
		//RenderManager.resize(RenderManager.getZoom());
	}

	static mousedown(event){
		InputManager.add(event.button);
	}

	static mousemove(event){
		InputManager.move(event);
	}

	static mouseup(event){
		InputManager.remove(event.button);
	}

	static touchstart(event) {
		TouchManager.start(event);
	}

	static touchmove(event) {
		TouchManager.move(event);
	}

	static touchend(event) {
		TouchManager.end(event);
	}
}