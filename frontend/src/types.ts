export interface Player {
    id: string;
    username: string;
    score: number;
    currReactionTime: number;
    prevReactionTime: number;
    reactionTimeList: number[];
}

export interface User {
	id: string,
	name: string,
	score: number,
	currReactionTime: number,
	prevReactionTime: number,
	reactionTimeList: number[],
};

export interface Game {
	currRound: number,
	gameEndRound: number, // Axtual rounds = gameEndRound + 1
	virusSpawnTimeStamp: number,
	maxRoundTimeLimit: number, //default : 30000
	maxVirusSpawnTime: number, //default : 10
    currRoomID: string
}

export interface scoreData {
	score1:number,
	score2:number
}