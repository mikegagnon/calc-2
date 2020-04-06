// TODO: only current player can undo/redo

const TESTING = true;

const DEFAULT_CONFIG = {
    colors: ["red", "blue", "green", "orange", "purple", "black"],
    continents: ["North America", "South America", "Africa", "Australia", "Europe", "Asia"],
    continentBonus: {
        "North America": 5,
        "South America": 2,
        "Africa": 3,
        "Australia": 2,
        "Europe": 5,
        "Asia": 7
    },
    requestStateInterval: 1000,
    explosionDuration: 2500,
    autoDropForPhaseSelectInitPositionsCount: 42,
    doAutoDropThree: false,
    autoDropForPhaseDropThreeVacancies: 5,
    startWithPrizeCards: {
        0: ["heart", "heart", "diamond", "club"]
    }
};

/* Phases *********************************************************************/

const PHASE_SELECT_INIT_POSITIONS = "PHASE_SELECT_INIT_POSITIONS";
const PHASE_DROP_THREE = "PHASE_DROP_THREE";

/* RemoteCalcServer ***********************************************************/

class RemoteCalcServer {
    constructor(config) {
        this.postGameStateUrl = config.postGameStateUrl;
        this.getStateUrl = config.getStateUrl;
        this.undoUrl = config.undoUrl;
        this.redoUrl = config.redoUrl;
    }

    // When the server receives a new state
    pushState(seriralizedState, callback) {
        const THIS = this;
        $.ajax({
            type: "POST",
            url: this.postGameStateUrl,
            data: seriralizedState,
            dataType: "application/json",
            contentType: "application/json",
            success: callback,
            error: function(data) {
                alert("Error: there was an unkown error when attempting to connect to the server");
            },
            dataType: "json"
        });
    }

    // When the server receives a requeset for the latest state
    requestState(callback) {
        $.ajax({
            url: this.getStateUrl,
            data: null,
            success: callback,
            error: function(data) {
                callback(data);
            },
            dataType: "json",
        });
    }

    requestUndo(callback) {
         $.ajax({
            url: this.undoUrl,
            data: null,
            success: callback,
            error: function(data) {
                console.error(data);
            },
            dataType: "json",
        });
    }

    requestRedo(callback) {
        $.ajax({
            url: this.redoUrl,
            data: null,
            success: callback,
            error: function(data) {
                console.error(data);
            },
            dataType: "json",
        });
    }
}

/* LocalCalcServer ************************************************************/

class LocalCalcServer {
    constructor() {
        this.maxStatesLength = 100;
        this.states = [];
        this.stateIndex = null;
        this.count = 0;
        this.lastRequestWasUndo = false;
        this.lastRequestWasRedo = false;
    }

    getUndoAvailable() {
        if (this.stateIndex === null) {
            return false;
        } else {
            return this.stateIndex > 0;
        }
    }

    getRedoAvailable() {
        if (this.stateIndex === null) {
            return false;
        } else {
            return this.stateIndex < this.states.length - 1;
        }
    }

    // When the server receives a new state (it must be serialized first)
    pushState(serializedState, callback) {

        this.lastRequestWasUndo = false;
        this.lastRequestWasRedo = false;
        this.count++;

        if (this.stateIndex !== null) {
            this.states = this.states.slice(0, this.stateIndex + 1);
            if (this.states.length !== this.stateIndex + 1) {
                throw "Error in pushState";
            }
        }
        this.states.push(serializedState);
    
        if (this.states.length === this.maxStatesLength + 1) {
            this.states.shift();
        }

        this.stateIndex = this.states.length - 1;

        callback({
            count: this.count,
            undoAvailable: this.getUndoAvailable(),
            redoAvailable: this.getRedoAvailable(),
        });
    }

    // When the server receives a requeset for the latest state
    requestState(callback) {
        if (this.stateIndex === null) {
            callback({
                count: this.count,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            });
        } else {
            const message = {
                state: this.states[this.stateIndex],
                count: this.count,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            };
            callback(message);
        }
    }

