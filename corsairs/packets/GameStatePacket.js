import GamePacket from "./GamePacket.js";

export default class GameStatePacket extends GamePacket {
    type = "GameState";
    
    constructor(session, propsArr) {
        super();
        // objects mapping game props to their new values, will directly update client's Corsairs class static variables
        this.props = {};

        for(let prop of propsArr) {
            this.props[prop] = session[prop];
        }
    }
}