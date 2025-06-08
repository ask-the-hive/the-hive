'use server';

import { getUser, updateUsername, addUser } from '@/db/services/users';

export async function getUserData(userId: string) {
    const userData = await getUser(userId);
    if (!userData) {
        // Create user if it doesn't exist
        const defaultUsername = userId.replace('did:privy:', '');
        const newUser = await addUser({
            id: userId,
            username: defaultUsername
        });
        return newUser;
    }
    return userData;
}

export async function updateUserUsername(userId: string, username: string) {
    const userData = await getUser(userId);
    if (!userData) {
        // Create user if it doesn't exist
        const newUser = await addUser({
            id: userId,
            username: username
        });
        return !!newUser;
    }
    return await updateUsername(userId, username);
} 