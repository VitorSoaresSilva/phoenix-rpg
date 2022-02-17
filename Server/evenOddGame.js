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
            playerOneIndex = Math.floor(Math.random() * room.players.length);
            playerTwoIndex = (playerOneIndex + 1) % 2;
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
        
/**
 * Spec need
 * 
 * Name of the player in game
 * Which player wins with which result
 * {data: [
 *  {name,type},
 *  {name,type}
 * ]}
 */


        let playerOne = PlayersServer.get(room.players[playerOneIndex])
        let playerTwo = PlayersServer.get(room.players[playerTwoIndex])
        io.in([playerOne.socketId,playerTwo.socketId]).socketsJoin("game_" + room.name);
        io.in([playerOne.socketId,playerTwo.socketId]).socketsLeave("preRoom_" + room.name);
        let dataToPlayers = {};
        dataToPlayers[playerOne.socketId] = "odd";
        dataToPlayers[playerTwo.socketId] = "even";
        io.to('game_' + room.name).emit('initializeGame',dataToPlayers)
        
        let specData = {
            playersInGame:[
                {
                    name: playerOne.character.name,
                    type: "odd"
                },
                {
                    name: playerTwo.character.name,
                    type: "even"
                }
            ]
        };
        io.to('preRoom_' + room.name).emit('spec_gameInitialize',specData)
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
        
        if(room.game.odd.player === client.id){
            if(room.game.odd.valueChoosed === null){
                room.game.odd.valueChoosed = value;
            }else{
                // emit "cannot change"
                return;
            }
        }else if(room.game.even.player === client.id){
            if(room.game.even.valueChoosed === null){
                room.game.even.valueChoosed = value;
            }else{
                // emit "cannot change"
                return;    
            }
        }else{
            // not a player
        }
        if(room.game.even.valueChoosed != null && room.game.odd.valueChoosed != null){ 
            let result = (room.game.even.valueChoosed + room.game.odd.valueChoosed) % 2;
            if(result === 0){
                io.to(room.game.even.player).emit("youWon")
                io.to(room.game.odd.player).emit("youLose")
            }else{
                io.to(room.game.odd.player).emit("youWon")
                io.to(room.game.even.player).emit("youLose")
            }
        }
    }
}
