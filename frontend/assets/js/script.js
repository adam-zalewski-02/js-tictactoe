"use strict"

const ROWS = 3;
const COLS = 3;

document.addEventListener("DOMContentLoaded", init);

function init() {
    const webSocket = new WebSocket("ws://localhost:8080");
    const board = document.getElementById("board");

    for(let i =0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let field = document.createElement('div');
            field.classList.add("field");
            field.dataset.row = i;
            field.dataset.col = j;
            field.addEventListener('click', fieldClicked);
            board.append(field);
        }
    }

    function fieldClicked(e) {
        const row = e.currentTarget.dataset.row;
        const col = e.currentTarget.dataset.col;
        const data = {row: row, col: col};
        webSocket.send(JSON.stringify(data));
    }

    webSocket.addEventListener('message', processIncoming);

}

function setSymbol(row, col, symbol) {
    const field = document.querySelector(`[data-row='${row}'][data-col='${col}']`);
    field.innerHTML = `<img src="assets/images/${symbol}.svg">`;
}

function showMessage(message) {
    document.getElementById('message-box').textContent = message;
}

function processIncoming(event) {
    const message = JSON.parse(event.data);
    switch(message.type) {
        case 'init-game':
            initGame();
            break;
        case 'start-game':
            startGame();
            break;
        case 'move':
            doMove(message);
            break;
        case 'win':
            showMessage('You won!');
            break;
        case 'lost':
            showMessage('You lost!');
            break;
        case 'tie':
            showMessage('Its a tie!');
            break;
    };
}

function initGame() {
    showMessage('Waiting for other player');
}

function startGame() {
    showMessage('You can start playing');
}

function doMove(message) {
    setSymbol(message.row, message.col, message.symbol);
}