import { PrismaClient } from "@prisma/client";
import { userQueries } from "./queries/user";
import { permissions, groups } from "./groups/aggregated";


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

async function createGroupsAndPermissions() {
    const uniquePermissions = Array.from(new Set(permissions));

    for (const value of uniquePermissions) {
        await db.permission.upsert({
            where: { value },
            update: {},
            create: { value }
        });
    }

    for (const group of groups) {
        const createdGroup = await db.group.upsert({
            where: { name: group.name },
            update: {},
            create: {
                name: group.name,
                description: group.description,
            },
        });

        const uniqueGroupPermissions = Array.from(new Set(group.permissions));

        for (const permission of uniqueGroupPermissions) {
            await db.groupPermissionAssignment.upsert({
                where: {
                    permissionId_groupId: {
                        permissionId: permission,
                        groupId: createdGroup.id,
                    },
                },
                update: {},
                create: {
                    permissionId: permission,
                    groupId: createdGroup.id,
                },
            });
        }
    }
}

async function main() {
    await createUserTriggers()
        .then(() => console.log('✅ userTriggers created'))
        .catch((e) => console.error(`🚨 ${e}`));

    await createGroupsAndPermissions()
        .then(() => console.log('✅ Groups and Permission created'))
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