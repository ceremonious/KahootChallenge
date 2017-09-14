import React from 'react';
import ReactDOM from 'react-dom';

class GameContainer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {state: "name", name: null, score: 0};
		this.questionInfo = {image: null, question: null, answerTime: null, answers: null, currentQ: 0, totalQ: null};
		//this.questionInfo = {image: null, question: "test question", answerTime: 1000000, answers: ["a", "B", "c", "Daldjsfalsdjfalsdjfalksdjfalksdjflaksdjflasjdflkasjdflkasjfla"], currentQ: 1, totalQ: 3};
		this.lastAnswer = null;
		this.startTime = null;
		this.timeDiff = null;
		this.answerInfo = {deltaScore: null, correctAnswers: null, leaderBoard: null};
		this.nameSubmitted = this.nameSubmitted.bind(this);
		this.nextClicked = this.nextClicked.bind(this);
		this.answerClicked = this.answerClicked.bind(this);
		this.moveToLeaderBoard = this.moveToLeaderBoard.bind(this);
	}

	nameSubmitted(name) {
		if(name == "") {
			return;
		}
		var component = this;
		var info = window.location.pathname.split('/');
		var isFirst = info.length == 3;
		var xhttp = new XMLHttpRequest();
		if(isFirst) {
		  xhttp.open("POST", "/waitingForJoin", true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send("name="+name+"&kahootID="+info[2]);
			component.setState({state: "showingLink", name: name});
		}
		else {
			xhttp.open("POST", "/joiningGame", true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send("name="+name+"&otherUser="+info[3]);
			component.setState({state: "waitingForLoad", name: name});
		}
		component.setTimeout(xhttp, 7200000);
		xhttp.onreadystatechange = function() {
				if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.answerInfo.leaderBoard = response.leaderBoard;
					component.setState({state: "leaderBoard"});
				}
				if(xhttp.readyState == 4 && xhttp.status == 400) {
					component.setState({state: "invalidGame"});
				}
		};
	}

 	nextClicked() {
		var component = this;
		var xhttp = new XMLHttpRequest();
	  xhttp.open("POST", "/nextQuestion", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send();
		component.setTimeout(xhttp, 900000);
    xhttp.onreadystatechange = function() {
      	if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.questionInfo = response;
      		component.setState({state: "showingQuestion"});
					setTimeout(function() {
						component.setState({state: "showingAnswers"});
						component.startTime = new Date().getTime();
					}, 4000);
      	}
  	};
	}
	answerClicked(answer) {
		var component = this;
		component.lastAnswer = answer;
		component.setState({state: "answerLoading"});
		var endTime = new Date().getTime();
		component.timeDiff = endTime - this.startTime;
		var xhttp = new XMLHttpRequest();
	  xhttp.open("POST", "/answerQuestion", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send("answer="+answer+"&time="+component.timeDiff);
		component.setTimeout(xhttp, 900000);
    xhttp.onreadystatechange = function() {
      	if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.answerInfo = response;
      		component.setState({state: "answerResult", score: component.state.score + response.deltaScore});
      	}
  	};
	}
	moveToLeaderBoard() {
		this.setState({state: "leaderBoard"});
	}
	setTimeout(xhttp, amount) {
		xhttp.timeout = amount;
		xhttp.ontimeout = () => this.setState({state: "timeout"});
	}

	render() {
		if(this.state.state == "showingLink") {
			return(<Link></Link>);
		}
		else if(this.state.state == "invalidGame") {
			return(<InvalidGame></InvalidGame>);
		}
		else if(this.state.state == "name") {
			return(<Name nameSubmitted={this.nameSubmitted}></Name>);
		}
		else if(this.state.state == "leaderBoard") {
			return(<LeaderBoard leaderBoard={this.answerInfo.leaderBoard} gameOver={this.questionInfo.currentQ == this.questionInfo.totalQ} nextClicked={this.nextClicked}></LeaderBoard>);
		}
		else if(this.state.state == "showingQuestion") {
			return(<Question questionInfo={this.questionInfo}></Question>);
		}
		else if(this.state.state == "showingAnswers") {
			return(<Answers questionInfo={this.questionInfo} answerClicked={this.answerClicked}></Answers>);
		}
		else if(this.state.state == "answerLoading") {
			return(<AnswerLoading timeDiff={this.timeDiff}></AnswerLoading>);
		}
		else if(this.state.state == "answerResult") {
			return(<AnswerResult moveToLeaderBoard={this.moveToLeaderBoard} answerInfo={this.answerInfo} questionInfo={this.questionInfo} name={this.state.name} score={this.state.score} lastAnswer={this.lastAnswer}></AnswerResult>);
		}
		else if(this.state.state == "waitingForLoad") {
			return(<div>Loading</div>);
		}
		else if(this.state.state == "timeout") {
			return(<div>Time out</div>);
		}
 	}
}

