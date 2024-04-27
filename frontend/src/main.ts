import { io, Socket } from 'socket.io-client';
import {
	ClientToServerEvents,
	data,
	ServerToClientEvents,
} from '@shared/types/SocketTypes';
import './assets/scss/style.scss';
import { Player, User } from './types';
import {
	registerButton,
	usernameInput,
	startEl,
	gameEl,
	lobbyMusicEl,
	startButtonEl,
	veryStartEl,
	lorePopupEl,
	storyLineEl,
	soundButtonEl,
	soundImageEl,
	lobbyEl,
	scoreButtonContainerEl,
	highScoreDivEl,
	user1name,
	user2name,
	waitingEl,
	waitingMsg,
	interactiveArea,
	gunShotEl,
	reactionTimeOneEl,
	endGameEl,
	gameInfoEl,
	newGameButtonEl,
	reactionTimeTwoEl
} from './dom-handlers';
// import { Game } from '../../backend/src/types/types';

const SOCKET_HOST = import.meta.env.VITE_SOCKET_HOST;

// Connect to Socket.IO Server
console.log('Connecting to Socket.IO Server at:', SOCKET_HOST);
const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
	io(SOCKET_HOST);

// Variabler
let username = '';

//! Dennis del

let user: User = {
	id: '',
	name: '',
	score: 0,
	currReactionTime: 0,
	prevReactionTime: 0,
	reactionTimeList: [],
};

let game = {
	currRound: 0,
	virusSpawnTimeStamp: 0,
	maxRoundTimeLimit: 0,
	maxVirusSpawnTime: 0,
	currRoomID: ""
};

let hasClickedVirus = false;
let emitCounter = 0; // Initialize counter variable
let timerRunning: number;

let startTimer = () => {
	let time = 0;
	const counterEl = document.querySelector<HTMLParagraphElement>('#counter')!;
	timerRunning = setInterval(() => {
		counterEl.innerHTML = `${time.toLocaleString()} / ${game.maxRoundTimeLimit / 1000
			}`;
		time++;
		if (time === game.maxRoundTimeLimit) {
			clearInterval(timerRunning)
		}
	}, 1000);
};

interactiveArea.addEventListener('click', (e:Event) => {
	if (soundImageEl.src.includes('high')) {
		gunShotEl.play();
	}
	const target = e.target as HTMLElement;

	if (!target) {
		return;
	}

	
	if (!hasClickedVirus && Boolean(target.dataset.isinfected) === true) {
		target.classList.add('splash')
		target.addEventListener('animationend', () => {
			target.classList.remove('splash');
		  });
		console.log('Curr round', game.currRound);
		handleUserReactTime();
		hasClickedVirus = true;
		clearInterval(timerRunning);
		clearTimeout(handleInactivityTimeout);
		// Increment the emit counter
		emitCounter++;
		console.log('Emit count:', emitCounter); // Log the emit count
		//game round if check should be above
		socket.emit('continueGame', { ID: user.id, time: user.currReactionTime }, game.currRoomID);
	}
});

let handleInactivityTimeout: number;
const handleInactivity = () => {
	let prevRound = game.currRound;
	handleInactivityTimeout = setTimeout(() => {
		if (game.currRound === prevRound) {
			handleUserReactTime(game.maxRoundTimeLimit);
			//Change so that it also sends the curr reaction time.Either restructure in a obj.you decide.
			socket.emit('continueGame', { ID: user.id, time: user.currReactionTime }, game.currRoomID);
		}
	}, game.maxRoundTimeLimit);
};

socket.on('endgame', (text) => {
	endgame();
	endGameEl.style.display = 'flex';
	gameInfoEl.innerHTML = text
	newGameButtonEl.addEventListener('click', () => {

		user = {
			id: '',
			name: '',
			score: 0,
			currReactionTime: 0,
			prevReactionTime: 0,
			reactionTimeList: [],
		};

		game = {
			currRoomID: '',
			currRound: 0,
			virusSpawnTimeStamp: 0,
			maxRoundTimeLimit: 0,
			maxVirusSpawnTime: 0,
		};

		hasClickedVirus = false;
		emitCounter = 0; // Initialize counter variable

		lobbyEl.style.display = 'none';

		gameEl.style.display = 'none';

		veryStartEl.style.display = 'none';

		endGameEl.style.display = 'none';

		soundButtonEl.style.display = 'flex';

		socket.disconnect();
		socket.connect();
		usernameInput.value = ''
		sessionStorage.removeItem('username');
		startEl.style.display = 'flex';

		socket.emit('getHighScores', 'We want highscores!');
	})
});

