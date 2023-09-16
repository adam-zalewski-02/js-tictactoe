import { WebSocketServer } from 'ws';
const wss = new WebSocketServer({ port: 8080 });

const ROWS = 3;
const COLS = 3;
const FIRSTPLAYERSYMBOL = 'x';
const SECONDPLAYERSYMBOL = 'o';
const allEqualandNotEmpty = arr => arr[0] !== undefined && arr.every(el => el === arr[0]);

class Game {

    constructor() {
        this.players = [];
        this.currentPlayer = undefined;

        this.nrOfMoves = 0;
        this.finished = false;
        this.winner = undefined;

        this.board = Array.from(Array(ROWS), () => new Array(COLS).fill(undefined))
    }

    getRow = row => this.board[row];
    getColumn = col => this.board.map(row => row[col]);
    getPrimaryDiagonal = () => this.board.map((row, index) => row[index]);
    getSecondaryDiagonal = () => this.board.map((row, index) => row[COLS - 1 - index]);


    addPlayer(player) {
        this.players.push(player);

        if (this.players.length == 2) {
            this.players.forEach(player => player.startGame());
        } else {
            this.currentPlayer = player;
        }
    }

    doMove(player, row, col) {
        if (player != this.currentPlayer) return;
        if (this.board[row][col] !== undefined) return;

        this.board[row][col] = player.symbol;
        this.nrOfMoves += 1;

        const data = {
            type: 'move',
            row: row,
            col: col,
            symbol: player.symbol
        }
        this.players.forEach(player => player.sendMessage(data));        
        this.currentPlayer = this.currentPlayer.getOpponent();

        this.checkWinner(player, row, col);
        this.finished = this.winner !== undefined || this.nrOfMoves === ROWS * COLS;
    }

    checkWinner(player, row, col) {
        const tocheck = [this.getRow(row), 
                        this.getColumn(col), 
                        this.getPrimaryDiagonal(), 
                        this.getSecondaryDiagonal()];

        const hasWon = tocheck.some(allEqualandNotEmpty);
        if (hasWon) this.winner = player;
    }
}

class Player {

    constructor(symbol, game, conn) {
        this.symbol = symbol;
        this.game = game;
        this.conn = conn;
        this.sendMessage({type: 'init-game', symbol: this.symbol});
        game.addPlayer(this);
    }

    startGame() {
        this.sendMessage({type: 'start-game'});
    }

    getOpponent() {
        return this.game.players.filter(el => el !== this)[0];
    }

    doMove(message) {
        if (this.game.players.length !== 2) return;
        if (this.game.finished) return;

        this.game.doMove(this, message.row, message.col);

        if (this.game.winner === this) {
            this.wins();
            this.getOpponent().lost();
        } else if (this.game.finished) {
            this.tie();
            this.getOpponent().tie();
        }
    }

    wins() {
        this.sendMessage({type: 'win'});
    }

    lost() {
        this.sendMessage({type: 'lost'});
    }

    tie() {
        this.sendMessage({type: 'tie'});
    }

    sendMessage(data) {
        this.conn.send(JSON.stringify(data));
    }
}

function getConnectionListener() {
    let waitingGame = null;
    return function(ws) {
        let player, game;

        if (waitingGame === null) {
            game = new Game();
            player = new Player(FIRSTPLAYERSYMBOL, game, ws);
            waitingGame = game;
        } else {
            game = waitingGame;
            player = new Player(SECONDPLAYERSYMBOL, game, ws);
            waitingGame = null;
        }

        ws.on('message', message => {
            const data = JSON.parse(message);
            player.doMove(data);
        })
        
    }
}

wss.on('connection', getConnectionListener());