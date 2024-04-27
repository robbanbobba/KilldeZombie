import { Server } from "socket.io";
import { DBUser, Game, playerActivity } from "../types/types";

export const decideRoundWinner = (io:Server, roundActivity:playerActivity[],roomID:string,game:Game) => {
	if (roundActivity.every((user) => user.time === game.maxRoundTimeLimit)) {
		io.to(roomID).emit("UpdateroundWinner", "Draw,more like bruh 💀💀💀");
	} else {
		const { ID, time } = roundActivity[0];
		game.players[0].id === ID
			? game.players[0].score++
			: game.players[1].score++;

		io.to(roomID).emit("UpdateroundWinner", {
			score1: game.players[0].score,
			score2: game.players[1].score,
		});
	}
};

export const decideGameWinner = (io:Server,roomID:string,game:Game) => {
	console.log(game.players);
	
	if (game.players[0].score === game.players[1].score) {
		return io.to(roomID).emit("endgame", "Draw!Dont let this happen again!");
	} else {
		return game.players[0].score > game.players[1].score
			? io.to(roomID).emit(
					"endgame",
					`${game.players[0].username} won by ${game.players[0].score} points while stinky ${game.players[1].username} only has ${game.players[1].score} points`
			  )
			: io.to(roomID).emit(
					"endgame",
					`${game.players[1].username} won by ${game.players[1].score} points while stinky ${game.players[0].username} only has ${game.players[0].score} points`
			  );
	}
};

export const assignPlayers = (playerList:DBUser[],game:Game) => {
	let playerTemp = {
		id: "",
		username: "",
		score: 0,
		currReactionTime: 0,
		prevReactionTime: 0,
		reactionTimeList: [],
	};
	game.players = []
	playerList.forEach((player) => {
		let newPlayer = {
			...playerTemp,
			id: player.id,
			username: player.username,
		};

		game.players.push(newPlayer);
	});
	console.log(
		"Assigned this game players to be:",
		game.players[0],
		game.players[1]
	);
};