import React from 'react';
import ReactDOM from 'react-dom';

class GameContainer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {state: "showingAnswers", name: "ad", score: 0};
		this.question = "alue o";
		this.answerTime = 30000;
		this.answers = ["worldwide", "bagool", "MC", "rahlfs"];
		this.startTime = null;
		this.deltaScore = 10;
		this.correctAnswers = [1];
		this.leaderBoard = [{name: "mayhul", score:0}, {name: "asd", score:0}];
		this.nameSubmitted = this.nameSubmitted.bind(this);
		this.nextClicked = this.nextClicked.bind(this);
		this.answerClicked = this.answerClicked.bind(this);
		this.moveToLeaderBoard = this.moveToLeaderBoard.bind(this);
	}

	nameSubmitted(name) {
		var component = this;
		var info = window.location.pathname.split('/');
		var isFirst = info.length == 3;
		var xhttp = new XMLHttpRequest();
		if(isFirst) {
		  xhttp.open("POST", "/waitingForJoin", true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send("name="+name);
			component.setState({state: "showingLink", name: name});
		}
		else {
			xhttp.open("POST", "/joiningGame", true);
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
			xhttp.send("name="+name+"&kahootID="+info[2]+"&otherUser="+info[3]);
			component.setState({state: "waitingForLoad", name: name});
		}
		xhttp.onreadystatechange = function() {
				if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.leaderBoard = response.leaderBoard;
					component.setState({state: "leaderBoard"});
				}
		};
	}

 	nextClicked() {
		var component = this;
		var xhttp = new XMLHttpRequest();
	  xhttp.open("POST", "/nextQuestion", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send();
    xhttp.onreadystatechange = function() {
      	if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.question = response.question;
					component.answers = response.answers;
					component.answerTime = response.answerTime;
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
		component.setState({state: "answerLoading"});
		var endTime = new Date().getTime();
		var timeDiff = endTime - this.startTime;
		var xhttp = new XMLHttpRequest();
	  xhttp.open("POST", "/answerQuestion", true);
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhttp.send("answer="+answer+"&time="+timeDiff);
    xhttp.onreadystatechange = function() {
      	if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
					component.deltaScore = response.deltaScore;
					component.leaderBoard = response.leaderBoard;
					component.correctAnswers = response.correctAnswers;
      		component.setState({state: "answerResult", score: component.state.score + response.deltaScore});
      	}
  	};
	}
	moveToLeaderBoard() {
		this.setState({state: "leaderBoard"});
	}

	render() {
		if(this.state.state == "showingLink") {
			return(<Link></Link>);
		}
		else if(this.state.state == "name") {
			return(<Name nameSubmitted={this.nameSubmitted}></Name>);
		}
		else if(this.state.state == "leaderBoard") {
			return(<LeaderBoard leaderBoard={this.leaderBoard} nextClicked={this.nextClicked}></LeaderBoard>);
		}
		else if(this.state.state == "showingQuestion") {
			return(<Question question={this.question}></Question>);
		}
		else if(this.state.state == "showingAnswers") {
			return(<Answers answerTime={this.answerTime} question={this.question} answers={this.answers} answerClicked={this.answerClicked}></Answers>);
		}
		else if(this.state.state == "answerLoading") {
			return(<AnswerLoading question={this.question} name={this.state.name} score={this.state.score}></AnswerLoading>);
		}
		else if(this.state.state == "answerResult") {
			return(<AnswerResult moveToLeaderBoard={this.moveToLeaderBoard} correctAnswers={this.correctAnswers} deltaScore={this.deltaScore} question={this.question} answers={this.answers} name={this.state.name} score={this.state.score}></AnswerResult>);
		}
		else if(this.state.state == "waitingForLoad") {
			return(<div>Loading</div>);
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
						<button type="button" onClick={() => copyToClipboard(link)}>Copy Link</button>
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
		return (
			<div className="orange">
				<div className="leaderBoardHeader"><span>Scoreboard</span></div>
				<div className="leaderBoardButtonContainer"><button type="button" onClick={() => this.props.nextClicked()}>Next</button></div>
				<table className="leaderBoardTable">
					<tbody>
						<tr className="firstPlace"><td className="nameLeaderBoard">{leaderBoard[0].name}</td><td>{leaderBoard[0].score}</td></tr>
						<tr><td className="nameLeaderBoard">{leaderBoard[1].name}</td><td>{leaderBoard[1].score}</td></tr>
					</tbody>
				</table>
			</div>
		);
	}
}

class Question extends React.Component {
	render() {
		return (
			<div>
				<div className="leaderBoardHeader">
					<span><span className="hideForSmall">Question </span>1 of 29</span>
				</div>
				<div className="questionTimer"><div id="questionTimerPurple"></div></div>
				<div className="questionText">{this.props.question}</div>
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
		var seconds = this.props.answerTime/1000;
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
		var answers = this.props.answers.map(function(answer, index) {
			var colors = ["red", "blue", "yellow", "green"];
			var shapes = ["/triangle.png", "/diamond.png", "/circle.png", "/square.png"];
			return (
				<div className={"answerButton " + colors[index]} key={index} onClick={() => {clearInterval(component.timer); component.props.answerClicked(index);}}>
					<div>
						<img src={shapes[index]} />
						<div><p>{answer}</p></div>
					</div>
				</div>
			);
		});

		return (
			<div>
				<div className="leaderBoardHeader"><span>{this.props.question}</span></div>
				<div className="answerMiddle">
					<div className="answerTimer">{this.state.secondsLeft}</div>
					<div className="questionPicture"><img src="/test.gif"/></div>
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
		return (
			<div className="colorBg loadingContainer">
				<div className="leaderBoardHeader">
					<span className="hideForSmall">{this.props.question}</span>
					<div className="headerUserInfo">
						<p>{this.props.name}</p>
						<div>{this.props.score}</div>
					</div>
				</div>
				<div className="waitingText">
					<div className="spinner">
						<div className="double-bounce1"></div>
						<div className="double-bounce2"></div>
					</div>
					<h1>Were you tooooooo fast?</h1>
				</div>
			</div>
		);
	}
}

class AnswerResult extends React.Component {
	render() {
		var component = this;
		var answers = this.props.answers.map(function(answer, index) {
			var colors = ["red", "blue", "yellow", "green"];
			var shapes = ["/triangle.png", "/diamond.png", "/circle.png", "/square.png"];
			var opacity = component.props.correctAnswers.includes(index) ? "" : "faded";
			var checkMark = component.props.correctAnswers.includes(index) ? "/correct.png" : "";
			return (
				<div className={"answerButton " + colors[index] + " " + opacity} key={index}>
					<div>
						<img src={shapes[index]} />
						<div><p>{answer}</p></div>
						<img className="answerButtonCheck" src={checkMark} />
					</div>
				</div>
			);
		});
		var background = this.props.deltaScore != 0 ? "correctColor" : "incorrectColor";
		var text = this.props.deltaScore != 0 ? "Correct" : "Incorrect";
		var resultImage = this.props.deltaScore != 0 ? "/correct.png" : "/wrong.png";
		var resultText = this.props.deltaScore != 0 ? "+ "+this.props.deltaScore : "Sooooo close.";
		return (
			<div className={background}>
				<div className="leaderBoardHeader">
					<span className="hideForSmall">{this.props.question}</span>
					<div className="headerUserInfo">
						<p>{this.props.name}</p>
						<div>{this.props.score}</div>
					</div>
				</div>
				<div className="leaderBoardButtonContainer"><button type="button" onClick={() => this.props.moveToLeaderBoard()}>Next</button></div>
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
