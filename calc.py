import random
import string
import flask
from flask import *

app = Flask(__name__, static_url_path="/static")
app.secret_key = 'lkasjdfklasdfkljasdf'

MAX_STATES_LENGTH = 100
GAMES = {}
#GAME_STATE = {}

@app.route("/")
def landing():
    return render_template("landing.html")

@app.route("/create")
def create():
    return render_template("create.html")

@app.route("/join")
def join():
    return render_template("join.html")


@app.route("/join-submit", methods=["POST"])
def join_submit():
    username = request.form["name"]
    code =request.form["code"]

    if len(username) < 1 or len(username) > 20:
        abort(400)
    if username == "?":
        abort(400)
    if code not in GAMES:
        return "Could not find game"

    session.pop('username', None)
    session.pop('code', None)
    session["username"] = username
    session["code"] = code

    return redirect(url_for("play", code=code))

def hotseat():
    gameConfig = {
        "isHost": True,
        "numPlayers": 2,
        "username": "Player 1",
        "init": "hotseat",
        "serverOnline": False,
    }
    return render_template("game.html", gameConfig=gameConfig)

def two_boards():
    gameConfig = {
        "isHost": True,
        "numPlayers": 2,
        "username": "Player 1",
        "init": "two-boards",
        "serverOnline": False,
    }
    #abort(404)
    return render_template("game.html", gameConfig=gameConfig)


@app.route("/create-submit", methods=["POST"])
def create_submit():
    if request.form["board-init"] == "hotseat":
        return hotseat()
    if request.form["board-init"] == "two-boards":
        return two_boards()

    username = request.form["name"]
    try:
        numPlayers = int(request.form["numPlayers"])
    except:
        abort(400)

    if len(username) < 1 or len(username) > 20:
        abort(400)
    if username == "?":
        abort(400)
    if numPlayers < 1 or numPlayers > 6:
        abort(400)

    code = ''.join(random.choice(string.ascii_uppercase) for _ in range(4))

    session.pop('username', None)
    session.pop('code', None)
    session["username"] = username
    session["code"] = code

    GAMES[code] = {
        "numPlayers": numPlayers,
        "init": request.form["board-init"],
        "code": code,
        "states": [],
        "stateIndex": None,
        "count": 0,
        "lastRequestWasUndo": False,
        "lastRequestWasRedo": False,
    }

    return redirect(url_for("play", code=code))

def getUndoAvailable(game):
    if game["stateIndex"] == None:
        return False
    else:
        return game["stateIndex"] > 0;

def getRedoAvailable(game):
    if game["stateIndex"] == None:
        return False
    else:
        return game["stateIndex"] < len(game["states"]) - 1

@app.route("/post_state", methods=["POST"])
def post_state():
    if "code" not in session:
        abort(403)
    print(1)
    code = session["code"]
    print(2)
    state = request.get_json()
    print(3)
    game = GAMES[code]
    print(1)
    
    game["lastRequestWasUndo"] = False
    print(1)
    game["lastRequestWasRedo"] = False
    print(1)
    game["count"] += 1

    if game["stateIndex"] != None:
        print(1)
        game["states"] = game["states"][0:(game["stateIndex"] + 1)]
        if len(game["states"]) != game["stateIndex"] + 1:
            raise ValueError("Should be impossible")

    game["states"].append(state)
    print(1)
    
    if len(game["states"]) == MAX_STATES_LENGTH + 1:
        game["states"] = game["states"][1:]
    print(1)
    game["stateIndex"] = len(game["states"]) - 1
    print(1)
    
    return {
        "count": game["count"],
        "undoAvailable": getUndoAvailable(game),
        "redoAvailable": getRedoAvailable(game)
    }

@app.route("/get_state", methods=["GET"])
def get_state():
    if "code" not in session:
        abort(403)
    code = session["code"]
    game = GAMES[code]

    if game["stateIndex"] == None:
        return {
            "count": game["count"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }
    else:
        return {
            "state": game["states"][game["stateIndex"]],
            "count": game["count"],
            "undo": game["lastRequestWasUndo"],
            "redo": game["lastRequestWasRedo"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }




    code = session["code"]

    if code not in GAME_STATE:
        return {}

    index = len(GAME_STATE[code]) - 1
    state = GAME_STATE[code][index]

    return {
        "state": state,
        "index": index
    }

@app.route("/get_undo", methods=["GET"])
def get_undo():
    if "code" not in session:
        abort(403)
    code = session["code"]
    game = GAMES[code]

    if game["stateIndex"] == 0 or game["stateIndex"] == None:
        return {
            "count": game["count"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }
    else:
        game["count"] += 1
        game["stateIndex"] -= 1
        game["lastRequestWasUndo"] = True
        game["lastRequestWasRedo"] = False
        return {
            "state": game["states"][game["stateIndex"]],
            "count": game["count"],
            "undo": game["lastRequestWasUndo"],
            "redo": game["lastRequestWasRedo"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }

@app.route("/get_redo", methods=["GET"])
def get_redo():
    if "code" not in session:
        abort(403)
    code = session["code"]
    game = GAMES[code]

    if game["stateIndex"] == len(game["states"]) - 1 or game["stateIndex"] == None:
        return {
            "count": game["count"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }
    else:
        game["count"] += 1
        game["stateIndex"] += 1
        game["lastRequestWasUndo"] = False
        game["lastRequestWasRedo"] = True
        return {
            "state": game["states"][game["stateIndex"]],
            "count": game["count"],
            "undo": game["lastRequestWasUndo"],
            "redo": game["lastRequestWasRedo"],
            "undoAvailable": getUndoAvailable(game),
            "redoAvailable": getRedoAvailable(game)
        }


@app.route("/play/<code>")
def play(code):
    if "username" not in session:
        return "Not logged in"
    if code not in GAMES:
        return "Bad code"

    #gameState = GAMES[code]["states"][-1]

    gameConfig = {
        "isHost": True,
        "numPlayers": GAMES[code]["numPlayers"],
        "username": session["username"],
        "init": GAMES[code]["init"],
        "serverOnline": True,
        "postGameStateUrl": url_for("post_state"),
        "getStateUrl": url_for('get_state'),
        "undoUrl": url_for('get_undo'),
        "redoUrl": url_for('get_redo'),
        "code": code,
    }

    return render_template("game.html", gameConfig=gameConfig)
