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
    numPlayers: 4,
    username: "Alice",
};

const GAME_CONFIG_2 = {
    isHost: false,
    numPlayers: 4,
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
        this.isHost = config.isHost;

        if ("seed" in this.config) {
            this.random = new MersenneTwister(seed);
        } else {
            this.random = new MersenneTwister();
        }
       
        if (server) {
            this.server = server;
            this.online = true;
        } else {
            this.server = new LocalCalcServer();
            this.online = false;
        }
        
        this.store = this.initStore();
        this.app = this.initApp(divId);
        this.loadNewPlayer();

        if (this.isHost) {
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
        return JSON.stringify(this.store.state);
    }

    replaceState(serializedState) {
        this.store.replaceState(JSON.parse(serializedState));
    }

    saveState() {
        const state = this.serialize();
        const THIS = this;
        this.server.pushState(state, function(message) {
            THIS.app.undoAvailable = message.undoAvailable;
            THIS.app.redoAvailable = message.redoAvailable;
        });
    }

    /* Vuexxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx*/


    // Vuex is handy because I want to easily serialize ***almost*** all the state
    // and have it reactive and: it's nice to not serialize undoAvailable / 
    // redoAvailable and thisPlayer, and yet be able to inject that state into vue
    initStore() {
        const store = new Vuex.Store({
          state: {
            players: this.getInitPlayers(),
            territories: this.getVacantTerritories(),
          },
          
          getters: {
            getCurrentPlayer: function(state) {
                for (let i = 0; i < state.players.length; i++) {
                    const player = state.players[i];
                    if (player.active) {
                        return player;
                    }
                }

                throw "Could not find current player";
            }
          },
          
          mutations: {
            clickTerritory(state, index) {
                //console.log(index);
                state.territories[index].numPieces += 1;
                state.territories[index].color = "blue";
            },
            setPlayerName(state, index, name) {
                state.players[index].name = name;
            }
          },
          
          actions: {
            // Here we will create Larry
          }
        });
        return store;
    }

    /* Vue ********************************************************************/

    initApp(divId) {
        const THIS = this;
        const app = new Vue({
            el: divId,
            data: {
                undoAvailable: false,
                redoAvailable: false,
                thisPlayerIndex: -1,
            },
            computed: {
                territories: function() {
                    return THIS.store.state.territories;
                }
            },
            methods: {
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
                    THIS.store.commit('clickTerritory', territory.index);
                    THIS.saveState();
                }
            },
            territoryText: function(territory) {
                if (territory.numPieces === 0) {
                    return "";
                } else {
                    return territory.numPieces;
                }
            }
            },
            delimiters: ["[[","]]"],
        });
        return app;
    }

    /* Game logic *************************************************************/

    loadNewPlayer() {
        if (this.store.state.players.map(p => p.name).includes(this.config.username)) {
            this.app.thisPlayerIndex = this
                .store
                .state
                .players
                .filter(function(p){ return p.name === this.config.username})[0].index;
            return;
        }

        if (!this.store.state.players.map(p => p.name).includes("?")) {
            throw "Cannot add player";
        }

        let playerIndex;
        let playerName;
        do {
            playerIndex = Math.floor(this.random.random() * this.store.state.players.length);
            playerName = this.store.state.players[playerIndex].name;
        } while (playerName != "?");

        this.app.thisPlayerIndex = playerIndex;
        this.store.commit('setPlayerName', playerIndex, this.config.username);

        if (!this.config.online) {
            this.app.thisPlayerIndex = this.store.getters.getCurrentPlayer.index;
        }
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
                instruction: "",
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
        if (this.isHost) {
            for (let i = 0; i < territories.length; i++) {
                const territory = territories[i];
                territory.numPieces = 0;
            }
        }

        return territories;
    }

    getRandomizedTerritories() {
        const territories = getStandardTerritories();
        if (this.isHost) {
            for (let i = 0; i < territories.length; i++) {
                const territory = territories[i];
                territory.numPieces = Math.floor(Math.random() * 4);
                if (territory.numPieces == 0) {
                    territory.color = "white";
                } else {
                    territory.color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];
                }
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
