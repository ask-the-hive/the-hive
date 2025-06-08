import { getContainer } from "@/db/containers/utils";
import { Container } from "@azure/cosmos";
import { User } from "../types/user";

export const USERS_CONTAINER_ID = "users";

let usersContainer: Container;

export const getUsersContainer = async (): Promise<Container> => {
    if (!usersContainer) usersContainer = await getContainer<User>(USERS_CONTAINER_ID, "id")
    return usersContainer;
}; 