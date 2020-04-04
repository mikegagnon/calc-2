function getStandardTerritories() {
    const territories = [
        {
            "name": "Alaska",
            "continent": "North America",
            "top": 34,
            "left": 25,
            "neighbors": [
                "Kamchatka",
                "Northwest Territory",
                "Alberta"
            ]
        },
        {
            "name": "Northwest Territory",
            "continent": "North America",
            "top": 30,
            "left": 70,
            "neighbors": [
                "Alaska",
                "Alberta",
                "Ontario",
                "Greenland"
            ]
        },
        {
            "name": "Alberta",
            "continent": "North America",
            "top": 56,
            "left": 63,
            "neighbors": [
                "Alaska",
                "Northwest Territory",
                "Ontario",
                "Western United States"
            ]
        },
        {
            "name": "Ontario",
            "continent": "North America",
            "top": 65,
            "left": 97,
            "neighbors": [
                "Northwest Territory",
                "Alberta",
                "Greenland",
                "Quebec",
                "Western United States",
                "Eastern United States"
            ]
        },
        {
            "name": "Quebec",
            "continent": "North America",
            "top": 65,
            "left": 128,
            "neighbors": [
                "Ontario",
                "Greenland",
                "Eastern United States"
            ]
        },
        {
            "name": "Western United States",
            "continent": "North America",
            "top": 90,
            "left": 69,
            "neighbors": [
                "Alberta",
                "Ontario",
                "Eastern United States",
                "Central America"
            ]
        },
        {
            "name": "Eastern United States",
            "continent": "North America",
            "top": 97,
            "left": 106,
            "neighbors": [
                "Ontario",
                "Quebec",
                "Western United States",
                "Central America"
            ]
        },
        {
            "name": "Central America",
            "continent": "North America",
            "top": 132,
            "left": 75,
            "neighbors": [
                "Western United States",
                "Eastern United States",
                "Venezuela"
            ]
        },
        {
            "name": "Greenland",
            "continent": "North America",
            "top": 19,
            "left": 156,
            "neighbors": [
                "Northwest Territory",
                "Ontario",
                "Quebec",
                "Iceland"
            ]
        },
        {
            "name": "Venezuela",
            "continent": "South America",
            "top": 163,
            "left": 106,
            "neighbors": [
                "Central America",
                "Peru",
                "Brazil"
            ]
        },
        {
            "name": "Peru",
            "continent": "South America",
            "top": 197,
            "left": 96,
            "neighbors": [
                "Venezuela",
                "Brazil",
                "Argentina"
            ]
        },
        {
            "name": "Brazil",
            "continent": "South America",
            "top": 192,
            "left": 142,
            "neighbors": [
                "Venezuela",
                "Peru",
                "Argentina",
                "North Africa"
            ]
        },
        {
            "name": "Argentina",
            "continent": "South America",
            "top": 234,
            "left": 125,
            "neighbors": [
                "Peru",
                "Brazil"
            ]
        },
        {
            "name": "Iceland",
            "continent": "Europe",
            "top": 35,
            "left": 199,
            "neighbors": [
                "Greenland",
                "Scandinavia",
                "Great Britain"
            ]
        },
        {
            "name": "Great Britain",
            "continent": "Europe",
            "top": 81,
            "left": 178,
            "neighbors": [
                "Iceland",
                "Scandinavia",
                "Northern Europe",
                "Western Europe"
            ]
        },
        {
            "name": "Scandinavia",
            "continent": "Europe",
            "top": 53,
            "left": 236,
            "neighbors": [
                "Iceland",
                "Great Britain",
                "Northern Europe",
                "Ukraine"
            ]
        },
        {
            "name": "Ukraine",
            "continent": "Europe",
            "top": 66,
            "left": 277,
            "neighbors": [
                "Scandinavia",
                "Northern Europe",
                "Southern Europe",
                "Middle East",
                "Afghanistan",
                "Ural"
            ]
        },
        {
            "name": "Northern Europe",
            "continent": "Europe",
            "top": 91,
            "left": 234,
            "neighbors": [
                "Great Britain",
                "Scandinavia",
                "Ukraine",
                "Southern Europe",
                "Western Europe"
            ]
        },
        {
            "name": "Western Europe",
            "continent": "Europe",
            "top": 126,
            "left": 201,
            "neighbors": [
                "Great Britain",
                "Northern Europe",
                "Southern Europe",
                "North Africa"
            ]
        },
        {
            "name": "Southern Europe",
            "continent": "Europe",
            "top": 118,
            "left": 238,
            "neighbors": [
                "Ukraine",
                "Northern Europe",
                "Western Europe",
                "North Africa",
                "Egypt",
                "Middle East"
            ]
        },
        {
            "name": "North Africa",
            "continent": "Africa",
            "top": 174,
            "left": 212,
            "neighbors": [
                "Western Europe",
                "Southern Europe",
                "Egypt",
                "East Africa",
                "Congo",
                "Brazil"
            ]
        },
        {
            "name": "Egypt",
            "continent": "Africa",
            "top": 162,
            "left": 256,
            "neighbors": [
                "Southern Europe",
                "North Africa",
                "Middle East",
                "East Africa"
            ]
        },
        {
            "name": "East Africa",
            "continent": "Africa",
            "top": 194,
            "left": 275,
            "neighbors": [
                "North Africa",
                "Egypt",
                "Congo",
                "South Africa",
                "Madagascar",
                "Middle East"
            ]
        },
        {
            "name": "Congo",
            "continent": "Africa",
            "top": 214,
            "left": 257,
            "neighbors": [
                "North Africa",
                "East Africa",
                "South Africa"
            ]
        },
        {
            "name": "South Africa",
            "continent": "Africa",
            "top": 250,
            "left": 259,
            "neighbors": [
                "East Africa",
                "Congo",
                "Madagascar"
            ]
        },
        {
            "name": "Madagascar",
            "continent": "Africa",
            "top": 263,
            "left": 309,
            "neighbors": [
                "East Africa",
                "South Africa"
            ]
        },
        {
            "name": "Middle East",
            "continent": "Asia",
            "top": 144,
            "left": 293,
            "neighbors": [
                "Ukraine",
                "Southern Europe",
                "Egypt",
                "East Africa",
                "Afghanistan",
                "India"
            ]
        },
        {
            "name": "India",
            "continent": "Asia",
            "top": 140,
            "left": 339,
            "neighbors": [
                "Middle East",
                "Afghanistan",
                "China",
                "Siam"
            ]
        },
        {
            "name": "Siam",
            "continent": "Asia",
            "top": 158,
            "left": 381,
            "neighbors": [
                "India",
                "China",
                "Indonesia"
            ]
        },
        {
            "name": "Afghanistan",
            "continent": "Asia",
            "top": 100,
            "left": 317,
            "neighbors": [
                "Ukraine",
                "Middle East",
                "India",
                "China",
                "Ural"
            ]
        },
        {
            "name": "China",
            "continent": "Asia",
            "top": 116,
            "left": 367,
            "neighbors": [
                "India",
                "Siam",
                "Afghanistan",
                "Ural",
                "Siberia",
                "Mongolia"
            ]
        },
        {
            "name": "Ural",
            "continent": "Asia",
            "top": 59,
            "left": 321,
            "neighbors": [
                "Ukraine",
                "Afghanistan",
                "China",
                "Siberia"
            ]
        },
        {
            "name": "Siberia",
            "continent": "Asia",
            "top": 31,
            "left": 347,
            "neighbors": [
                "China",
                "Ural",
                "Mongolia",
                "Irkutsk",
                "Yakutsk"
            ]
        },
        {
            "name": "Mongolia",
            "continent": "Asia",
            "top": 88,
            "left": 383,
            "neighbors": [
                "China",
                "Siberia",
                "Irkutsk",
                "Kamchatka",
                "Japan"
            ]
        },
        {
            "name": "Irkutsk",
            "continent": "Asia",
            "top": 59,
            "left": 375,
            "neighbors": [
                "Siberia",
                "Mongolia",
                "Yakutsk",
                "Kamchatka"
            ]
        },
        {
            "name": "Yakutsk",
            "continent": "Asia",
            "top": 21,
            "left": 378,
            "neighbors": [
                "Siberia",
                "Irkutsk",
                "Kamchatka"
            ]
        },
        {
            "name": "Kamchatka",
            "continent": "Asia",
            "top": 29,
            "left": 409,
            "neighbors": [
                "Alaska",
                "Mongolia",
                "Irkutsk",
                "Yakutsk",
                "Japan"
            ]
        },
        {
            "name": "Japan",
            "continent": "Asia",
            "top": 97,
            "left": 440,
            "neighbors": [
                "Mongolia",
                "Kamchatka"
            ]
        },
        {
            "name": "Indonesia",
            "continent": "Australia",
            "top": 209,
            "left": 387,
            "neighbors": [
                "Siam",
                "New Guinea",
                "Western Australia"
            ]
        },
        {
            "name": "New Guinea",
            "continent": "Australia",
            "top": 188,
            "left": 437,
            "neighbors": [
                "Indonesia",
                "Western Australia",
                "Eastern Australia"
            ]
        },
        {
            "name": "Western Australia",
            "continent": "Australia",
            "top": 255,
            "left": 415,
            "neighbors": [
                "Indonesia",
                "New Guinea",
                "Eastern Australia"
            ]
        },
        {
            "name": "Eastern Australia",
            "continent": "Australia",
            "top": 245,
            "left": 446,
            "neighbors": [
                "New Guinea",
                "Western Australia"
            ]
        }
    ];
    /*[
        {
            "name": "Alaska",
            "continent": "North America",
            "top": 27,
            "left": 18,
            "neighbors": [
                "Kamchatka",
                "Northwest Territory",
                "Alberta"
            ],
            "index": 0
        },
        {
            "name": "Northwest Territory",
            "continent": "North America",
            "top": 23,
            "left": 63,
            "neighbors": [
                "Alaska",
                "Alberta",
                "Ontario",
                "Greenland"
            ],
            "index": 1
        },
        {
            "name": "Alberta",
            "continent": "North America",
            "top": 49,
            "left": 56,
            "neighbors": [
                "Alaska",
                "Northwest Territory",
                "Ontario",
                "Western United States"
            ],
            "index": 2
        },
        {
            "name": "Ontario",
            "continent": "North America",
            "top": 58,
            "left": 90,
            "neighbors": [
                "Northwest Territory",
                "Alberta",
                "Greenland",
                "Quebec",
                "Western United States",
                "Eastern United States"
            ],
            "index": 3
        },
        {
            "name": "Quebec",
            "continent": "North America",
            "top": 58,
            "left": 121,
            "neighbors": [
                "Ontario",
                "Greenland",
                "Eastern United States"
            ],
            "index": 4
        },
        {
            "name": "Western United States",
            "continent": "North America",
            "top": 83,
            "left": 62,
            "neighbors": [
                "Alberta",
                "Ontario",
                "Eastern United States",
                "Central America"
            ],
            "index": 5
        },
        {
            "name": "Eastern United States",
            "continent": "North America",
            "top": 90,
            "left": 99,
            "neighbors": [
                "Ontario",
                "Quebec",
                "Western United States",
                "Central America"
            ],
            "index": 6
        },
        {
            "name": "Central America",
            "continent": "North America",
            "top": 125,
            "left": 68,
            "neighbors": [
                "Western United States",
                "Eastern United States",
                "Venezuela"
            ],
            "index": 7
        },
        {
            "name": "Greenland",
            "continent": "North America",
            "top": 12,
            "left": 149,
            "neighbors": [
                "Northwest Territory",
                "Ontario",
                "Quebec",
                "Iceland"
            ],
            "index": 8
        },
        {
            "name": "Venezuela",
            "continent": "South America",
            "top": 156,
            "left": 99,
            "neighbors": [
                "Central America",
                "Peru",
                "Brazil"
            ],
            "index": 9
        },
        {
            "name": "Peru",
            "continent": "South America",
            "top": 190,
            "left": 89,
            "neighbors": [
                "Venezuela",
                "Brazil",
                "Argentina"
            ],
            "index": 10
        },
        {
            "name": "Brazil",
            "continent": "South America",
            "top": 185,
            "left": 135,
            "neighbors": [
                "Venezuela",
                "Peru",
                "Argentina",
                "North Africa"
            ],
            "index": 11
        },
        {
            "name": "Argentina",
            "continent": "South America",
            "top": 227,
            "left": 118,
            "neighbors": [
                "Peru",
                "Brazil"
            ],
            "index": 12
        },
        {
            "name": "Iceland",
            "continent": "Europe",
            "top": 28,
            "left": 192,
            "neighbors": [
                "Greenland",
                "Scandinavia",
                "Great Britain"
            ],
            "index": 13
        },
        {
            "name": "Great Britain",
            "continent": "Europe",
            "top": 74,
            "left": 171,
            "neighbors": [
                "Iceland",
                "Scandinavia",
                "Northern Europe",
                "Western Europe"
            ],
            "index": 14
        },
        {
            "name": "Scandinavia",
            "continent": "Europe",
            "top": 46,
            "left": 229,
            "neighbors": [
                "Iceland",
                "Great Britain",
                "Northern Europe",
                "Ukraine"
            ],
            "index": 15
        },
        {
            "name": "Ukraine",
            "continent": "Europe",
            "top": 59,
            "left": 270,
            "neighbors": [
                "Scandinavia",
                "Northern Europe",
                "Southern Europe",
                "Middle East",
                "Afghanistan",
                "Ural"
            ],
            "index": 16
        },
        {
            "name": "Northern Europe",
            "continent": "Europe",
            "top": 84,
            "left": 227,
            "neighbors": [
                "Great Britain",
                "Scandinavia",
                "Ukraine",
                "Southern Europe",
                "Western Europe"
            ],
            "index": 17
        },
        {
            "name": "Western Europe",
            "continent": "Europe",
            "top": 119,
            "left": 194,
            "neighbors": [
                "Great Britain",
                "Northern Europe",
                "Southern Europe",
                "North Africa"
            ],
            "index": 18
        },
        {
            "name": "Southern Europe",
            "continent": "Europe",
            "top": 111,
            "left": 231,
            "neighbors": [
                "Ukraine",
                "Northern Europe",
                "Western Europe",
                "North Africa",
                "Egypt",
                "Middle East"
            ],
            "index": 19
        },
        {
            "name": "North Africa",
            "continent": "Africa",
            "top": 167,
            "left": 205,
            "neighbors": [
                "Western Europe",
                "Southern Europe",
                "Egypt",
                "East Africa",
                "Congo",
                "Brazil"
            ],
            "index": 20
        },
        {
            "name": "Egypt",
            "continent": "Africa",
            "top": 155,
            "left": 249,
            "neighbors": [
                "Southern Europe",
                "North Africa",
                "Middle East",
                "East Africa"
            ],
            "index": 21
        },
        {
            "name": "East Africa",
            "continent": "Africa",
            "top": 187,
            "left": 268,
            "neighbors": [
                "North Africa",
                "Egypt",
                "Congo",
                "South Africa",
                "Madagascar",
                "Middle East"
            ],
            "index": 22
        },
        {
            "name": "Congo",
            "continent": "Africa",
            "top": 207,
            "left": 250,
            "neighbors": [
                "North Africa",
                "East Africa",
                "South Africa"
            ],
            "index": 23
        },
        {
            "name": "South Africa",
            "continent": "Africa",
            "top": 243,
            "left": 252,
            "neighbors": [
                "East Africa",
                "Congo",
                "Madagascar"
            ],
            "index": 24
        },
        {
            "name": "Madagascar",
            "continent": "Africa",
            "top": 256,
            "left": 302,
            "neighbors": [
                "East Africa",
                "South Africa"
            ],
            "index": 25
        },
        {
            "name": "Middle East",
            "continent": "Asia",
            "top": 137,
            "left": 286,
            "neighbors": [
                "Ukraine",
                "Southern Europe",
                "Egypt",
                "East Africa",
                "Afghanistan",
                "India"
            ],
            "index": 26
        },
        {
            "name": "India",
            "continent": "Asia",
            "top": 133,
            "left": 332,
            "neighbors": [
                "Middle East",
                "Afghanistan",
                "China",
                "Siam"
            ],
            "index": 27
        },
        {
            "name": "Siam",
            "continent": "Asia",
            "top": 151,
            "left": 374,
            "neighbors": [
                "India",
                "China",
                "Indonesia"
            ],
            "index": 28
        },
        {
            "name": "Afghanistan",
            "continent": "Asia",
            "top": 93,
            "left": 310,
            "neighbors": [
                "Ukraine",
                "Middle East",
                "India",
                "China",
                "Ural"
            ],
            "index": 29
        },
        {
            "name": "China",
            "continent": "Asia",
            "top": 109,
            "left": 360,
            "neighbors": [
                "India",
                "Siam",
                "Afghanistan",
                "Ural",
                "Siberia",
                "Mongolia"
            ],
            "index": 30
        },
        {
            "name": "Ural",
            "continent": "Asia",
            "top": 52,
            "left": 314,
            "neighbors": [
                "Ukraine",
                "Afghanistan",
                "China",
                "Siberia"
            ],
            "index": 31
        },
        {
            "name": "Siberia",
            "continent": "Asia",
            "top": 24,
            "left": 340,
            "neighbors": [
                "China",
                "Ural",
                "Mongolia",
                "Irkutsk",
                "Yakutsk"
            ],
            "index": 32
        },
        {
            "name": "Mongolia",
            "continent": "Asia",
            "top": 81,
            "left": 376,
            "neighbors": [
                "China",
                "Siberia",
                "Irkutsk",
                "Kamchatka",
                "Japan"
            ],
            "index": 33
        },
        {
            "name": "Irkutsk",
            "continent": "Asia",
            "top": 52,
            "left": 368,
            "neighbors": [
                "Siberia",
                "Mongolia",
                "Yakutsk",
                "Kamchatka"
            ],
            "index": 34
        },
        {
            "name": "Yakutsk",
            "continent": "Asia",
            "top": 14,
            "left": 371,
            "neighbors": [
                "Siberia",
                "Irkutsk",
                "Kamchatka"
            ],
            "index": 35
        },
        {
            "name": "Kamchatka",
            "continent": "Asia",
            "top": 22,
            "left": 402,
            "neighbors": [
                "Alaska",
                "Mongolia",
                "Irkutsk",
                "Yakutsk",
                "Japan"
            ],
            "index": 36
        },
        {
            "name": "Japan",
            "continent": "Asia",
            "top": 90,
            "left": 433,
            "neighbors": [
                "Mongolia",
                "Kamchatka"
            ],
            "index": 37
        },
        {
            "name": "Indonesia",
            "continent": "Australia",
            "top": 202,
            "left": 380,
            "neighbors": [
                "Siam",
                "New Guinea",
                "Western Australia"
            ],
            "index": 38
        },
        {
            "name": "New Guinea",
            "continent": "Australia",
            "top": 181,
            "left": 430,
            "neighbors": [
                "Indonesia",
                "Western Australia",
                "Eastern Australia"
            ],
            "index": 39
        },
        {
            "name": "Western Australia",
            "continent": "Australia",
            "top": 248,
            "left": 408,
            "neighbors": [
                "Indonesia",
                "New Guinea",
                "Eastern Australia"
            ],
            "index": 40
        },
        {
            "name": "Eastern Australia",
            "continent": "Australia",
            "top": 238,
            "left": 439,
            "neighbors": [
                "New Guinea",
                "Western Australia"
            ],
            "index": 41
        }
    ];*/

    /*for (let i = 0; i < territories.length; i++) {
        const territory = territories[i];
        territory.left += 7;
        territory.top += 7;
        delete(territory.index);
    }

    //console.log(JSON.stringify(territories, null, "    "));
    */

    for (let i = 0; i < territories.length; i++) {
        const territory = territories[i];
        territory.index = i;
        territory.color = "white";
        territory.numPieces = 0;
        territory.clickableByPlayerIndex = 0;
        territory.highlighted = "no-highlight";
        territory.explodeColor = false;
    }

    return territories;
}


const app = new Vue({
  el: '#calc1',
  data: {
    territories: getStandardTerritories(),
  },
  computed: {
  },
  methods: {
  },
  delimiters: ['[[',']]'],
});