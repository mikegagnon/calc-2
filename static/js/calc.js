const APP = new Vue({
  el: '#calc1',
  data: {
    territories: getStandardTerritories(),
  },
  computed: {
  },
  methods: {
    territoryClickable: function(territory) {
        return false;
    },
    territoryText: function(territory) {
        if (territory.numPieces === 0) {
            return "";
        } else {
            return territory.numPieces;
        }
    }
  },
  delimiters: ['[[',']]'],
});
