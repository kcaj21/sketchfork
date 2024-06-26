const fs = require('fs');
const path = require("path");
const { createPlayer, createGameSession }  = require("../database/database");

const words = fs.readFileSync(path.resolve(__dirname, './words.txt'), 'utf-8').split('\n');

class Game {
    constructor(code, onDelete) {
        this.onDelete = onDelete;
        this.gameCode = code;
        this.status = "SETUP";  // SETUP, WAITING_FOR_PLAYER, DRAWING, RESULTS; 
        this.redTeam = [];
        this.blueTeam = [];
        this.redScore = 0;
        this.blueScore = 0;
        this.numOfRounds = 1;
        this.drawTime = 60;
        this.wordsPerTurn = 5;
        this.currentRoundNum = 1;
        this.isPaused = false;      // could refactor and make this a possible .status
        this.timer = null
        this.currentTeam = ""
        this.TV = null;
        this.Tablet = null;
        this.savedImages = [];
        return this;
    }


    joinGame(socket, role) {
        if (this.Tablet?.id == socket.id) { // ignore tablets reconnecting
            this.sendState();
            return;
        }
        socket.gameCode = this.gameCode;    // add this to the socket for debugging
        socket.role = role;                 // add this to the socket for debugging
        this[role] = socket;
        this.sendState();
        console.log(`a ${role} joined ${this.gameCode}`);

        if (role == "Tablet")
            this.attachTabletListeners();
        if (role == "TV")
            this.attachTVListeners();
    }


    attachTVListeners() {
        this.TV.on("disconnect", (reason) => {
            console.log(`${this.gameCode} TV disconnected: ${reason}`);
            this.TV = null;
            this.sendState();
            setTimeout( () => {
                if (!this.TV)
                    this.onDelete(this.gameCode)
            }, 60000); // set timeout to deletegame if no TV reconnects after 1 min
        });
    }


    attachTabletListeners() {

        this.Tablet.on("disconnect", (reason) => {
            console.log(`${this.gameCode} Tablet disconnected: ${reason}`);
            this.Tablet = null;
            this.sendState();
        });

        this.Tablet.on("pause", () => {
            console.log("receieved a pause command")
            this.isPaused = true;
            this.sendState();
        });

        this.Tablet.on("unpause", () => {
            console.log("receieved a UNpause command")
            this.isPaused = false;
            this.sendState()
        });

        this.Tablet.on('newImageData', (data) => {
            this.TV?.emit('newImageData', data);
        });

        this.Tablet.on('newContextData', (data) => {
            this.TV?.emit('newContextData', data);
        });

        this.Tablet.on('tabletDimensions', (data) => {
            this.TV?.emit('tabletDimensions', data);
        });

        this.Tablet.on('onMouseDown', (data) => {
            this.TV?.emit('onMouseDown', data);
        });
        
        this.Tablet.on('onMouseMove', (data) => {
            this.TV?.emit('onMouseMove', data);
        });

        this.Tablet.on('onMouseUp', () => {
            this.TV?.emit('onMouseUp');
        });
        
        this.Tablet.on('clearCanvas', () => {
            this.TV?.emit('clearCanvas');
        });

        this.Tablet.on('startGame', () => {
            console.log("receieved start game request " + this.gameCode);
            this.startGame();
            this.sendState();
        });

        this.Tablet.on('incrementRed', () => {
            this.redTeam[this.redTeam.findIndex(player => player.name === this.currentPlayer)].score++;
            this.redScore++;
            this.sendState();
        });

        this.Tablet.on('incrementBlue', () => {
            this.blueTeam[this.blueTeam.findIndex(player => player.name === this.currentPlayer)].score++;
            this.blueScore++;   
            this.sendState()
        });

        this.Tablet.on('savedImage', (colour, player, word, imageData) => {
            this.savedImages.push({ colour, player, word, imageData });
        });

        this.Tablet.on('settings', (settings) => {
            this.numOfRounds = settings.numRounds;
            this.drawTime = settings.drawTime;
            this.wordsPerTurn = settings.wordsPerTurn;
            this.redTeam = settings.redTeam;
            this.blueTeam = settings.blueTeam;
            this.sendState()
        });

        this.Tablet.on("turnFinished", () => {
            console.log(`${this.gameCode} ${this.currentPlayer}'s turn finished early`); //changed this.player to this.currentPlayer on this line as this.player was console logging as undefined
            this.stopTimer();    

            this.sendState();
            this.turnResolve();
        });

        this.Tablet.on("startDrawing", () => {
            console.log(`${this.gameCode} ${this.currentPlayer} hit start`);
            this.status = "DRAWING";
            this.drawTimeLeft = this.drawTime;
            this.sendState();
            this.startTimer(this.currentPlayer, () => {
                console.log(`${this.gameCode} ${this.currentPlayer}'s turn finished`);
                this.stopTimer();
                this.sendState();
                this.turnResolve();
            });
        });

        this.Tablet.on("updateWordGuesses", words => {
            this.turnWords = words;
            this.sendState();
        });

    }

