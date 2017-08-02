require('babel-register');
var express = require('express');
var path = require('path');
var HashMap = require('hashmap');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var Player = require('./player.js');
var app = express();

const PORT=8080;
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var waitingForJoin = new HashMap();
var games = new HashMap();

app.get('/play/:kahootID', function(req, res) {
	var kahootID = req.params.kahootID;
	var user = generateRandomHash();
	res.cookie("playerID", user);
	res.sendFile('game.html', {root : __dirname});
});

app.get('/play/:kahootID/:otherUserCookie', function(req, res) {
	var user = generateRandomHash();
	res.cookie("playerID", user);
	res.sendFile('game.html', {root : __dirname});
});

app.post('/waitingForJoin', function(req, res) {
	var user = req.cookies.playerID;
	var name = req.body.name;
	waitingForJoin.set(user, {name: name, res: res});
});

app.post('/joiningGame', function(req, res) {
	 var user = req.cookies.playerID;
	 var otherUser = req.body.otherUser;
	 var kahootID = req.body.kahootID;
	 var name = req.body.name;
	 var other = waitingForJoin.get(otherUser);
	 console.log(user);
	 console.log(waitingForJoin);
	 console.log(otherUser);

	 var newGame = {kahootID: kahootID, currentQ: 0, waitingPlayer: null};
	 newGame.players = [new Player(name, user, res), new Player(other.name, otherUser, other.res)];
	 waitingForJoin.remove(user);
	 games.set(user, newGame)
	 games.set(otherUser, newGame);
	 sendLeaderBoard(newGame, newGame.players[0]);
	 sendLeaderBoard(newGame, newGame.players[1]);
});

app.post('/nextQuestion', function(req, res) {
	var user = req.cookies.playerID;
	var game = games.get(user);
	getQuestion(game.kahootID, function(question) {
		res.send(JSON.stringify(question));
	});
});

app.post('/answerQuestion', function(req, res) {
	var user = req.cookies.playerID;
	var answer = req.body.answer;
	var time = req.body.time;
	var game = games.get(user);
	var player = game.players[0].ID == user ? game.players[0] : game.players[1];
	player.changeScore(evaluateAnswer(game.kahootID, answer, time));
	player.res = res;

	if(game.waitingPlayer == null) {
		game.waitingPlayer = player;
	}
	else {
		sendLeaderBoard(game, player);
		sendLeaderBoard(game, game.waitingPlayer);
		game.currentQ = game.currentQ + 1;
		game.waitingPlayer = null;
	}
});

function sendLeaderBoard(game, player) {
	var p = game.players;
	var leaderBoard = [{name: p[0].name, score: p[0].score}, {name: p[1].name, score: p[1].score}];
	if(p[1].score > p[0].score)
		leaderBoard = [{name: p[1].name, score: p[1].score}, {name: p[0].name, score: p[0].score}];
	var toSend = {deltaScore: player.deltaScore, leaderBoard: leaderBoard, correctAnswers: [1]};
	player.res.send(JSON.stringify(toSend));
}

function getQuestion(kahootID, callback) {
	callback({question: "What is a cheeta", answerTime: 30000, answers: ["Yes", "No", "Maybe", "Undecided"]});
}

function evaluateAnswer(kahootID, answer, time) {
	return 800;
}

function generateRandomHash() {
	return Math.random().toString(36).slice(2);
}

app.listen(PORT, function(){
    console.log('Server listening');
});
