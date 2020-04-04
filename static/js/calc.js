const COLORS = ["red", "blue", "green", "orange", "purple", "black"];
const CONTINENTS = ["North America", "South America", "Africa", "Australia", "Europe", "Asia"];
const CONTINENT_BONUS = {
    "North America": 5,
    "South America": 2,
    "Africa": 3,
    "Australia": 2,
    "Europe": 5,
    "Asia": 7
};

class CalcGame {

    constructor(templateDivId, divId) {
        $(templateDivId + " .calc-container").clone().appendTo(divId);
        this.store = this.initStore();
        this.app = this.initApp(divId);
    }

    serialize() {
        return JSON.stringify(this.store.state);
    }

    replaceState(state) {
        this.store.replaceState(JSON.parse(state));
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
            data: {
                //territories: getRandomizedTerritories(),
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
            clickTerritory: function(territory) {
                if (this.territoryClickable(territory)) {
                    THIS.store.commit('clickTerritory', territory.index);
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
        for (let i = 0; i < territories.length; i++) {
            const territory = territories[i];
            territory.numPieces = Math.floor(Math.random() * 4);
            if (territory.numPieces == 0) {
                territory.color = "white";
            } else {
                territory.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            }
        }

        return territories;
    }
}

const CALC1 = new CalcGame("#gameTemplate", "#calc1");
const CALC2 = new CalcGame("#gameTemplate", "#calc2");