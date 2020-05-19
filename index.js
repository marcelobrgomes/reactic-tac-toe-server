var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

app.get('/', (req,res)=> {
    res.sendFile(__dirname + '/index.html');
})

var gameRooms = [[]]

function getNextRoom() {
    var lastRoom = gameRooms[gameRooms.length-1]

    if(lastRoom.length < 2) {
        return lastRoom
    } else {
        gameRooms.push([])
        return gameRooms[gameRooms.length-1]
    }
}

io.on('connection', (socket) => {
    console.log('a user connected', socket.id)
    var room = getNextRoom()
    room.push(socket.id)

    console.log('room', room)

    socket.on('move', gameData => {
        if(room.length === 2) {
            var to = room.indexOf(socket.id) === 0 ? room[1] : room[0]
            
            socket.to(to)
            .emit('move', gameData)
            console.log(gameData)
        }
    })

    socket.on('disconnect', () => {
        room.splice(room.indexOf(socket.id))
        console.log('room', room)
        console.log('user disconnected', socket.id)
    })
})

http.listen(3001, () => {
    console.log('listening port 3001');
})