socket.on('continueGame', (placement: number, delay: number, round: number, players: Player[]) => {
	hasClickedVirus = false;
	game.currRound = round;
	renderSquares();
	handleSpawnVirus(delay, placement);
	startTimer();
	const reactionTimeList = players.filter(player => {
		return player.id === user.id
	})

	const opponentReactiontime = players.filter(player => {
		return player.id !== user.id
	})
	console.log("this players reaction time is:", reactionTimeList[0].currReactionTime);
	console.log("Opponents reaction time is:", opponentReactiontime[0].currReactionTime);

	reactionTimeOneEl.innerText = `${players[0].currReactionTime} ms`
	reactionTimeTwoEl.innerText = `${players[1].currReactionTime} ms`

	socket.on('playerLeft', (msg) => {
		console.log(msg)
		window.location.reload();
	})
});

socket.on('averageReactionTime', (data) => {
	console.log('Received average reaction time:', data.averageReactionTime);
});

const handleUserReactTime = (custom = 0) => {
	if (user.currReactionTime === 0) {
		user.currReactionTime =
			custom || getCurrTimeStamp() - game.virusSpawnTimeStamp;
		user.reactionTimeList.push(user.currReactionTime);
	} else {
		user.prevReactionTime = user.currReactionTime;
		user.currReactionTime =
			custom || getCurrTimeStamp() - game.virusSpawnTimeStamp;
		user.reactionTimeList.push(user.currReactionTime);
	}
	reactionTimeOneEl.innerText = `${user.currReactionTime}ms`;
};

import emptySquare from "../images/squareGrey.png"

/**
 * Renders first an empty string and then renders the squares acording to the amount params in the selected HTML EL.
 * @param amount - Default being 16 squares rendered.
 */
const renderSquares = (amount = 16) => {
	interactiveArea.innerHTML = '';
	for (let i = 0; i < amount; i++) {
		interactiveArea.innerHTML += `<img id="interactive-square" data-ID=${i} src="${emptySquare}"></img>`;
	}
};

// @ts-ignore
let spawnVirusTimeout: number;

import zombieImage from "../images/zombie.png"

const handleSpawnVirus = (delay: number, placement: number) => {
	const effectDiv = document.createElement('div')
	const image = interactiveArea.children[placement] as HTMLImageElement;
	spawnVirusTimeout = setTimeout(() => {
		image.classList.add('zombieShot')
		image.dataset.isinfected = "true";
		image.src = zombieImage;
		image.appendChild(effectDiv)
		handleInactivity();
	}, delay);

	game.virusSpawnTimeStamp = getCurrTimeStamp() + delay;
	clearInterval(timerRunning);
};

//bug:When user starts the game again it gos brrrrr!
const endgame = () => {
	socket.emit('userScore', user);
	console.log('Users list of times:', user.reactionTimeList);
	interactiveArea.innerHTML = '';
};

const getCurrTimeStamp = () => {
	const currentDate = new Date();
	const timestamp = currentDate.getTime();
	// console.log('Curr time', timestamp); // Output the timestamp
	return timestamp;
};

// Listen for when connection is established
socket.on('connect', () => {
	console.log('💥 Connected to the server', SOCKET_HOST);
	console.log('🔗 Socket ID:', socket.id);
});

//!

//! Robins del

// Type that story out!
function typeText(
	element: HTMLElement,
	text: string,
	interval: number,
	callback: () => void
): void {
	let i = 0;
	const typing = setInterval(() => {
		if (i < text.length) {
			element.textContent += text.charAt(i);
			i++;
		} else {
			clearInterval(typing);
			callback();
		}
	}, interval);
}

// Fade out once the story is told
function fadeOutPopup(element: HTMLElement, duration: number): void {
	element.style.animation = `fadeOut ${duration}ms forwards`;
}

