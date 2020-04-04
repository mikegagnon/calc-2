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

const APP = new Vue({
  el: "#calc1",
  data: {
    territories: getRandomizedTerritories(),
  },
  computed: {
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
