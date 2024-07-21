const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { publicEncrypt } = require("crypto");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
console.log(chess);

let players = {};
let currentPlayer = "w";
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index",{title: "Chess Game"});
});

io.on("connection",function(uniquesocket){
    console.log("connected");
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit("playerRole","w")
    }
    else if(!players.black){
        players.black=uniquesocket.id;
        uniquesocket.emit("playerRole","b")
    }
    else{
        uniquesocket.emit("spectatorRole")
    }

    uniquesocket.on("disconnect",()=>{
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    })
    
    uniquesocket.on("move",(move)=>{
        
        try{
            //if it is the move for correct player or not
            if(chess.turn() == "w" && uniquesocket.id!=players.white) return;
            if(chess.turn() == "b" && uniquesocket.id!=players.black) return;

            const result = chess.move(move)
            //if result is true
            if(result){
                currentPlayer = chess.turn()
                io.emit("move",move);
                io.emit("boardState",chess.fen())
            }
            else{
                console.log("Invalid move");
                uniquesocket.emit("invalid move",move);
            }

        }
        catch(err){
            console.log(err);
            uniquesocket.emit(move,"invalid move")
        }
    })
})
server.listen(5009, () => {
  console.log("listening on port 3000");
});
