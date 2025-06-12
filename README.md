# Supabase SNIoE

## 🧩 Local Setup

This project uses **Supabase** for local PostgreSQL development and **Prisma** for schema management.

- Install using
```bash
npm i
```
#

### 🚀 Start and Sync the Database

To start the local database and sync it with your Prisma schema:

```bash
npm run db:sync
```

This will:

1. Start the local Supabase instance (`npx supabase start`)
2. Reset the database to a clean state (`npx supabase db reset`)
3. Push the latest Prisma schema to the database (`npx prisma db push`)
4. Seed the database with initial data (`npx prisma db seed`)

> ⚠️ Warning: Running `db:sync` will reset **all data**. Use with caution.

#

### 🛑 Stop the Local Database

To stop the Supabase services:

```bash
npm run db:stop
```

#

### 🛠 Other Useful Commands

- **Start only** the database (without resetting):

  ```bash
  npm run db:start
  ```

- **Reset only** the database (drops and recreates all data):

  ```bash
  npm run db:reset
  ```

---

## 🛡️ Group Permission Structure
- `Permissions` are identified by a unique string (`Permission.value`).

- `Groups` represent roles or collections of users and permissions.

- `GroupPermissionAssignment` maps specific permissions to groups using a composite key `(groupId, permissionId)`, allowing many-to-many relationships.

- `GroupUserAssignment` links users to groups using a composite key `(groupId, userId)`, enabling each user to belong to multiple groups and inherit associated permissions.

- All groups and permissions are embedded into `custom_claims` using functions and triggers.

---

## 📜  Schema Conventions
1. All models must be defined in `CapitalCase` and then mapped to `lowercase`.

2. All attributes and relations must be defined in `camelCase` and then mapped to `snake_case`.

3. All relations must be defined after attributes and a line populated by only `///`.

4. All relations must define `onDelete` and `onUpdate` explicitly.

5. `npx prisma format` is mandatory to run before any commits are made.

6. All `@default()` attributes utilizing a function must only utilize supabase functions, i.e, no prisma functions can be used to generate default attributes.

7. All enums must be defined at the bottom of the `schema.prisma` file.

> Combined Example
```
model UserProfile {
  id        String                @id @db.Uuid
  name      String
  email     String                @unique
  type      UserType              @default(BASE)
  createdAt DateTime              @default(dbgenerated("now()")) @map("created_at")
  ///
  groups    GroupUserAssignment[]

  @@map("userprofile")
}

model Group {
  id          String                @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String                @unique
  description String?
  ///
  user        GroupUserAssignment[]

  @@map("group")
}

model GroupUserAssignment {
  groupId String      @map("group_id") @db.Uuid
  userId  String      @map("user_id") @db.Uuid
  ///
  group   Group       @relation(fields: [groupId], references: [id], onDelete: Restrict, onUpdate: Restrict)
  user    UserProfile @relation(fields: [userId], references: [id], onDelete: Cascade, onUpdate: Restrict)

  @@id([groupId, userId])
  @@map("groupuserassignment")
}

// -----== ENUMS ==-----
enum UserType {
    ADMIN
    MODERATOR
    BASE
}
```