    async startGame() {
        for (this.currentRoundNum; this.currentRoundNum <= this.numOfRounds; this.currentRoundNum++) {
            console.log(`${this.gameCode} round ${this.currentRoundNum} of ${this.numOfRounds} started`)
            await this.playRound();
            console.log(`${this.gameCode} round ${this.currentRoundNum} finished`)
        }
        this.endGame();
    }

    async playRound() {  

        const redPlayers = this.redTeam.slice();
        const bluePlayers = this.blueTeam.slice();
        console.log(redPlayers)
        console.log(bluePlayers)

        while (redPlayers.length > 0 || bluePlayers.length > 0) {
            if (redPlayers.length > 0)
                this.currentTeam = 'red'
                await this.takeTurn(redPlayers.shift()); 
            if (bluePlayers.length > 0)
                this.currentTeam = 'blue'
                await this.takeTurn(bluePlayers.shift());
        }
    }

    async takeTurn(player) {
        console.log(`selected ${player.name}`);
        this.currentPlayer = player.name;
        const words = Game.getRandomWordArray(this.wordsPerTurn)
        this.turnWords = words.map(w => ({ word: w, guess: "unattempted" }))
        this.status = "WAITING_FOR_PLAYER";
        this.sendState();
        this.TV?.emit('clearCanvas');
        await new Promise(resolve => this.turnResolve = resolve);
    }

    endGame() {
        console.log(this.gameCode + " game ended")
        this.status = "RESULTS";
        createGameSession(this.gameCode, this.redScore, this.blueScore)
        this.redTeam.forEach((player) => createPlayer(player.name, player.score, player.fastest_round, this.gameCode))
        this.blueTeam.forEach((player) => createPlayer(player.name, player.score, player.fastest_round, this.gameCode))
        this.sendState()
    }

    startTimer(player, callback) {
        let startTime = Date.now();
        let elapsedTime = 0;

        const timerCallback = () => {
            if (!this.isPaused) {
                elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                this.drawTimeLeft = this.drawTime - elapsedTime;
                if (elapsedTime > this.drawTime) {
                    console.log(`${this.gameCode} ${player} ran out of time`);
                    this.sendState();
                    callback();
                } else {
                    this.timer = setTimeout(timerCallback, 1000);
                }
            } else {
                // account for the time spent paused
                startTime = Date.now() - (elapsedTime * 1000);
                this.timer = setTimeout(timerCallback, 1000);
            }
        };
        this.timer = setTimeout(timerCallback, 1000);
    }

    assignFastestRound(){
        if (this.currentTeam == 'red' && this.redTeam[this.redTeam.findIndex(player => player.name === this.currentPlayer)].fastest_round > (this.drawTime - this.drawTimeLeft)) {
            this.redTeam[this.redTeam.findIndex(player => player.name === this.currentPlayer)].fastest_round = this.drawTime - this.drawTimeLeft;
            
        } else if (this.currentTeam == 'blue' && this.blueTeam[this.blueTeam.findIndex(player => player.name === this.currentPlayer)].fastest_round > (this.drawTime - this.drawTimeLeft)) {
            this.blueTeam[this.blueTeam.findIndex(player => player.name === this.currentPlayer)].fastest_round = this.drawTime - this.drawTimeLeft;
        }

    }

    stopTimer() {

        this.assignFastestRound()

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }


    sendState() {
        if (this.TV)
            this.TV.emit('gameState', this.toString());
        if (this.Tablet)
            this.Tablet.emit('gameState', this.toString());
    }


    dispose() {
        this.stopTimer();
        this.TV = null;
        this.Tablet = null;
        this.savedImages = [];
    }


    // printing a socket out to console or the response parser throws a circular
    // JSON error so use this to replace the socket object with its id
    toString() {
        const temp = { ...this }
        if (temp.TV)
            temp.TV = temp.TV.id;
        if (temp.Tablet)
            temp.Tablet = temp.Tablet.id;
        if (temp.timer)
            temp.timer = null;
        if (temp.savedImages) // don't want to send images back to the clients during a game
            temp.savedImages = temp.savedImages.length;
        return temp;
    }


    static getRandomWordArray(length) {
        const arr = [];
        while (arr.length < length) {
            const word = Game.getRandomWord()
            if (!arr.includes(word))
                arr.push(word);
        }
        return arr;
    }


    static getRandomWord() {
        return words[Math.floor(Math.random() * words.length)].trim()
    }


    static generateCode() {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        let code = ""
        while (code.length < 4)
            code += chars[Math.floor(Math.random() * chars.length)]
        return code;
    }

}


module.exports = Game;