    requestUndo(callback) {
        if (this.stateIndex === 0 || this.stateIndex === null) {
            callback({
                count: this.count,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            });
        } else {
            this.count++;
            this.stateIndex--;
            this.lastRequestWasUndo = true;
            this.lastRequestWasRedo = false;
            const message = {
                state: this.states[this.stateIndex],
                count: this.count,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            };
            callback(message);
        }
    }

    requestRedo(callback) {
        if (this.stateIndex === this.states.length - 1 || this.stateIndex === null) {
            callback({
                count: this.count,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            });
        } else {
            this.count++;
            this.stateIndex++;
            this.lastRequestWasUndo = false;
            this.lastRequestWasRedo = true;
            const message = {
                state: this.states[this.stateIndex],
                count: this.count,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.getUndoAvailable(),
                redoAvailable: this.getRedoAvailable(),
            };
            callback(message);
        }
    }
}

/* CalcGame *******************************************************************/

class CalcGame {

    constructor(templateDivId, divId, server, config) {
        $(templateDivId + " .calc-container").clone().appendTo(divId);
        this.id = Math.floor(Math.random() * 999999999); // intentionally avoiding MersenneTwister here
        this.serverCount = 0;
        this.config = config;
        this.explosionTimeouts = {};

        if ("seed" in this.config) {
            this.random = new MersenneTwister(seed);
        } else {
            this.random = new MersenneTwister();
        }
       
        if (server) {
            this.server = server;
            this.online = true;
        } else {
            this.server = new LocalCalcServer(); // Just used for undo/redo
            this.online = false;
        }
        
        this.app = this.initApp(divId);

        this.loadNewPlayer();

        if (this.config.isHost) {
            this.beginPhaseSelectInitPositions();
        } else {
            this.issueRequest();
        }

        if (this.online) {
            const THIS = this;
            setInterval(function(){
                THIS.issueRequest();
            }, this.config.requestStateInterval);
        }
    }

    // https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
    /**
     * Shuffles array in NOT in place.
     * @param {Array} a items An array containing the items.
     */
    shuffle(a) {
        // clone  
        const newA = [...a];

        var j, x, i;
        for (i = newA.length - 1; i > 0; i--) {
            j = Math.floor(this.random.random() * (i + 1));
            x = newA[i];
            newA[i] = newA[j];
            newA[j] = x;
        }
        return newA;
    }

    /* Server communication ***************************************************/
    
    handleMessage(message) {
        if (message.count <= this.serverCount) {
            return;
        }

        this.serverCount = message.count;

        if ("state" in message) {
            /*if (typeof message.state === "string") {
                message.state = JSON.parse(message.state);
            }*/
            this.replaceState(message.state);                        
        } else {
            console.warn("No state in server");
        }

        this.app.undoAvailable = message.undoAvailable;
        this.app.redoAvailable = message.redoAvailable;

        if (!this.online) {
            this.app.thisPlayerIndex = this.app.currentPlayer.index;
        }

        if (this.loadNewPlayer()) {
            this.saveState();
        }
    }

    issueRequest() {
        const THIS = this;
        this.server.requestState(function(message) {
            THIS.handleMessage(message);
        });
    }

    clickUndo() {
        const THIS = this;
        this.server.requestUndo(function(message) {
            THIS.handleMessage(message);
        });

    }

    clickRedo() {
        const THIS = this;
        this.server.requestRedo(function(message) {
            THIS.handleMessage(message);
        });
    }

    getSerializedState() {
        const state = {
            players: this.app.players,
            territories: this.app.territories,
            currentPhase: this.app.currentPhase,
        }

        return JSON.stringify(state);
    }

