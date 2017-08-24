function Player(name, ID, res) {
  this.name = name;
  this.ID = ID;
  this.res = res;
  this.score = 0;
  this.deltaScore = null;
  this.lastAnswer = null;
}
Player.prototype.changeScore = function(change, answer) {
  this.deltaScore = change;
  this.score = this.score + change;
  this.lastAnswer = answer;
};

module.exports = Player;
