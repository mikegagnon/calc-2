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
    requestStateInterval: 1000
};

const GAME_CONFIG_1 = {
    isHost: true,
    numPlayers: 2,
    username: "Alice",
};

const GAME_CONFIG_2 = {
    isHost: false,
    numPlayers: 2,
    username: "Bob",
};

/* LocalCalcServer ************************************************************/

class LocalCalcServer {
    constructor() {
        this.states = [];
        this.serverSideIndex = null;
        this.clientSideCurrentIndex = null;
        this.lastRequestWasUndo = false;
        this.lastRequestWasRedo = false;
        this.undoAvailable = false;
        this.redoAvailable = false;
    }

    // When the server receives a new state
    pushState(serializedState, callback) {
        this.lastRequestWasUndo = false;
        this.lastRequestWasRedo = false;

        if (this.serverSideIndex === null) {
            this.serverSideIndex = 0;
        } else {
            this.serverSideIndex++;
        }

        this.states = this.states.slice(0, this.serverSideIndex);
        this.states.push(serializedState);
        this.clientSideCurrentIndex = this.serverSideIndex;

        this.undoAvailable = this.serverSideIndex > 0;
        this.redoAvailable = this.serverSideIndex < this.states.length - 1;

        callback({
            undoAvailable: this.undoAvailable,
            redoAvailable: this.redoAvailable,
        });
    }

    // When the server receives a requeset for the latest state
    requestState(callback) {
        if (this.serverSideIndex === null) {
            callback({
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            });
        } else {
            this.undoAvailable = this.serverSideIndex > 0;
            this.redoAvailable = this.serverSideIndex < this.states.length - 1;
            const message = {
                state: this.states[this.serverSideIndex],
                index: this.serverSideIndex,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            };
            this.clientSideCurrentIndex = this.serverSideIndex;
            callback(message);
        }
    }

    requestUndo(callback) {
        if (this.serverSideIndex === 0 || this.serverSideIndex === null) {
            callback({
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            });
        } else {
            this.serverSideIndex--;
            this.undoAvailable = this.serverSideIndex > 0;
            this.redoAvailable = true;
            this.lastRequestWasUndo = true;
            this.lastRequestWasRedo = false;
            const message = {
                state: this.states[this.serverSideIndex],
                index: this.serverSideIndex,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            };
            callback(message);
        }
        this.clientSideCurrentIndex = this.serverSideIndex;
    }

    requestRedo(callback) {
        if (this.serverSideIndex === this.states.length - 1 || this.serverSideIndex === null) {
            callback({
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            });
        } else {
            this.serverSideIndex++;
            this.undoAvailable = true;
            this.redoAvailable = this.serverSideIndex < this.states.length - 1;
            this.lastRequestWasUndo = false;
            this.lastRequestWasRedo = true;
            const message = {
                state: this.states[this.serverSideIndex],
                index: this.serverSideIndex,
                undo: this.lastRequestWasUndo,
                redo: this.lastRequestWasRedo,
                undoAvailable: this.undoAvailable,
                redoAvailable: this.redoAvailable,
            };
            callback(message);
        }
        this.clientSideCurrentIndex = this.serverSideIndex;

    }
}

/* CalcGame *******************************************************************/

class CalcGame {

