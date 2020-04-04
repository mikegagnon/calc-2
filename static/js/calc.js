
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
    "requestStateInterval": 1000
};

class LocalCalcServer {
    constructor() {
        this.states = [];
        this.clientSideCurrentIndex = null;
    }

    // When the server receives a new state
    pushState(serializedState) {
        this.states.push(serializedState);
        this.clientSideCurrentIndex = this.states.length - 1;
    }

    // When the server receives a requeset for the latest state
    requestState(callback) {
        const message = {
            state: this.states[this.states.length - 1],
            index: this.states.length - 1,
            undo: false,
            redo: false,
        };
        this.clientSideCurrentIndex = message.index;
        callback(message);
    }

    // TODO: undo and redo
}


class CalcGame {

    constructor(templateDivId, divId, server, isHost, config) {
        $(templateDivId + " .calc-container").clone().appendTo(divId);
        this.isHost = isHost;
        if (config) {
            this.config = config;
        } else {
            this.config = DEFAULT_CONFIG;
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
        if (this.isHost) {
            this.saveState();
        }

        // TODO: rm !this.online after testing
        if (this.online || !this.online) {
            const THIS = this;
            setInterval(function(){
                THIS.issueRequest();
            }, this.config.requestStateInterval);
        }
    }

    issueRequest() {
        const THIS = this;
        this.server.requestState(function(message) {
            if (message.undo || message.redo) {
                THIS.replaceState(message.state);
            } else if (message.index >= THIS.server.clientSideCurrentIndex) {
                THIS.replaceState(message.state);                        
            } else {
                console.warn("Received stale message");
            }
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
        this.server.pushState(state);
    }

    initStore() {
        const store = new Vuex.Store({
          state: {
            territories: this.getRandomizedTerritories(),
          },
          
          getters: {
            // Here we will create a getter
          },
          
          mutations: {
            clickTerritory(state, index) {
                //console.log(index);
                state.territories[index].numPieces += 1;
                state.territories[index].color = "blue";
            }
          },
          
          actions: {
            // Here we will create Larry
          }
        });
        return store;
    }

    initApp(divId) {
        const THIS = this;
        const app = new Vue({
            el: divId,
            data: {},
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
                return territory.numPieces < 0
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

const server = new LocalCalcServer();
const CALC1 = new CalcGame("#gameTemplate", "#calc1", server, true, DEFAULT_CONFIG);
const CALC2 = new CalcGame("#gameTemplate", "#calc2", server, false, DEFAULT_CONFIG);