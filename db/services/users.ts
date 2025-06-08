import "server-only";
import { add, del, find, get, update } from "./base";
import { getUsersContainer } from "../containers/users";
import { User } from "../types/user";
import { PatchOperationType } from "@azure/cosmos";

// CREATE
export const addUser = async (user: Omit<User, "createdAt" | "updatedAt">): Promise<User | null> => {
    const now = Date.now();
    return add<User, User>(await getUsersContainer(), {
        ...user,
        createdAt: now,
        updatedAt: now
    });
};

// READ
export const getUser = async (id: string): Promise<User | null> => {
    return get(await getUsersContainer(), id, id);
};

// UPDATE
export const updateUsername = async (id: string, username: string): Promise<boolean> => {
    return update(
        await getUsersContainer(),
        id,
        id,
        [
            { op: PatchOperationType.set, path: "/username", value: username },
            { op: PatchOperationType.set, path: "/updatedAt", value: Date.now() }
        ]
    );
}; 