startButtonEl.addEventListener('click', (e) => {
	e.preventDefault();

	lobbyMusicEl.play();

	const storyText =
		"The year is 2050. Most of humanity has died out, due to a virus turning us into zombies. You're one of the last few survivors and your job is to kill 'em zombies. However, you are not alone, you will compete with another survivor. The one who is kills quickest wins, and thus becomes a hero of this fallen world. Enter your name, and save the last of mankind...";

	const typingInterval = 50;

	lorePopupEl.style.display = 'flex';

	lorePopupEl.addEventListener('click', () => {
		lorePopupEl.style.display = 'none';
	});

	// Start typing out the text
	typeText(storyLineEl, storyText, typingInterval, () => {
		// Wait a bit after the text is typed out, then fade out the popup
		setTimeout(() => {
			fadeOutPopup(lorePopupEl, 2000);
		}, 5000);
	});

	startEl.style.display = 'flex';

	veryStartEl.style.display = 'none';

	soundButtonEl.style.display = 'flex';

	scoreButtonContainerEl.innerHTML = `<button class="viewHighScore" class="btn btn-success">
	HighScores</button>`;

	const viewHighScoreEl =
		document.querySelector<HTMLButtonElement>('.viewHighScore')!;

	socket.emit('getHighScores', 'We want highscores!');

	socket.on('getHighScores', (data: Object[], recentGames: Object[]) => {
		console.log('Here are users for highscore: ', data);
	
		highScoreDivEl.innerHTML = ` <h1>Highscore:</h1><ul class="scoreList"></ul><h2>Recent Games: </h2><ul class="recentGamesList"></ul><div id="closeButtonDiv"></div>`;
	
		const scoreListEl = document.querySelector<HTMLUListElement>('.scoreList')!;
		const recentGamesListEl = document.querySelector<HTMLUListElement>('.recentGamesList')!;
	
		let scoreListHTML = '';
		data.forEach((item: any) => {
			const username = item['username'];
			const average = item['averageReactionTime'];
	
			scoreListHTML += `<li>
					${username} | Reaction Time: ${average}ms
				</li>`;
		});
	
		let recentGamesListHTML = '';
		recentGames.forEach((item: any) => {
	
			recentGamesListHTML += `<li>
					${item.player1} ${item.points1} - ${item.points2} ${item.player2}
				</li>`;
		});
	
		scoreListEl.innerHTML = scoreListHTML;
		recentGamesListEl.innerHTML = recentGamesListHTML
	});


	viewHighScoreEl.addEventListener('click', () => {

		startEl.style.display = 'none';

		const closeButtonDivEl =
			document.querySelector<HTMLDivElement>('#closeButtonDiv')!;

		closeButtonDivEl.innerHTML = `<button class="viewHighScore" id="closeButton">
		Close</button>`;

		const closeButton =
			document.querySelector<HTMLButtonElement>('#closeButton')!;

		closeButton.addEventListener('click', () => {
			startEl.style.display = 'flex';

			closeButton.style.display = 'none';

			highScoreDivEl.style.display = 'none';
		});

		highScoreDivEl.style.display = 'flex';

		
	});
});

socket.emit('getHighScores', 'We want highscores!');

socket.on('getHighScores', (data: Object[], recentGames: Object[]) => {
	console.log('Here are users for highscore: ', data);

	highScoreDivEl.innerHTML = ` <h1>Highscore:</h1><ul class="scoreList"></ul><h2>Recent Games: </h2><ul class="recentGamesList"></ul><div id="closeButtonDiv"></div>`;

	const scoreListEl = document.querySelector<HTMLUListElement>('.scoreList')!;
	const recentGamesListEl = document.querySelector<HTMLUListElement>('.recentGamesList')!;

	let scoreListHTML = '';
	data.forEach((item: any) => {
		const username = item['username'];
		const average = item['averageReactionTime'];

		scoreListHTML += `<li>
				${username} | Reaction Time: ${average}ms
			</li>`;
	});

	let recentGamesListHTML = '';
	recentGames.forEach((item: any) => {

		recentGamesListHTML += `<li>
				${item.player1} ${item.points1} - ${item.points2} ${item.player2}
			</li>`;
	});

	scoreListEl.innerHTML = scoreListHTML;
	recentGamesListEl.innerHTML = recentGamesListHTML
});

