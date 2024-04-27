/**
 * Socket Controller
 */
import Debug from "debug";
import { Server, Socket } from "socket.io";
import {
	ClientToServerEvents,
	ServerToClientEvents,
	User,
} from "@shared/types/SocketTypes";
import { createUser, getAllUsers } from "../services/UserService";
import { createRecentGame, getRecentGames } from "../services/RecentGameService";
import { GameRoom, GameUser } from "@prisma/client";
import {
	createRoom,
	fillARoom,
	findARoom,
	getARoomWithUsers,
	deleteRoom
} from "../services/RoomService";
import prisma from "../prisma";
import { log } from "console";
import { emit } from "process";
import { Game, playerActivity } from "../types/types";
import { randomNum } from "../utils/utils";
import {
	assignPlayers,
	decideGameWinner,
	decideRoundWinner,
} from "../gameLogic/gameFuncs";

// Create a new debug instance
const debug = Debug("backend:socket_controller");
let activeGames: Game[] = [];
//Decide the game to be played by modifying key vals.
export let game: Game = {
	currRound: 0,
	gameEndRound: 9, // Axtual rounds = gameEndRound + 1
	virusSpawnTimeStamp: 0,
	maxRoundTimeLimit: 30000, //default : 30000
	maxVirusSpawnTime: 3, //default : 10
	players: [],
	roundInteractions: [], //if it gets to two in length then all users have reacted that round.
	currRoomID: "",
};

// Handle a user connecting
export const handleConnection = (
	socket: Socket<ClientToServerEvents, ServerToClientEvents>,
	io: Server<ClientToServerEvents, ServerToClientEvents>
) => {
	debug("🙋 A user connected", socket.id);

	let gameRoom: GameRoom;
	let newUser: GameUser;
	const socketRoomMap = new Map();

	socket.on("sendUsername", async (name: string) => {
		//console.log("Username from backend! :", name);
		newUser = await createUser(name);
		//console.log(newUser);
		const availableRoom = await findARoom(true);

		if (availableRoom) {
			const roomId = availableRoom.id;
			const userId = newUser.id;
			gameRoom = await fillARoom(roomId, userId);

			//Join a socket-room for 2-way communication
			await socket.join(roomId);
			socketRoomMap.set(socket.id, roomId);
			//console.log("roomId", roomId);

			let players = await getARoomWithUsers(roomId);

			if (players) {
				let playersArray = players.users;
				const delay = randomNum(game.maxVirusSpawnTime) * 1000 || 1000;
				let placement = randomNum(16);
				let newGame = { ...game };
				newGame.currRoomID = roomId;
				newGame.roundInteractions = []
				assignPlayers(playersArray, newGame);
				activeGames.push(newGame);

				console.log(activeGames)
				io.in(roomId).emit(
					"gameOn",
					roomId,
					playersArray,
					placement,
					delay,
					newGame
				);
			}
		} else {
			const newRoom = await createRoom(true, newUser.id);

			// Join a new socket-room and wait
			await socket.join(newRoom.id);
			socketRoomMap.set(socket.id, newRoom.id);

			//Let the front know it is waiting for opponent
			socket.emit("waitingForOpponent", newRoom);

			socket.on('disconnect', async() => {
				const roomID = socketRoomMap.get(socket.id);
				if(roomID) {
				io.in(roomID).emit('playerLeft', "Player left the house")
				await deleteRoom(roomID)
				}
			})

			// Set a timeout for waiting
			// setTimeout(async () => {
			// 	// Check if the room still lacks the required number of players
			// 	const updatedRoom = await getARoomWithUsers(newRoom.id);
			// 	if (updatedRoom && updatedRoom.users.length < 2) {
			// 		await deleteRoom(newRoom.id)
			// 		socket.leave(newRoom.id);
			// 		socket.emit("opponentNotFound", "no opponent found");
			// 		// Consider deleting the room or marking it as inactive

			// 	}
			// }, 6000);
		}
	});

	socket.on('backCheck', () => {
		socket.on('disconnect', async() => {
			const roomID = socketRoomMap.get(socket.id);
			if(roomID) {
			io.in(roomID).emit('playerLeft', "Player left the house")
			// await deleteRoom(roomID)
			}
		})
	})

	// Beräkna genomsnitt av reaktionstiderna
	socket.on("userScore", async (user: User) => {
		// Beräkna genomsnitt av reaktionstiderna
		if (user.reactionTimeList.length === 10) {
			const sum = user.reactionTimeList.reduce(
				(acc, time) => acc + time,
				0
			);
			const averageTime = sum / 10; // Beräkna genomsnittet
			//console.log(`🍌 Average reaction time 🍌`, averageTime);

			try {
				const user = await prisma.gameUser.update({
					where: { id: newUser.id },
					data: { averageReactionTime: averageTime },
				});

				if (!user) {
					throw new Error(
						"Failed to update user. Database error occurred."
					);
				}
				io.emit("averageReactionTime", {
					username: user.username,
					averageReactionTime: averageTime,
				});
			} catch (error) {
				console.error("Error occurred while updating user:", error);
			}
		}
	});

	socket.on("getHighScores", async (data: string) => {
		const highUsers = await getAllUsers();

		const recentGames = await getRecentGames()



		socket.emit("getHighScores", highUsers, recentGames);
	});

	socket.on("continueGame", async(playerActivity: playerActivity, roomID) => {
		let currGame = activeGames.filter((game) => game.currRoomID === roomID)[0];
		currGame.roundInteractions.push(playerActivity);

		socket.on('disconnect', async() => {
			const roomID = socketRoomMap.get(socket.id);
			if(roomID) {
			io.in(roomID).emit('playerLeft', "Player left the house")
			}
		})



		if (currGame.roundInteractions.length === 2) {
			decideRoundWinner(io, currGame.roundInteractions, roomID, currGame);
			const updateReactionTimelist = currGame.roundInteractions.forEach(interaction => {
				let player = currGame.players.find((player)=> player.id === interaction.ID)!

				player.currReactionTime = interaction.time

			});

			if (currGame.currRound === currGame.gameEndRound) {
				currGame.currRound = 0;
				currGame.roundInteractions = [];
				//func for deciding winner,loser or equal.
				decideGameWinner(io, roomID, currGame);
				await createRecentGame(currGame.players[0].username, currGame.players[1].username, currGame.players[0].score, currGame.players[1].score)
				currGame.players[0].score = 0;
				currGame.players[1].score = 0;
				 setTimeout(() => {
					console.log("penis gaming");
				 }, 10000);
			} else {
				currGame.roundInteractions = [];
				currGame.currRound++;

				const delay = randomNum(currGame.maxVirusSpawnTime) * 1000 || 1000;
				let placement = randomNum(16);
				io.to(roomID).emit(
					"continueGame",
					placement,
					delay,
					currGame.currRound,
					currGame.players
				); //make it to only give data to apporporaite roomid if possible.
			}
		}
	});
};
// let createRecent = async(player1: string, player2: string, point1: number, point2: number) => {
// 	await createRecentGame(player1, player2, point1,)
// }