    replaceState(serializedState) {
        let state; 
        if (typeof serializedState === "string") {
            state = JSON.parse(serializedState);
        } else {
            state = serializedState;
        }
        this.app.territories = state.territories;
        this.app.players = state.players;
        this.app.currentPhase = state.currentPhase;

        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.explodeColor) {
                if (i in this.explosionTimeouts) {
                    const ref = this.explosionTimeouts[i];
                    clearTimeout(ref);
                    territory.explodeColor = false;
                }
                const THIS = this;
                
                // We delay creating the explosion so that VUE has the chance to erase the previous explosion
                setTimeout(function() {
                    territory.explodeColor = territory.color;
                    THIS.explosionTimeouts[i] = setTimeout(function(){territory.explodeColor = null}, THIS.config.explosionDuration);
                }, 1);
            }
        }
    }

    saveState() {
        //console.log("saveState");
        const serializedState = this.getSerializedState();
        const THIS = this;
        //console.log("saveState", serializedState);
        this.server.pushState(serializedState, function(message) {
            THIS.app.undoAvailable = message.undoAvailable;
            THIS.app.redoAvailable = message.redoAvailable;
        });
    }

    /* Vue ********************************************************************/

    initApp(divId) {
        const THIS = this;
        const app = new Vue({
            el: divId,
            data: {
                players: this.getInitPlayers(),
                territories: this.getVacantTerritories(),
                currentPhase: "undefined",

                // Non serialized state
                undoAvailable: false,
                redoAvailable: false,
                thisPlayerIndex: -1,
            },
            computed: {
                currentPlayer: function() {
                    for (let i = 0; i < this.players.length; i++) {
                        const player = this.players[i];
                        if (player.active) {
                            return player;
                        }
                    }

                    throw "No active player in app:computed";
                },
                thisPlayer: function() {
                    return this.players[this.thisPlayerIndex];
                },
                playerHasCard: function() {
                    return this.thisPlayer && this.numTotalCards(this.thisPlayer) > 0;
                }
            },
            methods: {
                numTotalCards(player) {
                    return player.numHearts + player.numClubs + player.numDiamonds;
                },
                territoryId: function(territory) {
                    return THIS.id + "-" + territory.index;
                },
                playerNameText: function(player) {
                    return player.name;
                },
                territoryClickable: function(territory) {
                    return territory.clickableByPlayerIndex === this.thisPlayerIndex;
                },
                territoryHidden: function(territory) {
                    return territory.numPieces < 0;
                },
                clickUndo: function() {
                    THIS.clickUndo();
                },
                clickRedo: function() {
                    THIS.clickRedo();
                },
                clickTerritory: function(territory) {
                    THIS.clickTerritory(territory);
                },
                territoryText: function(territory) {
                    if (territory.numPieces === 0) {
                        return "";
                    } else {
                        return territory.numPieces;
                    }
                },
            },
            delimiters: ["[[","]]"],
        });
        return app;
    }

    /* Generic game logic *****************************************************/

    clickTerritory(territory) {
        if (!this.app.territoryClickable(territory)) {
            return;
        }

        if (this.app.currentPhase === PHASE_SELECT_INIT_POSITIONS) {
            this.clickTerritoryForPhaseSelectInitPositions(territory);
        } else if (this.app.currentPhase === PHASE_DROP_THREE) {
            this.clickTerritoryForPhaseDropThree(territory);
        } else {
            throw "Bad phase in clickTerritory";
        }
    }


    incrementCurrentPlayer() {
        const player = this.app.currentPlayer;
        player.active = false;
        
        const newPlayerIndex = (player.index + 1) % this.app.players.length;
        const nextPlayer = this.app.players[newPlayerIndex];
        nextPlayer.active = true;

        // This is the hack
        if (!this.online) {
            this.app.thisPlayerIndex = newPlayerIndex;
        }
    }

    setInstructions() {
        for (let i = 0; i < this.app.players.length; i++) {
            const player = this.app.players[i];
            player.instruction = "";
        }

        const player = this.app.currentPlayer;
        player.instruction = this.getPlayerInstruction(player);
    }

    getPlayerInstruction(player) {
        if (this.app.currentPhase === PHASE_SELECT_INIT_POSITIONS) {
            return this.getPlayerInstructionForPhaseSelectInitPositions(player);
        } else if (this.app.currentPhase === PHASE_DROP_THREE) {
            return this.getPlayerInstructionForPhaseDropThree(player);
        } else {
            throw "Bad phase in getPlayerInstruction";
        }
    }

    explodeTerritory(territory) {
        territory.explodeColor = territory.color;
        setTimeout(function(){territory.explodeColor = false}, this.config.explosionDuration);
    }

    getClickableTerritories() {
        const THIS = this;
        return this.app
            .territories
            .filter(function(t) {
                return t.clickableByPlayerIndex === THIS.app.currentPlayer.index;
            });
    }

    /* beginPhaseDropThree ****************************************************/

    beginPhaseDropThree() {
        this.app.currentPhase = PHASE_DROP_THREE;
        this.app.currentPlayer.armiesAvailableForPlacementThisTurn = 3;
        this.setClickableForPhaseDropThree();
        
        if (this.config.doAutoDropThree) {
            this.autoDropForPhaseDropThree(this.config.autoDropForPhaseDropThreeVacancies);
        } else {
            this.setInstructions();
            this.saveState();
        }

    }

    setClickableForPhaseDropThree() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.color === this.app.currentPlayer.color) {
                territory.clickableByPlayerIndex = this.app.currentPlayer.index;
            } else {
                territory.clickableByPlayerIndex = -1;
            }
        }
    }

    getPlayerInstructionForPhaseDropThree(player) {
        if (player.armiesAvailableForPlacementThisTurn > 1) {
            return `Place ${player.armiesAvailableForPlacementThisTurn} armies upon one or more territories you control. ${player.armiesAvailableForPlacement} armies remaining in total.`;
        } else if (player.armiesAvailableForPlacementThisTurn === 1) {
            return `Place 1 army upon a territory you control. ${player.armiesAvailableForPlacement} armies remaining in total.`;
        } else {
            throw "Bad getPlayerInstructionForPhaseDropThree PhaseDropThree";
        }
    }

    autoDropForPhaseDropThree(numVacancies) {
        while (this.getAllArmiesRemaining() > numVacancies) {
            const territories = this.getClickableTerritories();
            const territory = this.shuffle(territories)[0];
            this.clickTerritoryForPhaseDropThree(territory);
        }
    }

    clickTerritoryForPhaseDropThree(territory) {
        territory.numPieces += 1;
        this.app.currentPlayer.armiesAvailableForPlacement--;
        this.app.currentPlayer.armiesAvailableForPlacementThisTurn--;
        this.explodeTerritory(territory);

        // If this phase is over
        if (this.getAllArmiesRemaining() === 0) {

            // We set prizeBonus here, becaue beginPhasePlayCards
            // might be called multiple times, during the same turn, and
            // we want prizeBonus to accumulate
            this.app.currentPlayer.prizeBonus = 0;
            this.incrementCurrentPlayer();
            this.beginPhasePlayCards();
            // No need to save state (nor setInstructions) here because beginPhasePlayCards will save the state
        }

        // If this turn os over
        else if (this.app.currentPlayer.armiesAvailableForPlacementThisTurn === 0) {
            this.incrementCurrentPlayer(); // ddd
            this.app.currentPlayer.armiesAvailableForPlacementThisTurn = Math.min(3, this.app.currentPlayer.armiesAvailableForPlacement);
            this.setClickableForPhaseDropThree();
            this.setInstructions();
            this.saveState();

        } 

        // If current player gets to go again
        else {
            this.setClickableForPhaseDropThree();
            this.setInstructions();
            this.saveState();
        }
    }

    getAllArmiesRemaining() {
        let armiesRemaining = 0;
        for (let i = 0; i < this.app.players.length; i++) {
            const player = this.app.players[i];
            armiesRemaining += player.armiesAvailableForPlacement;
        }
        return armiesRemaining;
    }

    /* beginPhaseSelectInitPositions ******************************************/

    beginPhaseSelectInitPositions() {
        this.app.currentPhase = PHASE_SELECT_INIT_POSITIONS;
        this.initArmiesAvailableForPhaseSelectInitPositions();
        this.setClickableForPhaseSelectInitPositions();
        this.setInstructions();

        const autoDropCount = this.config.autoDropForPhaseSelectInitPositionsCount;
        if (autoDropCount > 0) {
            this.autoDropForPhaseSelectInitPositions(autoDropCount);
        } else {
            this.saveState();
        }
    }

    autoDropForPhaseSelectInitPositions(numTerritories) {
        const territories = this.app.territories;
        for (let i = 0; i < numTerritories; i++) {
            let territory;
            do {
                const territoryIndex = Math.floor(this.random.random() * territories.length);
                territory = territories[territoryIndex];
            } while (territory.numPieces > 0)

            this.clickTerritoryForPhaseSelectInitPositions(territory);
        }
    }


    initArmiesAvailableForPhaseSelectInitPositions() {
        const app = this.app;
        if (app.players.length === 2) {
            app.players[0].armiesAvailableForPlacement = 40;
            app.players[1].armiesAvailableForPlacement = 40;
        } else if (app.players.length === 3) {
            app.players[0].armiesAvailableForPlacement = 35;
            app.players[1].armiesAvailableForPlacement = 35;
            app.players[2].armiesAvailableForPlacement = 35;
        } else if (app.players.length === 4) {
            app.players[0].armiesAvailableForPlacement = 30;
            app.players[1].armiesAvailableForPlacement = 30;
            app.players[2].armiesAvailableForPlacement = 30;
            app.players[3].armiesAvailableForPlacement = 30;
        } else if (app.players.length === 5) {
            app.players[0].armiesAvailableForPlacement = 25;
            app.players[1].armiesAvailableForPlacement = 25;
            app.players[2].armiesAvailableForPlacement = 25;
            app.players[3].armiesAvailableForPlacement = 25;
            app.players[4].armiesAvailableForPlacement = 25;
        } else if (app.players.length === 6) {
            app.players[0].armiesAvailableForPlacement = 20;
            app.players[1].armiesAvailableForPlacement = 20;
            app.players[2].armiesAvailableForPlacement = 20;
            app.players[3].armiesAvailableForPlacement = 20;
            app.players[4].armiesAvailableForPlacement = 20;
            app.players[5].armiesAvailableForPlacement = 20;
        } else {
            throw "Bad players.length";
        }
    }

    setClickableForPhaseSelectInitPositions() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.numPieces === 0) {
                territory.clickableByPlayerIndex = this.app.currentPlayer.index;
            } else {
                territory.clickableByPlayerIndex = -1;
            }
        }
    }

    getPlayerInstructionForPhaseSelectInitPositions(player) {
        return `Place 1 army on any available territory. ${player.armiesAvailableForPlacement} armies remaining.`;
    }

    clickTerritoryForPhaseSelectInitPositions(territory) {
        territory.numPieces = 1;
        territory.color = this.app.currentPlayer.color;
        this.app.currentPlayer.armiesAvailableForPlacement--;
        this.explodeTerritory(territory);
        this.incrementCurrentPlayer();

        const numEmptyTerritories =
            this.app.territories.filter(t => t.numPieces === 0).length;

        if (numEmptyTerritories === 0) {
            this.beginPhaseDropThree();
        } else {
            this.setClickableForPhaseSelectInitPositions();
            this.setInstructions();
            this.saveState();            
        }
    }

    /* Misc. game logic *******************************************************/

    loadNewPlayer() {
        const THIS = this;

        // If the player is already in the system
        if (this.app.players.map(p => p.name).includes(this.config.username)) {
            this.app.thisPlayerIndex = this
                .app
                .players
                .filter(function(p){ return p.name === THIS.config.username})[0].index;
            return false;
        }

        if (!this.app.players.map(p => p.name).includes("?")) {
            throw "Cannot add player";
        }

        let playerIndex;
        let player;
        let playerName;
        do {
            playerIndex = Math.floor(this.random.random() * this.app.players.length);
            player = this.app.players[playerIndex];
            playerName = player.name;
        } while (playerName != "?");

        this.app.thisPlayerIndex = playerIndex;
        player.name = this.config.username;

        if (!this.online) {
            this.app.thisPlayerIndex = this.app.currentPlayer.index;
        }

        return true;
    }

    getInitPlayers() {
        let playerNames;

        if (this.config.playerNames) {
            playerNames = this.config.playerNames;
        } else {
            playerNames = ["?", "?", "?", "?", "?", "?"].slice(0, this.config.numPlayers);
        }

        const colors = this.shuffle(this.config.colors).slice(0, playerNames.length);
        const players = [];
        for (let i = 0; i < playerNames.length; i++) {
            players.push({
                index: i,
                name: playerNames[i],
                color: colors[i],
                active: false,
                instruction: "asdf",
                armiesAvailableForPlacement: -1,
            })
        }

        const playersWithStartCards = Object.keys(this.config.startWithPrizeCards);
        for (let i = 0; i < playersWithStartCards.length; i++) {
            const playerIndex = playersWithStartCards[i];
            const cards = this.config.startWithPrizeCards[playerIndex];
            const player = players[playerIndex];
            player.numHearts = cards.filter(c => c === "heart").length;
            player.numClubs = cards.filter(c => c === "club").length;
            player.numDiamonds = cards.filter(c => c === "diamond").length;
        }

        players[0].active = true;

        return players;
    }


    getVacantTerritories() {
        const territories = getStandardTerritories();
        if (this.config.isHost) {
            for (let i = 0; i < territories.length; i++) {
                const territory = territories[i];
                territory.numPieces = 0;
            }
        }
       return territories;
    }
}

