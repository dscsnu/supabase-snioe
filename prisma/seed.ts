import { PrismaClient } from "@prisma/client";
import { userQueries } from "./queries/user";


const db = new PrismaClient();

async function createUserTriggers() {
    for (const query of userQueries) {
        try {
            await db.$executeRaw(query);
        } catch (e) {
            console.log(query);
            console.error('Error with query: ', e);
        }
    }
}

async function main() {
    await createUserTriggers()
        .then(() => console.log('✅ userTriggers created'))
        .catch((e) => console.error(`🚨 ${e}`));
}

main()
    .then(async () => {
        await db.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await db.$disconnect();
        process.exit(1);
    });