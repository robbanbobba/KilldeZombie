import { playerActivity } from "../../backend/src/types/types";
import { Player } from "../../backend/src/types/types";
import { scoreData } from "../../frontend/src/types";

export {};

// Events emitted by the server to the client
export interface ServerToClientEvents {
	waitingForOpponent: (newRoom: object) => void;
	gameOn: (
		roomId: string,
		playersArray: { id: string; username: string; roomId: string | null }[],
		placement: number,
		delay: number,
		newGame: object

	) => void;
	averageReactionTime: (data: {
		username: string;
		averageReactionTime: number;
	}) => void;
	getHighScores: (data: any, recentGames: Object[]) => void;
	continueGame: (placement: number, delay: number, currRound: number, players: Player[]) => void;
	UpdateroundWinner: (data:data) => void
	endgame: (text: string) => void;
	opponentNotFound: (arg0: string) => void;
	playerLeft: (arg0: string) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
	sendUsername: (username: string) => void;
	userScore: (user: User) => void;
	getHighScores: (data: string) => void;
	continueGame: (playerActivity: playerActivity, currRoomID: string) => void;
	backCheck: () => void;
}

export interface User {
	name: string;
	score: number;
	currReactionTime: number;
	prevReactionTime: number;
	reactionTimeList: number[];
}

export type data = string | scoreData;
