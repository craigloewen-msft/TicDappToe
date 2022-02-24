var TicTacToe = artifacts.require("./TicTacToe.sol");

contract("TicTacToe", function (accounts) {
    var tictactoeInstance;

    it("Can add a new request game", function () {
        return TicTacToe.deployed().then(function (instance) {
            tictactoeInstance = instance;
            return instance.createGameRequest();
        }).then(function (returnVal) {
            return tictactoeInstance.gameRequestsCount();
        }).then(function (count) {
            assert.equal(count,1);
            return tictactoeInstance.gameCount();
        }).then(function (count) {
            assert.equal(count,1);
        });
    });

});