import soundXImage from "../images/volume-xmark-solid.png"
import soundImage from "../images/volume-high-solid.png"

// Ge dem möjlighet att stänga av ljudet
soundButtonEl.addEventListener('click', () => {
	if (soundImageEl.src.includes('high')) {
		lobbyMusicEl.pause();
		soundImageEl.src = soundXImage;
	} else if (soundImageEl.src.includes('xmark')) {
		lobbyMusicEl.play();
		soundImageEl.src = soundImage;
	}
});

// En funktion som hämtar ut spelarens namn
registerButton?.addEventListener('click', (e) => {
	e.preventDefault();

	if (usernameInput && !usernameInput.value) {
		console.log('You need to type in something here!');
		return;
	} else if (usernameInput && usernameInput.value) {
		username = usernameInput.value;
		user.name = usernameInput.value;
		console.log('Username is: ', usernameInput.value);

		console.log('Registerbutton clicked!');
	}
	sessionStorage.setItem('username', username);
	socket.emit('sendUsername', username);
});

socket.on('waitingForOpponent', (data) => {
	console.log('Wait for you opponent!', data);

	startEl.style.display = 'none';

	lobbyEl.style.display = 'flex';

	waitingMsg.textContent = 'Please wait while we find u an opponent...';

	Object.assign(waitingMsg.style, {
		color: '#8BC437',
		fontFamily: 'Black Ops One',
		placeItems: 'center',
		fontSize: '24px',
		zIndex: '15',
	});

	waitingEl?.appendChild(waitingMsg);

	socket.on('opponentNotFound', (msg) => {
		console.log(msg)
		waitingMsg.textContent = "No opponent found, you'll be sent back to lobby";
		waitingEl?.appendChild(waitingMsg);
		setTimeout(() => {
			window.location.reload();
		}, 5000)
	})

	socket.on('playerLeft', (msg) => {
		console.log(msg)
		window.location.reload();
	})
});

socket.on('gameOn', (roomId, users, placement, delay, gameRules:any) => {
	console.log('Time to start the game!', roomId, users);

	let player1 = users[0];
	let player2 = users[1];
	console.log(player1, player2);

	scoreOne.innerHTML = "0"
	scoreTwo.innerHTML = "0"

	let username = sessionStorage.getItem('username');

	const currAssignedPlayer = users.filter((user) => username == user.username);
	console.log(currAssignedPlayer);

	user.id = currAssignedPlayer[0].id;
	user.name = currAssignedPlayer[0].username;

	game = gameRules;

	sessionStorage.removeItem('username');
	// Code that takes the players to the game
	waitingMsg.textContent = '';

	waitingEl?.appendChild(waitingMsg);

	startEl.style.display = 'none';

	lobbyEl.style.display = 'none';

	gameEl.style.display = 'block';

	user1name.innerHTML = `<span>${player1.username}</span>`;

	user2name.innerHTML = `<span>${player2.username}</span>`;

	lobbyMusicEl.pause();
	console.log('my user info', user);

	socket.emit('backCheck');

	socket.on('playerLeft', (msg) => {
		console.log(msg)
		window.location.reload();
	})

	renderSquares();
	handleSpawnVirus(delay, placement);
	startTimer();
});

let scoreOne = document.querySelector<HTMLLIElement>('#user1NamePoint')!;
let scoreTwo = document.querySelector<HTMLLIElement>('#user2NamePoint')!;

socket.on('UpdateroundWinner', (data:data) => {
	if (typeof data === 'string') {
		console.log(data);
	} else {
		const { score1, score2 } = data;

		scoreOne.innerHTML =` ${score1}`;
		scoreTwo.innerHTML = ` ${score2}`;
	}
});

// Listen for when server got tired of us
socket.on('disconnect', () => {
	console.log('💀 Disconnected from the server:', SOCKET_HOST);
});

// Listen for when we're reconnected (either due to our or the servers connection)
socket.io.on('reconnect', () => {
	console.log('🍽️ Reconnected to the server:', SOCKET_HOST);
	console.log('🔗 Socket ID:', socket.id);
});
//!
