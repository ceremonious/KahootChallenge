import React from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';

class GameCardContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {kahoots: [], hasMoreItems: true};
  }

  loadItems(page) {
    var component = this;
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/getKahoots", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("page="+page);
    xhttp.onreadystatechange = function() {
		    if(xhttp.readyState == 4 && xhttp.status == 200) {
					var response = JSON.parse(xhttp.responseText);
          component.setState({kahoots: component.state.kahoots.concat(response.kahoots),
            hasMoreItems: response.hasMore});
				}
		};
  }

  render() {
    const loader = <div>Loading...</div>;
    var kahootCards = this.state.kahoots.map((info) => {
      return (
      <GameCard key={info.index} cover={info.cover}
        index={info.index} numQuestions={info.numQuestions} title={info.title}
        description={info.description} username={info.username}>
      </GameCard>)});

    return (
      <InfiniteScroll
          pageStart={0}
          loadMore={this.loadItems.bind(this)}
          hasMore={this.state.hasMoreItems}
          loader={loader}>
          {kahootCards}
      </InfiniteScroll>
    );
  }
}

class GameCard extends React.Component {
  render() {
    var style = {backgroundImage: "url('" + this.props.cover + "')"};
    return (
      <div className="kahootBox1" onClick={() => (location.href = "/play/" + this.props.index)}>
        <div className="kahootBox2">
          <div className="kahootBox3">
            <div className="kahootPicture" style={style}>
              <div className="numQuestions">{this.props.numQuestions} Questions</div>
            </div>
            <div className="kahootBoxContent">
              <main className="kahootInfo">
                <h1 className="title1"><a className="title2">{this.props.title}</a></h1>
                <p className="description">{this.props.description}</p>
              </main>
              <footer className="footer">
                <span className="author">{this.props.username}</span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<GameCardContainer/>, document.getElementById('cardContainer'));