/* Tests **********************************************************************/

function testLocalServer() {
    function assert(val) {
        if (val === true) {
            // do nothing
        } else if (val === false) {
            throw "Failed test";
        } else {
            throw "Bad val";
        }
    }

    let server;

    // Test 1
    server = new LocalCalcServer();
    server.requestUndo(function(message) {
        assert(message.count === 0);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 0);
    assert(server.stateIndex === null);
    assert(server.count === 0);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.requestRedo(function(message) {
        assert(message.count === 0);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 0);
    assert(server.stateIndex === null);
    assert(server.count === 0);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.requestState(function(message) {
        assert(message.count === 0)
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 0);
    assert(server.stateIndex === null);
    assert(server.count === 0);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    // states = [a]
    server.pushState("a", function(message){
        assert(message.count === 1)
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 1);
    assert(server.states[0] === "a");
    assert(server.stateIndex === 0);
    assert(server.count === 1);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.requestUndo(function(message) {
        assert(message.count === 1)
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 1);
    assert(server.states[0] === "a");
    assert(server.stateIndex === 0);
    assert(server.count === 1);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.requestRedo(function(message) {
        assert(message.count === 1)
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    assert(server.states.length === 1);
    assert(server.states[0] === "a");
    assert(server.stateIndex === 0);
    assert(server.count === 1);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.requestState(function(message) {
        assert(message.state === "a");
        assert(message.count === 1);
        assert(message.undo === false);
        assert(message.redo === false);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    assert(server.states.length === 1);
    assert(server.states[0] === "a");
    assert(server.stateIndex === 0);
    assert(server.count === 1);
    assert(server.lastRequestWasUndo === false);
    assert(server.lastRequestWasRedo === false);

    server.pushState("b", function(message) {
        assert(message.count === 2)
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    server.requestState(function(message) {
        assert(message.state === "b");
        assert(message.count === 2);
        assert(message.undo === false);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestUndo(function(message) {
        assert(message.state === "a");
        assert(message.count === 3);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestRedo(function(message) {
        assert(message.state === "b");
        assert(message.count === 4);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "b");
        assert(message.count === 4);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.pushState("c", function(message){
        assert(message.count === 5)
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);
    });

    server.pushState("d", function(message){
        assert(message.count === 6)
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 3);

    });

    server.requestUndo(function(message) {
        assert(message.state === "c");
        assert(message.count === 7);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestRedo(function(message) {
        assert(message.state === "d");
        assert(message.count === 8);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "d");
        assert(message.count === 8);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestUndo(function(message) {
        assert(message.state === "c");
        assert(message.count === 9);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "c");
        assert(message.count === 9);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });
}

if (TESTING) {
    testLocalServer();
}
