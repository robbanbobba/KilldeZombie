import prisma from "../prisma";
import { GameUser } from "@prisma/client";

/**
 * Create a new user
 *
 * @param data User information
 * @returns
 */
export const createUser = (username: string) => {
	console.log("Hello from service.");
	return prisma.gameUser.create({
		data: {
			username: username,
		},
	});
};

export const getAllUsers = () => {
	console.log("get all users");
	return prisma.gameUser.findMany({
		where: {
			averageReactionTime: {
				not: null, // Exclude users with a null averageReactionTime
			},
		},
		orderBy: {
			averageReactionTime: "asc",
		},
		take: 5,
	});
};
