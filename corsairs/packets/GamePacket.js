export default class GamePacket {
    // Identifies the packet and determines what to do with it
    type;
    // Decides whether the packet should be sent to all players or to the player specified by "playerId" property
    local = false;
}