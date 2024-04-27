import prisma from "../prisma";
import { GameUser } from "@prisma/client";

/**
 * Create a new recent game
 *
 * @param data Recent Game information
 * @returns
 */
export const createRecentGame = (player1: string, player2: string, points1: number, points2: number) => {
	console.log("Hello from service.");
	return prisma.recentGames.create({
		data: {
			player1: player1,
			player2: player2,
			points1: points1,
			points2: points2
		},
	});
};

/**
 * Get recentgame
 *
 * @param recent games information
 * @returns
 */
export const getRecentGames = () => {
    console.log("Hello from fillAroomservice.");
    return prisma.recentGames.findMany({
		take: 10,
		orderBy: { createdAt: 'desc' }
    });
}
