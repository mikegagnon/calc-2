// TODO: only current player can undo/redo
// TODO: phaeReinforceArmiesAvailableForPlacement 
// TODO: elimination
// TODO: resignation
// TODO: detect victory

const TESTING = true;

const DEFAULT_CONFIG = {
    seed: 0,
    colors: ["brown", "blue", "green", "orange", "purple", "grey"],
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
    doAutoDropThree: true,
    autoDropForPhaseDropThreeVacancies: 0,
    startWithPrizeCards: {
        //0: ["heart", "heart", "heart", "diamond", "diamond", "diamond", "club", "club", "club", "club"],
        //0: ["heart", "heart", "heart"],
    }

};

/* Phases *********************************************************************/

const PHASE_SELECT_INIT_POSITIONS = "PHASE_SELECT_INIT_POSITIONS";
const PHASE_DROP_THREE = "PHASE_DROP_THREE";
const PHASE_PLAY_CARDS = "PHASE_PLAY_CARDS";
const PHASE_REINFORCE = "PHASE_REINFORCE";
const PHASE_CHOOSE_ACTION = "PHASE_CHOOSE_ACTION";
const PHASE_CHOOSE_ATTACKING_TERRITORY = "PHASE_CHOOSE_ATTACKING_TERRITORY";
const PHASE_CHOOSE_DEFENDING_TERRITORY = "PHASE_CHOOSE_DEFENDING_TERRITORY";
const PHASE_ANIMATE_ROLL = "PHASE_ANIMATE_ROLL";
const PHASE_CONCLUDE_ATTACK = "PHASE_CONCLUDE_ATTACK";
const PHASE_CHOOSE_REPEAT_OR_CANCEL = "PHASE_CHOOSE_REPEAT_OR_CANCEL";
const PHASE_FORTIFY = "PHASE_FORTIFY";
const PHASE_FORTIFY_SELECT_RECIPIENT = "PHASE_FORTIFY_SELECT_RECIPIENT"
const PHASE_CALCULATE = "PHASE_CALCULATE";
const PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY = "PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY";

/* DICE ***********************************************************************/

class Dice {

    // omit seed parameter for randomized seed
    constructor(seed) {
        this.random = new MersenneTwister(seed);
    }

    removeHighlights(containerDivId) {
        $(`${containerDivId} .dice img`).removeClass("diceHighlight");
    }

    hide(containerDivId) {
        $(containerDivId + " .red-die-1").addClass("hidden");
        $(containerDivId + " .red-die-2").addClass("hidden");
        $(containerDivId + " .red-die-3").addClass("hidden");
        $(containerDivId + " .white-die-1").addClass("hidden");
        $(containerDivId + " .white-die-2").addClass("hidden");
    }

    show(containerDivId) {
        $(containerDivId + " .red-die").removeClass("hidden");
        $(containerDivId + " .red-die img").addClass("hidden");
        $(containerDivId + " .white-die").removeClass("hidden");
        $(containerDivId + " .white-die img").addClass("hidden");
    }

    randValues(numRed, numWhite) {
        if (numRed < 1 || numRed > 3 || numWhite < 1 || numWhite > 2) {
            throw "Bad randValues";
        }

        const redValues = [];
        const whiteValues = [];

        for (let i = 0; i < numRed; i++) {
            redValues.push(Math.floor(this.random.random() * 6) + 1);
        }
        for (let i = 0; i < numWhite; i++) {
            whiteValues.push(Math.floor(this.random.random() * 6) + 1);
        }

        const numWins = Math.min(numRed, numWhite);
        const redValuesSorted = [...redValues].sort().reverse();
        const whiteValuesSorted = [...whiteValues].sort().reverse();
        let numRedWins = 0;
        let numWhiteWins = 0;
        const redWinIndices = [];
        const whiteWinIndices = [];

        for (let i = 0; i < numWins; i++) {
            const redValue = redValuesSorted[i];
            const whiteValue = whiteValuesSorted[i];

            if (redValue > whiteValue) {
                numRedWins++;
                for (let j = 0; j < redValues.length; j++) {
                    if (redValues[j] == redValue && !redWinIndices.includes(j)) {
                        redWinIndices.push(j);
                        break;
                    }
                }
            } else {
                numWhiteWins++;
                for (let j = 0; j < whiteValues.length; j++) {
                    if (whiteValues[j] == whiteValue && !whiteWinIndices.includes(j)) {
                        whiteWinIndices.push(j);
                        break;
                    }
                }
            }
        }

        return {
            "red": redValues,
            "white": whiteValues,
            "numRedWins": numRedWins,
            "numWhiteWins": numWhiteWins,
            "redWinIndices": redWinIndices,
            "whiteWinIndices": whiteWinIndices,
        };
    }

    roll(containerDivId, divId, finalValue, numRolls, callback) {
        const delay = 80;
        let count = 0;
        const THIS = this;
        const interval = setInterval(function(){
            let done = false;
            count++;
            let val;
            if (count === numRolls) {
                clearInterval(interval);
                val = finalValue - 1;
                done = true;
            } else {
                val = Math.floor(THIS.random.random() * 6);
            }

            $(`${containerDivId} .${divId} img`).addClass("hidden")
            $(`${containerDivId} .${divId} img`).eq(val).removeClass("hidden");

            if (done && callback) {
                callback();
            }

        }, delay);
    } 

    highlightDice(containerDivId, finalValues) {
        for (let i = 0; i < finalValues.redWinIndices.length; i++) {
            const index = finalValues.redWinIndices[i];
            const selector = `${containerDivId} .red-die-${index + 1} img`;
            const value = finalValues.red[index];
            $(selector).eq(value - 1).addClass("diceHighlight");
        }
        for (let i = 0; i < finalValues.whiteWinIndices.length; i++) {
            const index = finalValues.whiteWinIndices[i];
            const selector = `${containerDivId} .white-die-${index + 1} img`;
            const value = finalValues.white[index];
            $(selector).eq(value - 1).addClass("diceHighlight");
        }
    }

