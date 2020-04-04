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

function getRandomizedTerritories() {
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

const STORE = new Vuex.Store({
  state: {
    totalTvCount: 10, // The TV inventory
    territories: getRandomizedTerritories(),
  },
  
  getters: {
    // Here we will create a getter
  },
  
  mutations: {
    // Here we will create Jenny
  },
  
  actions: {
    // Here we will create Larry
  }
});

const APP = new Vue({
    el: "#calc1",
    data: {
        //territories: getRandomizedTerritories(),
    },
    computed: {
        territories: function() {
            return STORE.state.territories;
        }
    },
    methods: {
    territoryClickable: function(territory) {
        return territory.numPieces === 0;
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
