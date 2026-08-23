import { prisma } from '../../config/prisma';

export const userRepository = {
    findByEmail(email: string) {
        return prisma.user.findUnique({ where: { email } });
    },

    create(data: { name: string; email: string; passwordHash: string }) {
        return prisma.user.create({ data});
    },
};