    animate(containerDivId, finalValues, finalCallback) {
        this.removeHighlights(containerDivId);
        //this.hide();
        let numRolls = 10;
        const step = 10;
        if (finalValues.red.length >= 1) {
            this.roll(containerDivId, "red-die-1", finalValues.red[0], numRolls);
            numRolls += step;
        }
        if (finalValues.red.length >= 2) {
            this.roll(containerDivId, "red-die-2", finalValues.red[1], numRolls);
            numRolls += step;
        } else {
            $(`${containerDivId} .red-die-2 img`).addClass("hidden");
        }
        if (finalValues.red.length >= 3) {
            this.roll(containerDivId, "red-die-3", finalValues.red[2], numRolls);
            numRolls += step;
        } else {
            $(`${containerDivId} .red-die-3 img`).addClass("hidden");
        }
        if (finalValues.white.length >= 1) {
            let callback = false;
            if (finalValues.white.length == 1) {
                const THIS = this;
                callback = function() {
                    THIS.highlightDice(containerDivId, finalValues);
                    finalCallback();
                }
            }

            this.roll(containerDivId, "white-die-1", finalValues.white[0], numRolls, callback);
            numRolls += step;
        }
        if (finalValues.white.length >= 2) {
            const THIS = this;
            let callback = function() {
                THIS.highlightDice(containerDivId, finalValues);
                finalCallback();

            }
            this.roll(containerDivId, "white-die-2", finalValues.white[1], numRolls, callback);
        } else {
            $(`${containerDivId } .white-die-2 img`).addClass("hidden");
        }

        this.show(containerDivId);

    }
}

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

    constructor(templateDivId, divId, server, dice, config) {
        $(templateDivId + " .calc-container").clone().appendTo(divId);
        this.id = Math.floor(Math.random() * 999999999); // intentionally avoiding MersenneTwister here
        this.serverCount = 0;
        this.config = config;
        this.observedExplosions = new Set();
        this.dice = dice;
        this.divId = divId;
        //this.dice.containerDivId = "divId";

        //this.explosionTimeouts = {};

        if ("seed" in this.config) {
            this.random = new MersenneTwister(this.config.seed);
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
        
        this.app = this.initApp(this.divId);

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
            prizeSchedule: this.app.prizeSchedule,
            explosions: this.app.explosions,
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
        this.app.prizeSchedule = state.prizeSchedule;
        this.app.currentPhase = state.currentPhase;

        const THIS = this;
        /*this.app.explosions = state
            .explosions
            .filter(e => !THIS.observedExplosions.has(e.id));
        */
        /*for (let i = 0; i < this.app.explosions.length; i++) {
            const e = this.app.explosions[i];
            this.observedExplosions.add(e.id);
        }*/

        // TODO: this should not be here?
        const oldExplosions = new Set(this.app.explosions.map(e => e.id));
        const newExplosions = []
        for (let i = 0; i < state.explosions.length; i++) {
            const explosion = state.explosions[i];

            // If explosion is new, set a timer to remove it
            if (!oldExplosions.has(explosion.id)) {
                const THIS = this;
                setTimeout(function(){
                    THIS.removeExplosion(explosion.id);
                }, this.config.explosionDuration);
            }
        }
        this.app.explosions = state.explosions;

        if (this.app.currentPhase === PHASE_ANIMATE_ROLL) {
            this.dice.animate(this.divId, this.app.currentPlayer.rollResult, function(){ });
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
                simTerritories: this.getSimTerritories(),
                prizeSchedule: this.getInitPrizeSchedule(),
                explosions: [],
                currentPhase: "undefined",

                // Non serialized state
                undoAvailable: false,
                redoAvailable: false,
                thisPlayerIndex: 0, //hack: should really be -1 or something like that
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
                showDice: function() {
                    return this.currentPlayer.showDice;
                },
                thisPlayer: function() {
                    return this.players[this.thisPlayerIndex];
                },
                playerHasCard: function() {
                    return this.thisPlayer && this.numTotalCards(this.thisPlayer) > 0;
                },
                hasPretendSet: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        this.numTotalCards(this.currentPlayer) >= 3 &&
                        !this.hasAtLeastOneCardSet(this.currentPlayer);
                },
                hasOptionalSet: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        this.hasAtLeastOneCardSet(this.currentPlayer) &&
                        this.numTotalCards(this.currentPlayer) < 5;
                },
                hasMandatorySet: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        this.numTotalCards(this.currentPlayer) >= 5;
                },
                hasChooseActionButtons: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        this.currentPhase === PHASE_CHOOSE_ACTION;
                },
                hasCancelAttackButton: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        (this.currentPhase === PHASE_CHOOSE_ATTACKING_TERRITORY ||
                         this.currentPhase === PHASE_CHOOSE_DEFENDING_TERRITORY);
                },
                showButtons: function() {
                    return (this.currentPhase === PHASE_PLAY_CARDS &&
                                (this.hasPretendSet ||
                                 this.hasOptionalSet ||
                                 this.hasMandatorySet) ||
                            (this.hasChooseActionButtons ||
                             this.hasCancelAttackButton ||
                             this.phaseRepeatOrCancel ||
                             this.phaseFortificySelectRecipient));
                },
                abridgedPrizeSchedule: function() {
                    return this.prizeSchedule.slice(0, 8);
                },
                nextPrize: function() {
                    let value = undefined;
                    for (let i = 0; i < this.prizeSchedule.length; i++) {
                        const prize = this.prizeSchedule[i];
                        if (prize.active) {
                            value = prize.value;
                        }
                    }
                    return value;
                },
                phaseRepeatOrCancel: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        this.currentPhase === PHASE_CHOOSE_REPEAT_OR_CANCEL;
                },
                phaseFortificySelectRecipient: function() {
                    return this.thisPlayer.index === this.currentPlayer.index &&
                        (this.currentPhase === PHASE_FORTIFY_SELECT_RECIPIENT ||
                        this.currentPhase === PHASE_FORTIFY);
                },
            },
            methods: {
                clickAttack() {
                    //console.log("Attack")
                    THIS.clickAttack();
                },
                clickCancelFortification() {
                    THIS.clickCancelFortification();
                },
                clickCalculate() {
                    THIS.clickCalculate();
                },
                clickPass() {
                    THIS.clickPass();
                },
                clickRepeatAttack() {
                    THIS.clickRepeatAttack();
                },
                clickFortify() {
                    THIS.clickFortify()
                },
                clickCancelAttack() {
                    THIS.clickCancelAttack();
                },
                clickPretend() {
                    THIS.clickPretend();
                },
                clickDoNotPlay() {
                    THIS.clickDoNotPlay();
                },
                clickPlayCards() {
                    THIS.clickPlayCards();
                },
                clickMustPlayCards() {
                    THIS.clickMustPlayCards();
                },
                hasAtLeastOneCardSet(player) {
                    if (player.numHearts >= 3) {
                        return true;
                    } else if (player.numClubs >= 3) {
                        return true;
                    } else if (player.numDiamonds >= 3) {
                        return true;
                    } else if (player.numHearts >= 1 && player.numClubs >= 1 && player.numDiamonds >= 1) {
                        return true;
                    } else {
                        return false;
                    }
                },
                numTotalCards(player) {
                    return player.numHearts + player.numClubs + player.numDiamonds;
                },
                territoryId: function(territory) {
                    return THIS.id + "-" + territory.index;
                },
                simTerritoryId: function(territory) {
                    return THIS.id + "-sim-" + territory.index;
                },
                playerNameText: function(player) {
                    const c = this.numTotalCards(player);
                    if (c === 0) {
                        return player.name;
                    } else if (c === 1) {
                        return `${player.name} has 1 card`;
                    } else {
                        return `${player.name} has ${c} cards`;
                    }
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
                    return THIS.territoryText(territory);
                },
                simTerritoryText: function(territory) {
                    return THIS.simTerritoryText(territory);
                }
            },
            delimiters: ["[[","]]"],
        });
        return app;
    }

    /* Generic game logic *****************************************************/

    territoryText(territory) {
        if (territory.numPieces === 0) {
            return "";
        }
        // TODO: check to make sure it's the right phase
        else if (this.app && this.app.currentPlayer.attackForce > 0 && this.app.currentPlayer.attackingTerritoryIndex === territory.index) {
            return `${this.app.currentPlayer.attackForce}/${territory.numPieces}`;
        } else if (this.app && this.app.currentPhase === PHASE_FORTIFY_SELECT_RECIPIENT && territory.index === this.app.currentPlayer.fortifyDonorTerritoryIndex) {
            const a = this.app.currentPlayer.fortifyNumArmies;
            const b = territory.numPieces;
            return `${a}/${b}`;

        // TODO: more general phase condition
        } else if (this.app &&
            (this.app.currentPhase === PHASE_CALCULATE  || this.app.currentPhase === PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY) &&
            this.app.currentPlayer.simAttackForce > 0 &&
            this.app.currentPlayer.simAttackingTerritoryIndex === territory.index) {
            const a = this.app.currentPlayer.simAttackForce;
            const b = territory.numPieces;
            return `${a}/${b}`;
        } else {
            return territory.numPieces;
        }
    }

    simTerritoryText(territory) {
        return "1";
    }

    clickTerritory(territory) {
        if (!this.app.territoryClickable(territory)) {
            return;
        }

        if (this.app.currentPhase === PHASE_SELECT_INIT_POSITIONS) {
            this.clickTerritoryForPhaseSelectInitPositions(territory);
        } else if (this.app.currentPhase === PHASE_DROP_THREE) {
            this.clickTerritoryForPhaseDropThree(territory);
        } else if (this.app.currentPhase === PHASE_REINFORCE) {
            this.clickTerritoryForPhaseReinforce(territory);
        } else if (this.app.currentPhase === PHASE_CHOOSE_ATTACKING_TERRITORY) {
            this.clickTerritoryForPhaseChooseAttackingTerritory(territory);
        } else if (this.app.currentPhase === PHASE_CHOOSE_DEFENDING_TERRITORY) {
            this.clickTerritoryForPhaseChooseDefendingTerritory(territory);
        } else if (this.app.currentPhase === PHASE_FORTIFY) {
            this.clickTerritoryForPhaseFortify(territory);
        } else if (this.app.currentPhase === PHASE_FORTIFY_SELECT_RECIPIENT) {
            this.clickTerritoryForPhaseFortifySelectRecipient(territory);
        } else if (this.app.currentPhase === PHASE_CALCULATE) {
            this.clickTerritoryForPhaseCalculate(territory);
        } else if (this.app.currentPhase === PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY) {
            this.clickTerritoryForPhaseCalculateChooseDefendingTerritory(territory);
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
        nextPlayer.showDice = false;
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
        } else if (this.app.currentPhase === PHASE_PLAY_CARDS) {
            return this.getPlayerInstructionForPhasePlayCards(player);
        } else if (this.app.currentPhase === PHASE_REINFORCE) {
            return this.getPlayerInstructionForPhaseReinforce(player);
        } else if (this.app.currentPhase === PHASE_CHOOSE_ACTION) {
            return this.getPlayerInstructionForPhaseChooseAction(player);
        } else if (this.app.currentPhase === PHASE_CHOOSE_ATTACKING_TERRITORY) {
            return this.getPlayerInstructionForPhaseChooseAttackingTerritory(player);
        } else if (this.app.currentPhase === PHASE_CHOOSE_DEFENDING_TERRITORY) {
            return this.getPlayerInstructionForPhaseChooseDefendingTerritory(player);
        } else if (this.app.currentPhase === PHASE_ANIMATE_ROLL) {
            return this.getPlayerInstructionForPhaseAnimateRoll(player)
        } else if (this.app.currentPhase === PHASE_CHOOSE_REPEAT_OR_CANCEL) {
            return this.getPlayerInstructionForChooseRepeatOrCancel(player);
        } else if (this.app.currentPhase === PHASE_FORTIFY) {
            return this.getPlayerInstructionForPhaseFortify(player);
        } else if (this.app.currentPhase === PHASE_FORTIFY_SELECT_RECIPIENT) {
            return this.getPlayerInstructionForPhaseFortifySelectRecipient(player);
        } else if (this.app.currentPhase === PHASE_CALCULATE) {
            return this.getPlayerInstructionForPhaseCalculate(player);
        } else if (this.app.currentPhase === PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY) {
            return this.getPlayerInstructionForPhaseCalculateChooseDefendingTerritory(player);
        } else {
            throw "Bad phase in getPlayerInstruction";
        }
        
    }

    removeExplosion(explosionId) {
        this.app.explosions = this.app.explosions.filter(e => e.id != explosionId);
    }

    explodeTerritory(territory) {

        const angles = ["exploding-a", "exploding-b", "exploding-c", "exploding-d"];

        // numExplosionsOnThisTerritoryAlready
        const n = this.app.explosions.filter(e => e.territoryIndex === territory.index).length;

        const angle = angles[n % angles.length];

        const explosionId = Math.floor(Math.random() * 9999999); // intentionally avoiding mersene twister
        this.app.explosions.push({
            territoryIndex: territory.index,
            id: explosionId, // avoiding mersene here
            color: territory.color,
            angle: angle,
            classes: [territory.color, angle],
        });

        const THIS = this;
        setTimeout(function(){
            THIS.removeExplosion(explosionId);
        }, this.config.explosionDuration);

        // TODO: timeout

        //territory.explodeColor = territory.color;
        //setTimeout(function(){territory.explodeColor = false}, this.config.explosionDuration);
    }

    getClickableTerritories() {
        const THIS = this;
        return this.app
            .territories
            .filter(function(t) {
                return t.clickableByPlayerIndex === THIS.app.currentPlayer.index;
            });
    }

    setClickableNone() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            territory.clickableByPlayerIndex = -1;
        }   
    }

    areNeighbors(t1, t2) {
        for (let i = 0; i < t1.neighbors.length; i++) {
            const neighborName = t1.neighbors[i];
            if (t2.name === neighborName) {
                return true;
            }
        }

        return false;
    }

    getNeighbors(territory) {
        const THIS = this;
        return this
            .app
            .territories
            .filter(function(t){ return THIS.areNeighbors(territory, t) });
    }

    // TODO: where else should we call this?
    removeHighlights() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            territory.highlighted = false;
        }
    }

    /* beginPhaseCalculateChooseDefendingTerritory ****************************/

    beginPhaseCalculateChooseDefendingTerritory() {
        this.app.currentPhase = PHASE_CALCULATE_CHOOSE_DEFENDING_TERRITORY;
        this.setClickableForPhaseCalculateChooseDefendingTerritory();
        this.setInstructions();
    }

    clickTerritoryForPhaseCalculateChooseDefendingTerritory(territory) {
        console.log("clickTerritoryForPhaseCalculateChooseDefendingTerritory");
        //const simAttackingTerritory = this.app.territories[player.simAttackingTerritoryIndex];
        this.explodeTerritory(territory);
        if (territory.index === player.simAttackingTerritoryIndex) {
            this.incrementSimNumArmies(territory);
            this.setInstructions();
        } else {
            //selectFreeMoveRecipient(app, territory);
            /*this.setClickableNone();
            //setInstructions(app);
            this.removeHighlights();
            territory.numPieces += this.app.currentPlayer.fortifyNumArmies;
            const donorTerritory = this.app.territories[donorIndex];
            donorTerritory.numPieces -= this.app.currentPlayer.fortifyNumArmies;
            this.clickPass();*/
        }
    }

    incrementSimNumArmies(territory) {
        this.app.currentPlayer.simAttackForce++;
        if (this.app.currentPlayer.simAttackForce === territory.numPieces - 1) {
            this.setClickableForPhaseCalculateChooseDefendingTerritory();
        }
    }

    setClickableForPhaseCalculateChooseDefendingTerritory() {
        this.setClickableNone();
        const player = this.app.currentPlayer;
        
        const simAttackingTerritory = this.app.territories[player.simAttackingTerritoryIndex];
        if (player.simAttackForce < simAttackingTerritory.numPieces - 1) {
            simAttackingTerritory.clickableByPlayerIndex = this.app.currentPlayer.index;    
        }

        const possibleDefenders = this.getNeighbors(simAttackingTerritory)
            .filter(function(otherTerritory){
                return otherTerritory.color !== simAttackingTerritory.color;
            });

        for (let i = 0; i < possibleDefenders.length; i++) {
            const territory = possibleDefenders[i];
            territory.clickableByPlayerIndex = this.app.currentPlayer.index;
        } 
    }

    getPlayerInstructionForPhaseCalculateChooseDefendingTerritory(player) {
        const simAttackingTerritory = this.app.territories[player.simAttackingTerritoryIndex];
        if (player.simAttackForce === simAttackingTerritory.numPieces - 1) {
            return "You cannot add any more armies to the simulated attack. Choose which territory to attack in the simulation. Or, cancel the simulated attack.";
        } else {
            return "Click the simulated attacking territory again to add another army to the simulated attack. Or, choose which territory to attack in the simulation. Or, cancel the simulated attack.";
        }
    }

    /* beginPhaseCalculate ****************************************************/
    beginPhaseCalculate() {
        this.app.currentPhase = PHASE_CALCULATE;
        this.app.currentPlayer.simAttackForce = 0;
        this.app.currentPlayer.simAttackingTerritoryIndex = -1;
        this.setClickableForPhaseCalculate();
        this.setInstructions();
        this.saveState();
    }

    setClickableForPhaseCalculate() {
        this.setClickableForPhaseChooseAttackingTerritory();
    }

    clickTerritoryForPhaseCalculate(territory) {
        console.log("click clickTerritoryForPhaseCalculate");
        territory.highlighted = true;
        territory.highlightColor = "highlight-red";
        this.app.currentPlayer.simAttackForce = 1; // ddd
        this.app.currentPlayer.simAttackingTerritoryIndex = territory.index;
        this.explodeTerritory(territory);
        this.beginPhaseCalculateChooseDefendingTerritory();
    }

    getPlayerInstructionForPhaseCalculate() {
        return "Choose which territory will conduct the simulated attack";
    }

    /* beginPhaseFortifySelectRecipient ***************************************/

    beginPhaseFortifySelectRecipient() {
        this.app.currentPhase = PHASE_FORTIFY_SELECT_RECIPIENT;
        this.setClickableForPhaseFortifySelectRecipients();
        this.setInstructions();
        this.saveState();
    }

    setClickableForPhaseFortifySelectRecipients() {
        this.setClickableNone();

        const donorTerritory = this.app.territories[this.app.currentPlayer.fortifyDonorTerritoryIndex];
        if (this.app.currentPlayer.fortifyNumArmies < donorTerritory.numPieces - 1) {
            donorTerritory.clickableByPlayerIndex = this.app.currentPlayer.index;    
        }

        const possibleRecipients = this.getNeighbors(donorTerritory)
            .filter(function(otherTerritory){
                return otherTerritory.color === donorTerritory.color;
            });

        for (let i = 0; i < possibleRecipients.length; i++) {
            const territory = possibleRecipients[i];
            territory.clickableByPlayerIndex = this.app.currentPlayer.index;
        } 
    }

    clickTerritoryForPhaseFortifySelectRecipient(territory) {
        const donorIndex = this.app.currentPlayer.fortifyDonorTerritoryIndex;
        this.explodeTerritory(territory);
        if (territory.index === donorIndex) {
            this.incrementFortifyNumArmies(territory);
            this.setInstructions();
        } else {
            //selectFreeMoveRecipient(app, territory);
            this.setClickableNone();
            //setInstructions(app);
            this.removeHighlights();
            territory.numPieces += this.app.currentPlayer.fortifyNumArmies;
            const donorTerritory = this.app.territories[donorIndex];
            donorTerritory.numPieces -= this.app.currentPlayer.fortifyNumArmies;
            this.clickPass();
        }
    }

    incrementFortifyNumArmies(territory) {
        this.app.currentPlayer.fortifyNumArmies++;
        if (this.app.currentPlayer.fortifyNumArmies === territory.numPieces - 1) {
            this.setClickableForPhaseFortifySelectRecipients();
        }
    }

    getPlayerInstructionForPhaseFortifySelectRecipient() {
        const donorTerritory = this.app.territories[this.app.currentPlayer.fortifyDonorTerritoryIndex];
        if (this.app.currentPlayer.fortifyNumArmies === donorTerritory.numPieces - 1) {
            return "You cannot add any more armies to the fortification. Choose which territory to receive the fortification. Or, cancel the fortification.";
        } else {
            return "Click the 'donor' territory again to add another army to your fortification. Or, choose which territory to receive the fortification. Or, cancel the fortification.";
        }
    }

    clickCancelFortification() {
        this.removeHightlights(); // TODO: spell correct
        this.beginPhaseChooseAction();
    }

    /* beginPhaseFortify ******************************************************/

    beginPhaseFortify() {
        this.app.currentPhase = PHASE_FORTIFY;
        this.app.currentPlayer.showDice = false;
        this.removeHighlights();
        this.setClickableForPhaseFortify();
        this.setInstructions();
        this.saveState();
    }

    clickTerritoryForPhaseFortify(territory) {
        //console.log("clickTerritoryForPhaseFortify");
        this.explodeTerritory(territory);
        this.removeHighlights();
        territory.highlighted = true;
        territory.highlightColor = "highlight-black";
        this.app.currentPlayer.fortifyDonorTerritoryIndex = territory.index;
        this.app.currentPlayer.fortifyNumArmies = 1;
        this.beginPhaseFortifySelectRecipient();
        /*app.phase = PLAYERS_MAIN_PHASE_FREEMOVE_SELECT_RECIPIENT;
        */
    }

    getPlayerInstructionForPhaseFortify(player) {
        return "Click one of your territories with at least 2 armies. Each time you click the territory, you will increase the number of armies that you will move to an adjacnet territory."
    }

    setClickableForPhaseFortify() {
        const player = this.app.currentPlayer;

        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.color === player.color && territory.numPieces > 1) {
                territory.clickableByPlayerIndex = player.index;
            } else {
                territory.clickableByPlayerIndex = -1;
            }
        }
    }

    /* beginPhaseChooseRepeatOrCancel *****************************************/

    beginPhaseChooseRepeatOrCancel() {
        this.app.currentPhase = PHASE_CHOOSE_REPEAT_OR_CANCEL;
        this.setInstructions();
        this.saveState();
    }

    
    getPlayerInstructionForChooseRepeatOrCancel(player) {
        return "Repeat the same attack, or cancel the attack";
    }

    clickRepeatAttack() {
        console.log("repeat");
        const defenderTerritory = this.app.territories[this.app.currentPlayer.defendingTerritoryIndex];
        this.selectDefendingTerritory(defenderTerritory);
        this.app.currentPlayer.rollResult = this.getRandomAttackRoll(defenderTerritory);
        this.app.currentPlayer.showDice = true;
        const THIS = this; 
        this.dice.animate(this.divId, this.app.currentPlayer.rollResult, function() {
            THIS.beginPhaseDisplayRollResult();
        });
    }

    /* beginPhaseDisplayRollResult ********************************************/
    
    beginPhaseDisplayRollResult() {
        //console.log("beginPhaseAnimateRoll");
        this.app.currentPhase = PHASE_CONCLUDE_ATTACK;
        const player = this.app.currentPlayer;
        const numRedWins = player.rollResult.numRedWins;
        const numWhiteWins = player.rollResult.numWhiteWins;
        const attackingTerritory = this.app.territories[player.attackingTerritoryIndex];
        const defendingTerritory = this.app.territories[player.defendingTerritoryIndex];
        //const attackForce 

        let offerAgain = true;
        let attackVictory = false;

        attackingTerritory.numPieces -= numWhiteWins;
        if (player.attackForce >= attackingTerritory.numPieces) {
            player.attackForce = attackingTerritory.numPieces - 1;
            if (player.attackForce <= 0) {
                player.attackForce = 0;
                offerAgain = false;
            }
        }

        defendingTerritory.numPieces -= numRedWins;
        if (defendingTerritory.numPieces <= 0) {
            defendingTerritory.numPieces = 0;
            attackVictory = true;
            offerAgain = false;
        }

        if (attackVictory) {

            if (!player.receivedCardThisTurn) {
                player.receivedCardThisTurn = true;
                const cardType = Math.floor(this.random.random() * 3);
                if (cardType === 0) {
                    player.numHearts++;
                } else if (cardType === 1) {
                    player.numClubs++;
                } else {
                    player.numDiamonds++;
                }
            }


            defendingTerritory.color = attackingTerritory.color;
            defendingTerritory.numPieces = player.attackForce;
            attackingTerritory.numPieces -= player.attackForce;
            player.attackForce = 0;

            this.explodeTerritory(defendingTerritory);

            // TODO: test
            this.beginPhaseChooseAction();

            //app.phase = PLAYERS_MAIN_PHASE_CHOOSE_ATTACK_OR_PASS;
            /*defendingTerritory.isExploding = defendingTerritory.color;
            setTimeout(function(){ territory.isExploding = null}, 2000);
            attackingTerritory.isExploding = attackingTerritory.color;
            setTimeout(function(){ territory.isExploding = null}, 2000);*/
            /*PICKLES.push(pickle(app));
            postGameState(app);*/
                
        } else if (offerAgain) {
            if (numRedWins > 0) {
                this.explodeTerritory(defendingTerritory);
            }
            if (numWhiteWins > 0) {
                this.explodeTerritory(attackingTerritory);
            }
            //app.phase = PLAYERS_MAIN_PHASE_CHOOSE_REPEAT_OR_CANCEL;
            console.log("offerAgain");
            this.beginPhaseChooseRepeatOrCancel();
        } else {
            //app.phase = PLAYERS_MAIN_PHASE_CHOOSE_ATTACK_OR_PASS;
            console.log("do not offerAgain");
            if (numRedWins > 0) {
                this.explodeTerritory(defendingTerritory);
            }
            if (numWhiteWins > 0) {
                this.explodeTerritory(attackingTerritory);
            }

            // TODO: test
            this.beginPhaseChooseAction();
        }
    }



    /* beginPhaseAnimateRoll **************************************************/

    beginPhaseAnimateRoll() {
        this.setClickableNone();
        //this.app.c
        this.app.currentPhase = PHASE_ANIMATE_ROLL;
        const rollResult = this.app.currentPlayer.rollResult;
        const THIS = this;
        this.app.currentPlayer.showDice = true;
        this
            .dice
            .animate(this.divId, rollResult, function() {
                THIS.beginPhaseDisplayRollResult();
            });
        this.setInstructions()
        this.saveState();
    }

    getPlayerInstructionForPhaseAnimateRoll() {
        return "Waiting for dice to land...";
    }

    /* beginPhaseChooseDefendingTerritory *************************************/

    beginPhaseChooseDefendingTerritory() {
        this.app.currentPhase = PHASE_CHOOSE_DEFENDING_TERRITORY;
        this.setClickableForPhaseChooseDefendingTerritory();
        this.setInstructions();
        this.saveState();
    }

    getPlayerInstructionForPhaseChooseDefendingTerritory(player) {
        const attackingTerritory = this.app.territories[player.attackingTerritoryIndex];
        if (player.attackForce === attackingTerritory.numPieces - 1) {
            return "You cannot add any more armies to the attack. Choose which territory to attack. Or, cancel the attack.";
        } else {
            return "Click the attacking territory again to add another army to the attack. Or, choose which territory to attack. Or, cancel the attack.";                
        }
    }

    setClickableForPhaseChooseDefendingTerritory() {
        this.setClickableNone();

        const attackingTerritory = this.app.territories[this.app.currentPlayer.attackingTerritoryIndex];
        if (this.app.currentPlayer.attackForce < attackingTerritory.numPieces - 1) {
            attackingTerritory.clickableByPlayerIndex = this.app.currentPlayer.index;
        }

        const possibleDefenders = this
            .getNeighbors(attackingTerritory)
            .filter(function(otherTerritory){
                return otherTerritory.color !== attackingTerritory.color;
            });

        for (let i = 0; i < possibleDefenders.length; i++) {
            const territory = possibleDefenders[i];
            territory.clickableByPlayerIndex = this.app.currentPlayer.index;
        }
    }

    clickTerritoryForPhaseChooseDefendingTerritory(territory) {
        if (territory.index === this.app.currentPlayer.attackingTerritoryIndex) {
            this.incrementAttackForce(territory);
            this.setInstructions();
            this.explodeTerritory(territory);
            this.saveState();
        } else {
            this.explodeTerritory(territory);
            this.selectDefendingTerritory(territory);
            this.beginPhaseAnimateRoll();
        }
    }

    incrementAttackForce(territory) {
        this.app.currentPlayer.attackForce += 1;
        if (this.app.currentPlayer.attackForce === territory.numPieces - 1) {
            this.setClickableForPhaseChooseDefendingTerritory();
        }
    }

    selectDefendingTerritory(defendingTerritory) {
        this.setClickableNone();
        defendingTerritory.highlighted = true;
        defendingTerritory.highlightColor = "highlight-black";
        this.app.currentPlayer.defendingTerritoryIndex = defendingTerritory.index;
        this.app.currentPlayer.rollResult = this.getRandomAttackRoll(defendingTerritory);

        /*app.phase = PLAYERS_MAIN_PHASE_ANIMATE_ATTACK;
        app.defendingTerritoryIndex = defendingTerritory.index;
        app.attackRollResult = getRandomAttackRoll(app);
        setInstructions(app);*/
    }

    getRandomAttackRoll(defendingTerritory) {
        const numRed = Math.min(this.app.currentPlayer.attackForce, 3);
        const numWhite = Math.min(defendingTerritory.numPieces, 2);
        return this.dice.randValues(numRed, numWhite);
    }



    /* beginPhaseChooseAttackingTerritory *************************************/
    
    beginPhaseChooseAttackingTerritory() {
        this.app.currentPhase = PHASE_CHOOSE_ATTACKING_TERRITORY;
        this.app.currentPlayer.attackForce = 0;
        this.app.currentPlayer.attackingTerritoryIndex = -1;
        this.setClickableForPhaseChooseAttackingTerritory();
        this.setInstructions();
        this.saveState();
    }

    setClickableForPhaseChooseAttackingTerritory() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.color === this.app.currentPlayer.color && territory.numPieces > 1) {
                territory.clickableByPlayerIndex = this.app.currentPlayer.index;
            } else {
                territory.clickableByPlayerIndex = -1;
            }
        }
    }

    clickTerritoryForPhaseChooseAttackingTerritory(territory) {
        //console.log(territory.numPieces);
        territory.highlighted = true;
        territory.highlightColor = "highlight-red";
        //this.app.currentPhase = PLAYERS_MAIN_PHASE_CHOOSE_DEFENDING_TERRITORY;
        //app.attackingTerritoryIndex = territory.index;
        this.app.currentPlayer.attackForce = 1;
        this.app.currentPlayer.attackingTerritoryIndex = territory.index;
        this.explodeTerritory(territory);

        //setClickableDefenders(app);
        //this.setInstructions();
        //this.saveState();
        this.beginPhaseChooseDefendingTerritory();
    }

    getPlayerInstructionForPhaseChooseAttackingTerritory(player) {
        return "Choose which territory will conduct the attack";
    }

    clickCancelAttack() {
        this.app.currentPlayer.attackForce = -1;
        this.removeHightlights(); // TODO: spell correct
        this.beginPhaseChooseAction();

        //console.log("cancel");
    }

    removeHightlights() {
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            territory.highlighted = false;
            territory.highlightColor = "no-highlight";
        }
    }

    /* beginPhaseChooseAction *************************************************/
    
    beginPhaseChooseAction() {
        this.app.currentPhase = PHASE_CHOOSE_ACTION;
        this.setClickableNone();
        this.setInstructions();
        this.saveState();

    }

    getPlayerInstructionForPhaseChooseAction(player) {
        return "Choose to either: (1) attack, or (2) calculate an attack, or (3) end your turn by fortifying a territory, or (4) end your turn by passing";
    }

    clickAttack() {
        this.beginPhaseChooseAttackingTerritory();
    }

    clickFortify() {
        this.beginPhaseFortify();
    }

    clickCalculate() {
        this.beginPhaseCalculate();
    }

    clickPass() {
        this.setClickableNone();
        this.removeHighlights();
        this.incrementCurrentPlayer();

        const player = this.app.currentPlayer;
        player.prizeBonus = 0;
        this.beginPhasePlayCards();
    }

    /* beginPhaseReinforce ****************************************************/
    
    beginPhaseReinforce() {
        this.app.currentPhase = PHASE_REINFORCE;
        this.app.currentPlayer.armiesAvailableForPlacementReinforce = this.getReinforceArmies().numReinforcements;
        this.app.currentPlayer.receivedCardThisTurn = false;
        this.setClickableForPhaseReinforce();
        this.setInstructions();
        this.saveState();

    }

    countNumTerritoriesOwned() {
        let count = 0;
        const color = this.app.currentPlayer.color;
        for (let i = 0; i < this.app.territories.length; i++) {
            const territory = this.app.territories[i];
            if (territory.color === color) {
                count++;
            }
        }
        return count;
    }

    calculateContinentBonus(player) {
        let continentBonus = 0;
        let continents = [];

        for (let i = 0; i < this.config.continents.length; i++) {
            const continent = this.config.continents[i];
            const territories = this.app.territories.filter(t => t.continent === continent);
            let allMine = true;
            for (let j = 0; j < territories.length; j++) {
                const territory = territories[j];
                if (territory.color !== player.color) {
                    allMine = false;
                    break;
                }
            }

            if (allMine) {
                continentBonus += this.config.continentBonus[continent];
                continents.push(continent);
            }
        }

        return {
            continentBonus: continentBonus,
            text: continents.join(" and "),
        };
    }

    getReinforceArmies() {
        const numTerritoriesOwned = this.countNumTerritoriesOwned();
        const div3 = Math.floor(numTerritoriesOwned / 3);
        const player = this.app.currentPlayer;
        const continentBonusAndString = this.calculateContinentBonus(player);
        player.continentBonus = continentBonusAndString.continentBonus;
        const continentText = continentBonusAndString.text;
        let numReinforcements;
        let instruction;
        if (div3 < 3) {
            numReinforcements = 3;
            numReinforcements += player.prizeBonus;
            numReinforcements += player.continentBonus;

            instruction = `Place ${player.armiesAvailableForPlacementReinforce} armies upon one or more territories you control. You received 3 armies this turn because you control fewer than 9 territories.`;
            if (player.prizeBonus > 0) {
                instruction += ` You received ${player.prizeBonus} armies because you traded in ${player.numSetsTradedIn} set(s) of prize cards.`;
            }
            if (player.continentBonus > 0) {
                instruction += ` You received ${player.continentBonus} armies because you control ${continentText}.`;
            }
        } else {
            numReinforcements = div3;
            numReinforcements += player.prizeBonus;
            numReinforcements += player.continentBonus;

            instruction = `Place ${player.armiesAvailableForPlacementReinforce} armies upon one or more territories you control. You received ${div3} armies this turn because you control ${numTerritoriesOwned} territories.`;
            if (player.prizeBonus > 0) {
                instruction += ` You received ${player.prizeBonus} armies because you traded in ${player.numSetsTradedIn} set(s) of prize cards.`;
            }
            if (player.continentBonus > 0) {
                instruction += ` You received ${player.continentBonus} armies because you control ${continentText}.`;
            }
        }
        return {
            numReinforcements: numReinforcements,
            instruction: instruction,
        };
    }

    setClickableForPhaseReinforce() {
        this.setClickableForPhaseDropThree();
    }

    clickTerritoryForPhaseReinforce(territory) {
        territory.numPieces += 1;
        this.app.currentPlayer.armiesAvailableForPlacementReinforce--;
        this.explodeTerritory(territory);

        // If this phase is over
        if (this.app.currentPlayer.armiesAvailableForPlacementReinforce === 0) {
            this.beginPhaseChooseAction();
        }
        // If current player gets to go again
        else {
            this.setClickableForPhaseReinforce();
            this.setInstructions();
            this.saveState();
        }

    }

    getPlayerInstructionForPhaseReinforce(player) {
        return this.getReinforceArmies().instruction;
    }

    /* beginPhasePlayCards ****************************************************/

    beginPhasePlayCards() {
        if (this.mustSkipPhasePlayCards()) {
            this.beginPhaseReinforce();
        } else {
            this.app.currentPhase = PHASE_PLAY_CARDS;
            this.setClickableNone();
            this.setInstructions();
            //this.showPlayCardButtons();
            this.saveState();
        }
    }

    mustSkipPhasePlayCards() {
        return this.app.numTotalCards(this.app.currentPlayer) < 3;
    }

    getPlayerInstructionForPhasePlayCards(player) {
        let preamble = "";
        if (this.app.currentPlayer.prizeBonus > 0) {
            preamble = `You have already traded in ${this.app.currentPlayer.numSetsTradedIn} set(s) of prize cards, for ${this.app.currentPlayer.prizeBonus} armies. `;
        }
        return `${preamble}Would you like to play a set of three cards for ${this.app.nextPrize} armies? (This prompt appears regardless if the current player has a set.)`;
    }

    clickPretend() {
        this.beginPhaseReinforce();
    }

    clickDoNotPlay() {
        this.beginPhaseReinforce();
    }

    clickPlayCards() {        
        this.doPlay();

        // we can skip to this phase since it's impossible for this player
        // to play any more cards, since this button is only available if
        // the player has fewer than five cards.
        this.beginPhaseReinforce();
    }

    clickMustPlayCards() {
        this.doPlay();
        this.setInstructions();
        this.saveState();
        this.beginPhasePlayCards();
    }

    doPlay() {
        this.app.currentPlayer.prizeBonus += this.app.nextPrize;
        this.app.currentPlayer.numSetsTradedIn += 1;
        this.incrementPrizeSchedule();

        if (this.app.currentPlayer.numHearts >= 3) {
            this.app.currentPlayer.numHearts -= 3;
        } else if (this.app.currentPlayer.numClubs >= 3) {
            this.app.currentPlayer.numClubs -= 3;
        } else if (this.app.currentPlayer.numDiamonds >= 3) {
            this.app.currentPlayer.numDiamonds -= 3;
        } else {
            this.app.currentPlayer.numHearts--;
            this.app.currentPlayer.numClubs--;
            this.app.currentPlayer.numDiamonds--;
        }
    }

    incrementPrizeSchedule() {
        for (let i = 0; i < this.app.prizeSchedule.length; i++) {
            const prize = this.app.prizeSchedule[i];
            if (prize.active) {
                prize.active = false;
                const nextPrizeIndex = (i + 1) % this.app.prizeSchedule.length;
                this.app.prizeSchedule[nextPrizeIndex].active = true;
                return;
            }
        }
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
            this.incrementCurrentPlayer();
            this.app.currentPlayer.prizeBonus = 0;
            this.app.currentPlayer.numSetsTradedIn = 0;
            this.beginPhasePlayCards();
            // No need to save state (nor setInstructions) here because beginPhasePlayCards will save the state
        }

        // If this turn os over
        else if (this.app.currentPlayer.armiesAvailableForPlacementThisTurn === 0) {
            this.incrementCurrentPlayer();
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

    getInitPrizeSchedule() {
        return [
            {value: 4, active: true},
            {value: 6, active: false},
            {value: 8, active: false},
            {value: 10, active: false},
            {value: 12, active: false},
            {value: 15, active: false},
            {value: 20, active: false},
            {value: 25, active: false},
            {value: 30, active: false},
            {value: 35, active: false},
            {value: 40, active: false},
            {value: 45, active: false},
            {value: 50, active: false},
            {value: 55, active: false},
            {value: 60, active: false},
        ];
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
                numHearts: 0,
                numClubs: 0,
                numDiamonds: 0,
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

    getSimTerritories() {
        //return getStandardTerritories();
        const territories = getStandardTerritories();
        for (let i = 0; i < territories.length; i++) {
            const territory = territories[i];
            territory.numPieces = -1;
        }
       return territories;
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
