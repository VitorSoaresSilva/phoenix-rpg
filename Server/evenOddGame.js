// const { PlayersServer, RoomsServer } = require("../server")

module.exports = function (io,client,RoomsServer,PlayersServer) {
    client.on('startGame',handleStartGame)
    function handleStartGame(){
        let player = PlayersServer.get(client.id);
        if(!player) return;
        let room = RoomsServer.get(player.roomName);
        if(!room) return;
        if(room.players.length > 1){
            let playerOne = Math.floor(Math.random() * room.players.length);
            let playerTwo = Math.floor(Math.random() * room.players.length);
            while(playerTwo === playerOne){
                playerTwo = Math.floor(Math.random() * room.players.length);
            }
            io.to(room.players[playerOne])
                .to(room.players[playerTwo])
                .emit("opponentChosen")
        }
    }
}
