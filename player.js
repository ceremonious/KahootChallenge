function Player(name, ID, res) {
  this.name = name;
  this.ID = ID;
  this.res = res;
  this.score = 0;
  this.deltaScore = null;
}
Player.prototype.changeScore = function(change) {
  this.deltaScore = change;
  this.score = this.score + change;
};

module.exports = Player;
