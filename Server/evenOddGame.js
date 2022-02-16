// const { PlayersServer, RoomsServer } = require("../server")

module.exports = function (io,client,RoomsServer,PlayersServer) {
    client.on('startGame',handleStartGame)
    client.on('evenOdd_choosed_value',handleChoosedValue)
    function handleStartGame(){
        let player = PlayersServer.get(client.id);
        if(!player) return;
        let room = RoomsServer.get(player.roomName);
        if(!room) return;
        let playerOneIndex;
        let playerTwoIndex;
        if(room.players.length == 2){
            playerOneIndex = 0;
            playerTwoIndex = 1;
        }
        else if(room.players.length > 2){
            playerOneIndex = Math.floor(Math.random() * room.players.length);
            playerTwoIndex = Math.floor(Math.random() * room.players.length);
            while(playerTwoIndex === playerOneIndex){
                playerTwoIndex = Math.floor(Math.random() * room.players.length);
            }
        }else{
            io.to(room.name).emit('notEnoughPlayers')
            return;
        }
        let playerOne = PlayersServer.get(room.players[playerOneIndex])
        let playerTwo = PlayersServer.get(room.players[playerTwoIndex])
        console.log(playerOne)
        io.in([playerOne.socketId,playerTwo.socketId]).socketsJoin("game_" + room.name);
        io.in([playerOne.socketId,playerTwo.socketId]).socketsLeave("preRoom_" + room.name);
        let dataToPlayers = {};
        dataToPlayers[playerOne.socketId] = "odd";
        dataToPlayers[playerTwo.socketId] = "even";
        io.to('game_' + room.name).emit('initializeGame',dataToPlayers)
        io.to('preRoom_' + room.name).emit('spec_gameInitialize',{playersInGame:[playerOne.character.name,playerTwo.character.name]})
        room.game = {
            odd: {
                player: playerOne.socketId,
                valueChoosed: null,
            },
            even: {
                player: playerTwo.socketId,
                valueChoosed: null,
            }
        }
    }
    function handleChoosedValue(value){
        let player = PlayersServer.get(client.id);
        if(!player) return;
        let room = RoomsServer.get(player.roomName);
        if(!room) return;
        console.log(room.game)
        if(room.game.odd === client.id){
            if(room.game.odd.valueChoosed === null){
                room.game.odd.valueChoosed = value
            }
            // else{
                //emit already choosed
            // }
        }else{
            if(room.game.even.valueChoosed === null){
                room.game.even.valueChoosed = value
            }
            // else{
                //emit already choosed
            // }
        }
        if(room.game.even.valueChoosed != null && room.game.odd.valueChoosed != null){ 
            //validar 
            console.log("result "+ room.game.even.valueChoosed + room.game.odd.valueChoosed)
        }
        console.log("player : " + client.id + " choosed the value: " + value)
    }
}