class Link extends React.Component {
	render() {
		var url = window.location.href;
		var cookie = document.cookie.match(new RegExp("playerID" + '=([^;]+)'))[1];
		var link = url + "/" + cookie;
		return (
			<div className="colorBg">
				<div className="centerBlock">
						<div><span>Kahoot!</span></div>
						<p>Share this link with a friend:<br/>{link}</p>
						<button type="button" onClick={() => copyToClipboard(link)}>
							Copy Link
						</button>
				</div>
			</div>
		);
	}
}

class InvalidGame extends React.Component {
	render() {
		return (
			<div className="colorBg">
				<div className="centerBlock">
						<div><span>Kahoot!</span></div>
						<p>Sorry! This game does not exist. Double check your link.</p>
				</div>
			</div>
		);
	}
}

class Name extends React.Component {
	render() {
		return (
			<div className="colorBg">
				<div className="centerBlock">
						<div><span>Kahoot!</span></div>
						<input id="nameInput" type="text" placeholder="Choose a name"/>
						<button type="button" onClick={() => this.props.nameSubmitted(document.getElementById("nameInput").value)}>Enter</button>
				</div>
			</div>
		);
	}
}

class LeaderBoard extends React.Component {
	render() {
		var leaderBoard = this.props.leaderBoard;
		var nextHidden = this.props.gameOver ? " hidden" : "";
		var playAgainHidden = this.props.gameOver ? "" : " hidden";
		var winnerText = "";
		if(this.props.gameOver) {
			if(leaderBoard[0].score == leaderBoard[1].score)
				winnerText = "It's a tie!";
			else
				winnerText = leaderBoard[0].name + " wins!";
		}
		return (
			<div className="orange">
				<div className="leaderBoardHeader"><span>Scoreboard</span></div>
				<div className={"leaderBoardButtonContainer" + nextHidden}><button type="button" onClick={() => this.props.nextClicked()}>Next</button></div>
				<p className="winnerText">{winnerText}</p>
				<table className="leaderBoardTable">
					<tbody>
						<tr className="firstPlace"><td className="nameLeaderBoard">{leaderBoard[0].name}</td><td>{leaderBoard[0].score}</td></tr>
						<tr><td className="nameLeaderBoard">{leaderBoard[1].name}</td><td>{leaderBoard[1].score}</td></tr>
					</tbody>
				</table>
				<button className={"playAgainButton" + playAgainHidden} type="button" onClick={() => window.location.href="/index.html"}>Play Another</button>
			</div>
		);
	}
}

class Question extends React.Component {
	render() {
		return (
			<div>
				<div className="leaderBoardHeader">
					<span><span className="hideForSmall">Question </span>{this.props.questionInfo.currentQ} of {this.props.questionInfo.totalQ}</span>
				</div>
				<div className="questionTimer"><div id="questionTimerPurple"></div></div>
				<div className="questionText" dangerouslySetInnerHTML={{__html: this.props.questionInfo.question}}></div>
				<div className="questionFooter">Win up to 1,000 points!</div>
			</div>
		);
	}

	componentDidMount() {
		var elem = document.getElementById("questionTimerPurple");
		var width = 0;
		var id;
		setTimeout(function() {
			id = setInterval(frame, 18);
		}, 1000);
		function frame() {
				if (width >= 100) {
					clearInterval(id);
				}
				else {
					width = width + 0.5;
					elem.style.width = width + '%';
				}
		}
	}
}

class Answers extends React.Component {
	constructor(props) {
		super(props);
		var seconds = this.props.questionInfo.answerTime/1000;
		this.state = {secondsLeft: seconds};
		var component = this;
		this.timer = setInterval(function() {
			if(component.state.secondsLeft == 0) {
				clearInterval(component.timer);
				component.props.answerClicked(null);
			}
			else {
				component.setState({secondsLeft: component.state.secondsLeft - 1});
			}
		}, 1000);
	}