    constructor(templateDivId, divId, server, config) {
        $(templateDivId + " .calc-container").clone().appendTo(divId);
        
        this.config = config;

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
            //this.setClickable(this.store.getters.currentPlayer.index);
            this.saveState();
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
     * Shuffles array in place.
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
    
    issueRequest() {
        const THIS = this;
        this.server.requestState(function(message) {
            if (!("state" in message)) {
                console.warn("No states in server");
            } else if (message.undo || message.redo) {
                THIS.replaceState(message.state);
            } else if (message.index >= THIS.server.clientSideCurrentIndex) {
                THIS.replaceState(message.state);                        
            } else {
                console.warn("Received stale message");
            }
            THIS.app.undoAvailable = message.undoAvailable;
            THIS.app.redoAvailable = message.redoAvailable;
            if (THIS.loadNewPlayer()) {
                THIS.saveState();
            }
        });
    }

    clickUndo() {
        const THIS = this;
        this.server.requestUndo(function(message) {
            if (!("state" in message)) {
                console.warn("No states in server");
            } else {
                THIS.replaceState(message.state);                        
            }
            THIS.app.undoAvailable = message.undoAvailable;
            THIS.app.redoAvailable = message.redoAvailable;
        });
    }

    clickRedo() {
        const THIS = this;
        this.server.requestRedo(function(message) {
            if (!("state" in message)) {
                console.warn("No states in server");
            } else {
                THIS.replaceState(message.state);                        
            }
            THIS.app.undoAvailable = message.undoAvailable;
            THIS.app.redoAvailable = message.redoAvailable;
        });
    }

    serialize() {
        const state = {
            players: this.app.players,
            territories: this.app.territories,
        }

        return JSON.stringify(state);
    }

    replaceState(serializedState) {
        const state = JSON.parse(serializedState);
        this.app.territories = state.territories;
        this.app.players = state.players;
    }

    saveState() {
        const state = this.serialize();
        const THIS = this;
        this.server.pushState(state, function(message) {
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
                undoAvailable: false,
                redoAvailable: false,
                currentPlayerIndex: 0,
                thisPlayerIndex: -1,
            },
            computed: {
                currentPlayer: function() {
                    return this.players[this.currentPlayerIndex];
                }
            },
            methods: {
                playerNameText: function(player) {
                    return player.name;
                },
                territoryClickable: function(territory) {
                    return territory.numPieces === 0;
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
                    if (this.territoryClickable(territory)) {
                        territory.numPieces += 1;
                        territory.color = "blue";
                        THIS.saveState();
                    }
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

    /* Game logic *************************************************************/

    /*setClickable(playerIndex) {
        const territories = this.store.state.territories;
        for (let i = 0; i < territories.length; i++) {
            //const territory = territories[i];
            this.store.commit('setTerritoryClickable', [i, playerIndex]);
        }
    }*/

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

        if (!this.config.online) {
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
            })
        }

        /*
        const playersWithStartCards = Object.keys(CONFIG.startWithPrizeCards);
        for (let i = 0; i < playersWithStartCards.length; i++) {
            const playerIndex = playersWithStartCards[i];
            const cards = CONFIG.startWithPrizeCards[playerIndex];
            const player = players[playerIndex];
            player.numHearts = cards.filter(c => c === "heart").length;
            player.numClubs = cards.filter(c => c === "club").length;
            player.numDiamonds = cards.filter(c => c === "diamond").length;
            player.numTotalCards = player.numHearts + player.numClubs + player.numDiamonds;
        }
        */


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

const server = new LocalCalcServer();
const CALC1 = new CalcGame("#gameTemplate", "#calc1", server, $.extend({}, GAME_CONFIG_1, DEFAULT_CONFIG));
const CALC2 = new CalcGame("#gameTemplate", "#calc2", server, $.extend({}, GAME_CONFIG_2, DEFAULT_CONFIG));

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
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 2);
    });

    server.requestRedo(function(message) {
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 2);
    });

    server.requestState(function(message) {
        //console.log(message);
        //alert(Object.keys(message).length);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 2);
    });

    // states = [a]
    server.pushState("a", function(){});

    server.requestUndo(function(message) {
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 2);
    });

    server.requestRedo(function(message) {
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 2);
    });

    server.requestState(function(message) {
        assert(message.state === "a");
        assert(message.index === 0);
        assert(message.undo === false);
        assert(message.redo === false);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.pushState("b", function(){});

    server.requestUndo(function(message) {
        assert(message.state === "a");
        assert(message.index === 0);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === false);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestRedo(function(message) {
        assert(message.state === "b");
        assert(message.index === 1);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "b");
        assert(message.index === 1);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.pushState("c", function(){});
    server.pushState("d", function(){});

    server.requestUndo(function(message) {
        assert(message.state === "c");
        assert(message.index === 2);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestRedo(function(message) {
        assert(message.state === "d");
        assert(message.index === 3);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "d");
        assert(message.index === 3);
        assert(message.undo === false);
        assert(message.redo === true);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === false);
        assert(Object.keys(message).length === 6);
    });

    server.requestUndo(function(message) {
        assert(message.state === "c");
        assert(message.index === 2);
        assert(message.undo === true);
        assert(message.redo === false);
        assert(message.undoAvailable === true);
        assert(message.redoAvailable === true);
        assert(Object.keys(message).length === 6);
    });

    server.requestState(function(message) {
        assert(message.state === "c");
        assert(message.index === 2);
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
