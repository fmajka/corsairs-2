import GamePacket from "./GamePacket.js";

export default class PlayerBindEntityPacket extends GamePacket {
    type = "PlayerBindEntity";
    local = true;
    
    constructor(player, entity) {
        super();
        this.playerId = player.id;
        this.entityId = entity.id;
    }
}