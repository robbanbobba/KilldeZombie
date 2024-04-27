export interface Player {
    id: string;
    username: string;
    score: number;
    currReactionTime: number;
    prevReactionTime: number;
    reactionTimeList: number[];
}

export interface Game {
	currRound: number,
	gameEndRound: number, // Axtual rounds = gameEndRound + 1
	virusSpawnTimeStamp: number,
	maxRoundTimeLimit: number, //default : 30000
	maxVirusSpawnTime: number, //default : 10
	players: Player[],
	roundInteractions : playerActivity[] //if it gets to two then all user have reacted.
    currRoomID: string
}

export interface playerActivity {
    ID:string,
    time:number
}

export interface DBUser {
    id: string;
    username: string;
    roomId: string | null;
}