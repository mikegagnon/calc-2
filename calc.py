import random
import string
import flask
from flask import *

app = Flask(__name__, static_url_path="/static")
app.secret_key = 'lkasjdfklasdfkljasdf'

GAMES = {}
GAME_STATE = {}

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

@app.route("/create-submit", methods=["POST"])
def create_submit():
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
    }

    GAME_STATE[code] = []

    return redirect(url_for("play", code=code))


@app.route("/post_state", methods=["POST"])
def post_state():
     data = request.get_json()
     #print(data)
     code = data["code"]
     state = data["state"]
     GAME_STATE[code].append(state)

     return {}

@app.route("/get_state", methods=["GET"])
def get_state():
    code = session["code"]

    if code not in GAME_STATE:
        return {}

    index = len(GAME_STATE[code]) - 1
    state = GAME_STATE[code][index]

    return {
        "state": state,
        "index": index
    }

@app.route("/play/<code>")
def play(code):
    if "username" not in session:
        return "Not logged in"
    if code not in GAMES:
        return "Bad code"

    gameState = GAME_STATE[code]

    gameConfig = {
        "isHost": len(gameState) == 0,
        "numPlayers": GAMES[code]["numPlayers"],
        "username": session["username"],
        "init": GAMES[code]["init"],
        "code": code,
    }

    #username = session["username"]

    #gameState = GAME_STATE[code]

    # TODO: make sure username is in gameState


    # if len(gameState) > 0:
    #     thisGameState = gameState[len(gameState) - 1]
    #     print(thisGameState)
    #     game["initGameState"] = thisGameState

    return render_template("game.html", gameConfig=gameConfig)
