// Imports
import $ from 'jquery';
import './css/base.scss';
import './css/normalize.css';
import Game from './game'
import Player from './player'
import domUpdates from './domUpdates'
import Round from './round';
import BonusRound from './bonusRound'
import Turn from './turn';

// Event Listeners
let game, round, turn, players, bonusRound;

function getData() {
  fetch('https://fe-apps.herokuapp.com/api/v1/gametime/1903/wheel-of-fortune/data')
    .then(data => data.json())
    .then(data => startNewGame(data.data))
}

$('.button--start').click(() => {
  getData();
});

function startNewGame(parsedData) {
  players = instantiatePlayers();
  // make new game
  game = new Game(players, parsedData);
  // generate a new puzzlebank  
  game.generatePuzzleBank();
  // start a new round
  round = new Round(game);
  // bonusRound = new BonusRound(game);
  // pick a puzzle
  round.choosePuzzle();
  // generate new wheel
  round.randomizeWheel();
  // start first players turn
  turn = new Turn(round);
  // update DOM
  domUpdates.fadeOutIntroPage();
  domUpdates.appendPlayerInfo(players);
  domUpdates.displayPuzzle(round.currentPuzzle);
  domUpdates.displayWheel(round.wheelData);
  domUpdates.displayRound(game.currentRound)
}

function instantiatePlayers() {
  let players = [];
  players.push(
    new Player(1, $('.input--player-1').val() || 'Player 1'),
    new Player(2, $('.input--player-2').val() || 'Player 2'),
    new Player(3, $('.input--player-3').val() || 'Player 3')
  )
  return players;
}

$('.button--solve').click(() => {
  domUpdates.toggleButton($('.button--solve-puzzle'), false);
  domUpdates.displaySolveModal();
});

$('.button--solve-puzzle').click(() => {
  if (game.currentRound === 2) {
    domUpdates.toggleButton($('.button--solve-puzzle'), true);
    let guess = $('.input--solve-puzzle').val();
    let isCorrect = bonusRound.solveBonusPuzzle(guess);
    if (isCorrect) {
      $('.input--solve-puzzle').val('Correct');
      $('.player-end').text(`Congratulations ${bonusRound.players[bonusRound.currentPlayer].name}! You won ${bonusRound.players[bonusRound.currentPlayer].gameScore}!`);
      domUpdates.fadeInEndPage();
    } else {
      $('.input--solve-puzzle').val('Incorrect').css('color', 'red');
      $('.player-end').text(`Congratulations ${bonusRound.players[bonusRound.currentPlayer].name}! You won ${bonusRound.players[bonusRound.currentPlayer].gameScore}!`);
      domUpdates.fadeInEndPage();
    }
  } else {
    domUpdates.toggleButton($('.button--solve-puzzle'), true);
    let guess = $('.input--solve-puzzle').val();
    let isCorrect = turn.solvePuzzle(guess);
    if (isCorrect) {
      $('.input--solve-puzzle').val('You live for now');
      startBonusRound();
    } else {
      $('.input--solve-puzzle').val('Better luck next time').css('color', 'red');
    }
  }
    setTimeout(function () {
      domUpdates.hideSolveModal();
    }, 3000);
});

$('.button--vowel').click(() => {
  domUpdates.toggleButton($('.button--spin'), true);
  domUpdates.toggleButton($('.button--solve'), true);
  domUpdates.enableVowels();
});

$('.vowel').click((event) => {
  if (game.currentRound === 5) {
    bonusRound.counter++;
    bonusRound.guessBonusVowel(event.target.innerText);
    if (bonusRound.counter === 1) {
      domUpdates.disableVowels(event.target);
      $('.button--solve').attr("disabled", false);
      domUpdates.toggleButton($('.button--vowel'), false);
    }
  } else {
  turn.buyVowel(event.target.innerText);
  domUpdates.disableVowels(event.target);
  domUpdates.toggleButton($('.button--solve'), false);
  domUpdates.toggleButton($('.button--spin'), false);
  }
});

$('.button--spin').click(() => {
  if (game.currentRound === 5) {
    domUpdates.toggleButton($('.button--vowel'), true);
    domUpdates.toggleButton($('.button--solve'), true);
    domUpdates.toggleButton($('.button--spin'), true);
    bonusRound.spinBonusWheel();
  } else {
    domUpdates.toggleButton($('.button--vowel'), true);
    domUpdates.toggleButton($('.button--solve'), true);
    domUpdates.toggleButton($('.button--spin'), true);
    turn.spinWheel();
  }
});

$('.consonant').click((event) => {
  if (game.currentRound === 5) {
    bonusRound.counter++;
    bonusRound.guessBonusConsonant(event.target.innerText);
    if (bonusRound.counter === 3) {
      domUpdates.disableConsonant(event.target);
      domUpdates.enableVowels();
      $('.button--vowel').attr("disabled", true);
      bonusRound.counter = 0;
    }
  } else {
  turn.guessConsonant(event.target.innerText);
  domUpdates.disableConsonant(event.target);
  domUpdates.toggleButton($('.button--spin'), false);
  domUpdates.toggleButton($('.button--solve'), false);
  }
});

$('.button--reset').click(() => {
  resetGame();
});

function resetGame() {
  domUpdates.changeCurrentPlayer(round.getCurrentPlayer().id);
  getData();
  domUpdates.changeCurrentPlayer(round.getCurrentPlayer().id);
  domUpdates.resetLetters();
}

$('.button--quit').click(() => {
  quitGame();
});

function quitGame() {
  domUpdates.fadeInQuitPage();
}

$('.button--new-game').click(() => {
  resetGame();
  domUpdates.fadeInIntroPage();
});

$('.button--go-back').click(() => {
  domUpdates.fadeOutQuitPage();
});

function startBonusRound() {
  if (game.currentRound === 5) {
    domUpdates.changeCurrentPlayer(turn.player.id);
    bonusRound = new BonusRound(game);
    turn = new Turn(bonusRound);
    turn.player = bonusRound.findWinner();
    bonusRound.createBonusWheel();
    domUpdates.changeCurrentPlayer(turn.player.id);
    domUpdates.displayRound('Bonus');
    game.generateBonusPuzzle();
    bonusRound.randomizeWheel();
    domUpdates.displayPuzzle(game.bonusPuzzle);
    domUpdates.displayWheel(bonusRound.bonusWheel);
    bonusRound.displayGivenLetters();
  } else {
    domUpdates.displayRound(game.currentRound)
    round.choosePuzzle();
    round.randomizeWheel();
    domUpdates.displayPuzzle(round.currentPuzzle);
    domUpdates.displayWheel(round.wheelData);
    turn = new Turn(round);
  }
}