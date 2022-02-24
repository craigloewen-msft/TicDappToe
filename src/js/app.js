App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function () {
    App.initWeb3();
  },

  mainInit: function () {
    App.getGameState();
  },

  getGameState: async function () {
    $("#newGameButton").hide();
    $("#requestView").hide();
    $("#gameListHeading").hide();
    $("#gameList").hide();
    $("#activeGameList").hide();
    let gamesInstance = await App.contracts.TicTacToe.deployed();

    let activeGamesPromise = gamesInstance.activeGamesListByAddress(App.account);
    let gameRequestsPromise = gamesInstance.gameRequestsListByAddress(App.account);

    let [activeGame, gameRequest] = await Promise.all([activeGamesPromise, gameRequestsPromise]);

    // Check if there are active games
    if (activeGame.c[0] != 0) {
      // render active game view
      App.initTicTacToeBoard(activeGame.c[0], gamesInstance);
    } else if (gameRequest.c[0] != 0) {
      // REnder game request view
      App.renderRequestView();
    } else {
      // Render make request view
      App.renderMakeRequestView();
    }

    // Check if there are Requests 

    // Else look for a game
  },

  renderRequestView: function () {
    $("#requestView").show();
  },

  renderMakeRequestView: function () {
    $("#gameListHeading").show();
    $("#newGameButton").show();
    App.renderGameList();
    App.renderActiveGameList();
  },

  initTicTacToeBoard: async function (gameNumber, gamesInstance) {
    let rootDiv = $('#tictactoegame');
    rootDiv.empty();

    let gameInfo = await gamesInstance.gameList(gameNumber);
    let gameArray = await gamesInstance.getGameArray.call(gameNumber, { from: App.account });

    console.log(gameInfo);

    let isFinished = gameInfo[3];
    let player1Turn = gameInfo[4];
    let player1Won = gameInfo[8];
    let thisPlayerVal;

    if (App.account == gameInfo[1]) {
      thisPlayerVal = 1;
    } else {
      thisPlayerVal = 2;
    }

    let waitingTurn = true;

    if (player1Turn && thisPlayerVal == 1) {
      waitingTurn = false;
    } else if (!player1Turn && thisPlayerVal == 2) {
      waitingTurn = false;
    }

    if (waitingTurn && !isFinished) {
      let waitMessage = document.createElement("div");
      waitMessage.classList.add("wait-message");
      waitMessage.innerText = "It is the other players turn. Please wait.";
      rootDiv.append(waitMessage);
    }

    if (isFinished) {
      let waitMessage = document.createElement("div");
      waitMessage.classList.add("end-message");
      if ((player1Won && thisPlayerVal == 1) || (!player1Won && thisPlayerVal == 2)) {
        waitMessage.innerText = "You won, congratulations!";
      } else {
        waitMessage.innerText = "You lost, better luck next time!";
      }
      rootDiv.append(waitMessage);
    }


    let rowCount = 3;
    let columnCount = 3;

    for (let i = 0; i < rowCount; i++) {
      let rowDiv = document.createElement("div");
      rowDiv.classList.add("tictactoe-row");
      for (let j = 0; j < columnCount; j++) {
        let cellDiv = document.createElement("div");
        cellDiv.classList.add("tictactoe-cell");
        if (j != 0 && j != (columnCount - 1)) {
          cellDiv.classList.add("tictactoe-col-mid");
        }
        if (i != 0 && i != (rowCount - 1)) {
          cellDiv.classList.add("tictactoe-row-mid");
        }

        if (gameArray[i][j] == 1) {
          cellDiv.innerHTML = "❌"
        } else if (gameArray[i][j] == 2) {
          cellDiv.innerHTML = "⭕";
        } else {
          cellDiv.innerHTML = "&nbsp;";

          if (!waitingTurn) {
            cellDiv.addEventListener("click", function (event) {
              App.clickTicTacToe(i, j, gamesInstance);
            })
          }
        }

        rowDiv.appendChild(cellDiv);
      }
      rootDiv.append(rowDiv);
    }
  },

  clickTicTacToe: async function (i, j, gamesInstance) {
    let clickResult = await gamesInstance.playTurn(i, j, { from: App.account });
    console.log(clickResult);
    App.getGameState();
  },

  createNewGame: function () {
    console.log("New game!");
    console.log(App.contracts);
    App.contracts.TicTacToe.deployed().then(function (instance) {
      return instance.createGameRequest({ from: App.account });
    }).then(function (result) {
      console.log("Created game!");
      // Wait for votes to update
      App.getGameState();
    }).catch(function (err) {
      console.error(err);
    });
  },

  joinGame: async function (inputAddress) {
    console.log(inputAddress);

    let gameInstance = await App.contracts.TicTacToe.deployed();

    let joinGameResponse = await gameInstance.joinGameRequest(inputAddress, { from: App.account });

    console.log(joinGameResponse);

    App.getGameState();

  },

  renderGameList: function () {

    // Load contract data
    App.contracts.TicTacToe.deployed().then(function (instance) {
      gamesInstance = instance;
      return gamesInstance.gameRequestsCount();
    }).then(function (gameRequestsCount) {
      var gameListDiv = $("#gameList");
      $("#gameList").show();
      gameListDiv.empty();

      $("#gameList").append("<b>Open Games:</b>");

      let gameRequestsToShowCount = 10;
      if (gameRequestsCount < gameRequestsToShowCount || gameRequestsCount == null) {
        gameRequestsToShowCount = gameRequestsCount;
      }

      for (var i = 0; i < gameRequestsToShowCount; i++) {
        gamesInstance.gameRequestsList(i).then(function (gameRequestNumber) {
          let gameNumber = gameRequestNumber.c[0];

          gamesInstance.gameList(gameNumber).then(function (gameVisitor) {
            console.log(gameVisitor);
            let player1Address = gameVisitor[1];
            let player2Address = gameVisitor[2];
            let isFinished = gameVisitor[3];
            let player1Turn = gameVisitor[4];
            let hasStarted = gameVisitor[5];

            var gameListItem = "<div>Player:" + player1Address + "</div>";
            gameListDiv.append(gameListItem);

            if (!hasStarted) {
              let playButton = '<button onClick="App.joinGame(\'' + player1Address + '\');">Play this game</button>'
              gameListDiv.append(playButton);
            }
          });

        });

      }
      //   return gamesInstance.voters(App.account);
      // }).then(function (hasVoted) {
      //   // Do not allow a user to vote
      //   if (hasVoted) {
      //     $('form').hide();
      //   }
      //   loader.hide();
      //   content.show();
    }).catch(function (error) {
      console.warn(error);
    });

  },

  renderActiveGameList: function () {

    // Load contract data
    App.contracts.TicTacToe.deployed().then(function (instance) {
      gamesInstance = instance;
      return gamesInstance.activeGamesCount();
    }).then(function (gameRequestsCount) {
      var gameListDiv = $("#activeGameList");
      $("#activeGameList").show();
      gameListDiv.empty();
      $("#activeGameList").append("<b>Active Games:</b>");

      let gameRequestsToShowCount = 10;
      if (gameRequestsCount < gameRequestsToShowCount || gameRequestsCount == null) {
        gameRequestsToShowCount = gameRequestsCount;
      }

      for (var i = 0; i < gameRequestsToShowCount; i++) {
        gamesInstance.activeGamesList(i).then(function (gameRequestNumber) {
          let gameNumber = gameRequestNumber.c[0];

          gamesInstance.gameList(gameNumber).then(function (gameVisitor) {
            console.log(gameVisitor);
            let player1Address = gameVisitor[1];
            let player2Address = gameVisitor[2];
            let isFinished = gameVisitor[3];
            let player1Turn = gameVisitor[4];
            let hasStarted = gameVisitor[5];

            var gameListItem = "<div>Player: " + player1Address + "</div>";
            gameListDiv.append(gameListItem);
          });

        });

      }
      //   return gamesInstance.voters(App.account);
      // }).then(function (hasVoted) {
      //   // Do not allow a user to vote
      //   if (hasVoted) {
      //     $('form').hide();
      //   }
      //   loader.hide();
      //   content.show();
    }).catch(function (error) {
      console.warn(error);
    });

  },

  initWeb3: function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("TicTacToe.json", function (tictactoe) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.TicTacToe = TruffleContract(tictactoe);
      // Connect provider to interact with contract
      App.contracts.TicTacToe.setProvider(App.web3Provider);

      App.render();
      return App.mainInit();

    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function () {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      } else {
        console.log("Error on loading coinbase");
      }
    });

  },

  castVote: function () {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
      console.log(instance);
      console.log(App.account);
      return instance.vote(candidateId, { from: App.account });
    }).then(function (result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function (err) {
      console.error(err);
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});