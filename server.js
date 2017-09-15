require('babel-register');
var express = require('express');
var path = require('path');
var HashMap = require('hashmap');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var crypto = require("crypto");
var Player = require('./player.js');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var kahoots = null;
var KAHOOT_COUNT = 0;

MongoClient.connect('mongodb://localhost:27017/KahootChallenge', function(err,database) {
    kahoots = database.collection("Kahoots");
    kahoots.count({}, function(err, count) {
      KAHOOT_COUNT = count;
    });
})
const PORT=8080;
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

var waitingForJoin = new HashMap();
var games = new HashMap();

app.get('/play/:kahootID', function(req, res) {
	var user = generateRandomHash();
	res.cookie("playerID", user);
	res.sendFile('game.html', {root : __dirname});
});

app.get('/play/:kahootID/:otherUserCookie', function(req, res) {
  if(req.cookies.playerID == req.params.otherUserCookie) {
    res.send("Send the link to a friend.");
  }
  else {
    var user = generateRandomHash();
    res.cookie("playerID", user);
    res.sendFile('game.html', {root : __dirname});
  }
});

app.post('/getKahoots', function(req, res) {
  var skip = (req.body.page - 1) * 30;
  kahoots.find().sort({index: 1}).skip(skip).limit(30).toArray(function(err, result) {
    var kahoots = [];
    for (var i = 0; i < result.length; i++) {
      kahoots.push({cover: result[i].cover, username: result[i].creator_username,
        title: result[i].title, description: result[i].description,
        numQuestions: result[i].questions.length, index: result[i].index});
    }
    res.send(JSON.stringify({kahoots: kahoots, hasMore: skip < KAHOOT_COUNT}));
  });
});

app.post('/searchKahoots', function(req, res) {
  var val = req.body.searchVal;
  var regex = new RegExp(val, "i");
  kahoots.find({$or: [{title: regex}, {description: regex}]}).sort({index: 1}).toArray(function(err, result) {
    var kahoots = [];
    for (var i = 0; i < result.length; i++) {
      kahoots.push({cover: result[i].cover, username: result[i].creator_username,
        title: result[i].title, description: result[i].description,
        numQuestions: result[i].questions.length, index: result[i].index});
    }
    res.send(JSON.stringify(kahoots));
  });
});

app.post('/waitingForJoin', function(req, res) {
	var user = req.cookies.playerID;
	var name = req.body.name;
  var kahootID = parseInt(req.body.kahootID);
	waitingForJoin.set(user, {name: name, res: res, kahootID: kahootID, createTime: Date.now()});
});

app.post('/joiningGame', function(req, res) {
	 var user = req.cookies.playerID;
	 var otherUser = req.body.otherUser;
	 var name = req.body.name;
	 var other = waitingForJoin.get(otherUser);
	 if(!other) {
		 res.status(400);
		 res.send("Game not found");
		 return;
	 }
   var kahootID = other.kahootID;
	 console.log(user);
	 console.log(waitingForJoin);
	 console.log(otherUser);

	 getQuestionCount(kahootID, function(qCount) {
		 var newGame = {kahootID: kahootID, currentQ: 1, totalQ: qCount, waitingPlayer: null, createTime: Date.now()};
		 newGame.players = [new Player(name, user, res), new Player(other.name, otherUser, other.res)];
		 waitingForJoin.remove(user);
		 games.set(user, newGame)
		 games.set(otherUser, newGame);
		 sendLeaderBoard(newGame, null, newGame.players[0]);
		 sendLeaderBoard(newGame, null, newGame.players[1]);
	 });
});

app.post('/nextQuestion', function(req, res) {
	var user = req.cookies.playerID;
	var game = games.get(user);
	getQuestion(game.kahootID, game.currentQ, game.totalQ, function(question) {
		res.send(JSON.stringify(question));
	});
});

app.post('/answerQuestion', function(req, res) {
	var user = req.cookies.playerID;
	var answer = req.body.answer;
	var time = req.body.time;
	var game = games.get(user);
	var player = game.players[0].ID == user ? game.players[0] : game.players[1];
	evaluateAnswer(game.kahootID, game.currentQ, answer, time, function(deltaScore, correctAnswers) {
		player.changeScore(deltaScore, answer);
		player.res = res;

		if(game.waitingPlayer == null) {
			game.waitingPlayer = player;
		}
		else {
			sendLeaderBoard(game, correctAnswers, player, game.waitingPlayer.lastAnswer);
			sendLeaderBoard(game, correctAnswers, game.waitingPlayer, player.lastAnswer);
			game.currentQ = game.currentQ + 1;
			game.waitingPlayer = null;
		}
	});
});

function sendLeaderBoard(game, correctAnswers, player, otherAnswer) {
	var p = game.players;
	var leaderBoard = [{name: p[0].name, score: p[0].score}, {name: p[1].name, score: p[1].score}];
	if(p[1].score > p[0].score)
		leaderBoard = [{name: p[1].name, score: p[1].score}, {name: p[0].name, score: p[0].score}];
	var toSend = {deltaScore: player.deltaScore, leaderBoard: leaderBoard, correctAnswers: correctAnswers, otherAnswer: otherAnswer};
	player.res.send(JSON.stringify(toSend));
}

function getQuestionCount(kahootID, callback) {
	var query = {index: kahootID};
	kahoots.find(query).toArray(function (err, result) {
		console.log(kahootID);
		callback(result[0].questions.length);
	});
}

function getQuestion(kahootID, qNum, totalQ, callback) {
	var query = {index: kahootID};
	kahoots.find(query).toArray(function (err, result) {
		var qInfo = result[0].questions[qNum - 1];
		var answers = qInfo.choices.map((ans) => ans.answer);
		callback({question: qInfo.question, answerTime: qInfo.time, answers: answers, currentQ: qNum, totalQ: totalQ, image: qInfo.image});
	});
}

function evaluateAnswer(kahootID, currentQ, answer, time, callback) {
	var query = {index: kahootID};
	kahoots.find(query).toArray(function (err, result) {
		var correctAnswers = [];
		var choices = result[0].questions[currentQ - 1].choices;
		for(var i = 0; i < choices.length; i++)
			if(choices[i].correct) correctAnswers.push(i);
    var correct = false;
    if(answer != null && answer != "null")
      correct = choices[answer].correct;
		if(correct) {
			var totalTime = result[0].questions[currentQ - 1].time;
			if(time < 500) {
				callback(1000, correctAnswers);
			}
			else {
				var deltaScore = Math.round(1000 * (1 - ((time/totalTime) / 2)));
				callback(deltaScore, correctAnswers);
			}
		}
		else {
			callback(0, correctAnswers);
		}
	});
}

function generateRandomHash() {
  return crypto.randomBytes(3).toString('hex');
}

setInterval(function() {
  var values = games.values();
  values.forEach(function(game) {
    //Game deleted after 2 hours
    if(Date.now() - game.createTime > 7200000) {
      games.delete(games.search(game));
    }
  });
}, 1800000);
setInterval(function() {
  var values = waitingForJoin.values();
  values.forEach(function(waitingToJoin) {
    //waitingToJoin deleted after 2 hours
    if(Date.now() - waitingToJoin.createTime > 7200000) {
      waitingForJoin.delete(waitingForJoin.search(waitingToJoin));
    }
  });
}, 1740000);

app.listen(PORT, function(){
    console.log('Server listening');
});