	render() {
		var component = this;
		var answers = this.props.questionInfo.answers.map(function(answer, index) {
			var colors = ["red", "blue", "yellow", "green"];
			var shapes = ["/triangle.png", "/diamond.png", "/circle.png", "/square.png"];
			return (
				<div className={"answerButton " + colors[index]} key={index} onClick={() => {clearInterval(component.timer); component.props.answerClicked(index);}}>
					<img className="answerShape" src={shapes[index]} />
					<p dangerouslySetInnerHTML={{__html: answer}}></p>
				</div>
			);
		});
		var image = this.props.questionInfo.image ? this.props.questionInfo.image : "/test.gif";
		var hideImage = this.props.questionInfo.image ? "" : "hideForSmall";

		return (
			<div>
				<div className="leaderBoardHeader questionHeader">
					<div className="answerTimerSmall">{this.state.secondsLeft}</div>
					<div className="questionHeaderText" dangerouslySetInnerHTML={{__html: this.props.questionInfo.question}}></div>
				</div>
				<div className={"answerMiddle " + hideImage}>
					<div className="answerTimer hideForSmall">{this.state.secondsLeft}</div>
					<div className="questionPicture"><img src={image}/></div>
				</div>
				<div className="answerContainer">
					{answers}
				</div>
			</div>
		);
	}
}

class AnswerLoading extends React.Component {
	render() {
		var phrase = null;
		var phrases = ["Secret classroom superpowers?", "Pure genius or guesswork?", "Just snuck in?", "Lightning smart?", "Genius machine?"];
		if(this.props.timeDiff < 1000 && Math.random() < 0.6) {
			phrase = "Were you tooooooo fast?";
		}
		else {
			phrase = phrases[Math.floor(Math.random()*phrases.length)];
		}
		return (
			<div className="colorBg loadingContainer">
				<div className="waitingText">
					<div className="spinner">
						<div className="double-bounce1"></div>
						<div className="double-bounce2"></div>
					</div>
					<h1>{phrase}</h1>
				</div>
			</div>
		);
	}
}

class AnswerResult extends React.Component {
	render() {
		var component = this;
		var answers = this.props.questionInfo.answers.map(function(answer, index) {
			var colors = ["red", "blue", "yellow", "green"];
			var shapes = ["/triangle.png", "/diamond.png", "/circle.png", "/square.png"];
			var opacity = component.props.answerInfo.correctAnswers.includes(index) ? "" : "faded";
			var checkMark = component.props.answerInfo.correctAnswers.includes(index) ? "/correct.png" : "";
			var yourAnswer = component.props.lastAnswer == index ? (<div className="circleLabel yourAnswer"><span>Your Answer</span></div>) : "";
			var theirAnswer = component.props.answerInfo.otherAnswer == index ? (<div className="circleLabel theirAnswer"><span>Their Answer</span></div>) : "";
			return (
				<div className={"answerButton " + colors[index] + " " + opacity} key={index}>
						<img className={"answerShape" + " " + opacity} src={shapes[index]} />
						<p className={opacity} dangerouslySetInnerHTML={{__html: answer}}></p>
						<div className="checkContainer">
							{yourAnswer}
							{theirAnswer}
							<img className={opacity} src={checkMark} />
						</div>
				</div>
			);
		});

		var deltaScore = this.props.answerInfo.deltaScore;
		var background = deltaScore != 0 ? "correctColor" : "incorrectColor";
		var text = deltaScore != 0 ? "Correct" : "Incorrect";
		var resultImage = deltaScore != 0 ? "/correct.png" : "/wrong.png";
		var resultText = deltaScore != 0 ? "+ "+deltaScore : "Sooooo close.";
		return (
			<div className={background}>
				<div className="leaderBoardHeader questionHeader" dangerouslySetInnerHTML={{__html: this.props.questionInfo.question}}>
				</div>
				<div className="leaderBoardButtonContainer answerResultButton"><button type="button" onClick={() => this.props.moveToLeaderBoard()}>Next</button></div>
				<div className="resultMiddle">
					<div className="resultText">{text}</div>
					<img src={resultImage} />
					<div className={"resultBox " + background}>{resultText}</div>
				</div>
				<div className="answerContainer">
					{answers}
				</div>
			</div>
		);
	}
}

ReactDOM.render(<GameContainer/>, document.getElementById('gameContainer'));
