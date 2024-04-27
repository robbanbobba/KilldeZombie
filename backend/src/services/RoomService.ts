import prisma from "../prisma";

/**
 * Create a new room
 *
 * @param data room information
 * @returns
 */
export const createRoom = (waitroom: boolean, userId: string) => {
    console.log("Hello from roomservice.");
    return prisma.gameRoom.create({
        data: {
            waitroom,
			users: {
                connect: [{ id: userId }],
            },
        },
    });
}

export const deleteRoom = (roomId: string) => {
	console.log("Hello from delete a room!")
	return prisma.gameRoom.delete({
		where: {
			id: roomId
		}
	})
}

/**
 * Find an available room
 *
 * @param data room information
 * @returns
 */
export const findARoom = (waitroom: boolean) => {
    console.log("Hello from findAroomservice.");
    return prisma.gameRoom.findFirst({
        where: {
            waitroom,
        },
    });
}

/**
 * Add a user to room change it's waitstatus
 *
 * @param data room information
 * @returns
 */
export const fillARoom = (roomId: string, userId: string) => {
    console.log("Hello from fillAroomservice.");
    return prisma.gameRoom.update({
        where: {
            id: roomId
        }, data: {
			waitroom: false,
			users: {
				connect: {
					id: userId
				}
			}
		}
    });
}


/**
 * Add a user to room change it's waitstatus
 *
 * @param data room information
 * @returns
 */
export const getARoomWithUsers = (roomId: string) => {
    console.log("Hello from fillAroomservice.");
    return prisma.gameRoom.findUnique({
        where: {
            id: roomId
        }, include: {
			users: true
		}
    });
}

