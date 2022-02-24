pragma solidity >=0.4.2;

contract TicTacToe {
    // Game construct
    struct TicTacToeGame {
        uint256 gameID;
        uint8[3][3] board;
        address player1;
        address player2;
        bool isFinished;
        bool player1Turn;
        bool hasStarted;
        bool player1Dismissed;
        bool player2Dismissed;
        bool player1Won;
    }

    // Store game list
    mapping(uint256 => TicTacToeGame) public gameList;
    uint256 public gameCount;

    // Game Requests
    mapping(address => uint256) public gameRequestsListByAddress;
    uint256[] public gameRequestsList;
    uint256 public gameRequestsCount;

    // Active Games
    mapping(address => uint256) public activeGamesListByAddress;
    uint256[] public activeGamesList;
    uint256 public activeGamesCount;

    constructor() public {}

    // Array Storage operators
    function addGameRequest(uint256 inID) public {
        gameRequestsList.push(inID);
        gameRequestsListByAddress[gameList[inID].player1] = inID;
        gameRequestsCount++;
    }

    function removeGameRequest(uint256 inID) public {
        for (uint256 i = 0; i < gameRequestsList.length; i++) {
            if (gameRequestsList[i] == inID) {
                gameRequestsList[i] = gameRequestsList[gameRequestsCount - 1];
                gameRequestsList.pop();
                delete gameRequestsListByAddress[gameList[inID].player1];
                gameRequestsCount--;
                return;
            }
        }
    }

    function addActiveGame(uint256 inID) public {
        activeGamesList.push(inID);
        activeGamesListByAddress[gameList[inID].player1] = inID;
        activeGamesListByAddress[gameList[inID].player2] = inID;
        activeGamesCount++;
    }

    function removeActiveGame(uint256 inID) public {
        for (uint256 i = 0; i < activeGamesList.length; i++) {
            if (activeGamesList[i] == inID) {
                activeGamesList[i] = activeGamesList[gameRequestsCount - 1];
                activeGamesList.pop();
                delete activeGamesListByAddress[gameList[inID].player1];
                delete activeGamesListByAddress[gameList[inID].player2];
                activeGamesCount--;
                return;
            }
        }
    }

    // Game creation and invite functionality

    function createGameRequest() public {
        if (gameList[gameRequestsListByAddress[msg.sender]].gameID != 0) {
            return;
        }

        gameCount++;

        uint8[3][3] memory someBoard;
        someBoard[0] = [0, 0, 0];
        someBoard[1] = [0, 0, 0];
        someBoard[2] = [0, 0, 0];

        TicTacToeGame memory newRequest = TicTacToeGame(
            gameCount,
            someBoard,
            msg.sender,
            msg.sender,
            false,
            false,
            false,
            false,
            false,
            false
        );

        gameList[gameCount] = newRequest;
        addGameRequest(gameCount);
    }

    function joinGameRequest(address _opponentAddress)
        public
        returns (bool result)
    {
        result = false;

        if (gameRequestsListByAddress[_opponentAddress] == 0) {
            result = false;
            return result;
        } else {
            gameList[gameRequestsListByAddress[_opponentAddress]].player2 = msg
                .sender;
            gameList[gameRequestsListByAddress[_opponentAddress]]
                .hasStarted = true;
            addActiveGame(
                gameList[gameRequestsListByAddress[_opponentAddress]].gameID
            );
            removeGameRequest(
                gameList[gameRequestsListByAddress[_opponentAddress]].gameID
            );
            result = true;
            return result;
        }
    }

    // Core gameplay functions

    function playTurn(uint256 i, uint256 j) public {
        uint256 playerVal = 0;

        if (
            gameList[activeGamesListByAddress[msg.sender]].player1 == msg.sender
        ) {
            playerVal = 1;
        } else {
            playerVal = 2;
        }

        bool canGo = false;

        if (playerVal == 1) {
            if (gameList[activeGamesListByAddress[msg.sender]].player1Turn) {
                canGo = true;
            }
        } else {
            if (!gameList[activeGamesListByAddress[msg.sender]].player1Turn) {
                canGo = true;
            }
        }

        if (canGo) {
            if (
                gameList[activeGamesListByAddress[msg.sender]].board[i][j] == 0
            ) {
                if (playerVal == 1) {
                    gameList[activeGamesListByAddress[msg.sender]].board[i][
                            j
                        ] = 1;
                } else {
                    gameList[activeGamesListByAddress[msg.sender]].board[i][
                            j
                        ] = 2;
                }
                gameList[activeGamesListByAddress[msg.sender]]
                    .player1Turn = !gameList[
                    activeGamesListByAddress[msg.sender]
                ].player1Turn;
                uint256 winResult = checkWin();
                if (winResult != 0) {
                    markWin(winResult);
                }
            }
        }
    }

    function getGameArray(uint256 inputGame)
        public
        returns (uint8[3][3] memory)
    {
        return gameList[inputGame].board;
    }

    function checkWin() public returns (uint256) {
        uint8[3][3] memory board = gameList[
            activeGamesListByAddress[msg.sender]
        ].board;
        uint256 result = 0;

        for (uint256 i = 0; i < 3; i++) {
            if (
                board[i][0] != 0 &&
                (board[i][0] == board[i][1] && board[i][1] == board[i][2])
            ) {
                result = board[i][0];
            }
            if (
                (board[0][i] != 0) &&
                (board[0][i] == board[1][i]) &&
                (board[1][i] == board[2][i])
            ) {
                result = board[0][i];
            }
        }
        if (
            (board[1][1] != 0) &&
            (board[0][0] == board[1][1]) &&
            (board[1][1] == board[2][2])
        ) {
            result = board[1][1];
        }
        if (
            (board[1][1] != 0) &&
            (board[0][2] == board[1][1]) &&
            (board[1][1] == board[2][0])
        ) {
            result = board[1][1];
        }

        return result;
    }

    function markWin(uint256 inWinner) public {
        gameList[activeGamesListByAddress[msg.sender]].isFinished = true;
        if (inWinner == 1) {
            gameList[activeGamesListByAddress[msg.sender]].player1Won = true;
        }
        if (inWinner == 2) {
            gameList[activeGamesListByAddress[msg.sender]].player1Won = false;
        }
    }
}
