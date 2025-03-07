import { NextResponse } from "next/server";

import { PrivyClient } from "@privy-io/server-auth";

import { addSavedToken, deleteSavedToken, getSavedToken } from "@/db/services";
import { getTokenMetadata } from "@/services/birdeye";

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
    process.env.PRIVY_APP_SECRET!
);

export const GET = async (request: Request, { params }: { params: Promise<{ address: string }> }) => {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        // Extract the token
        const token = authHeader.split(" ")[1];
        
        // Verify the token with Privy
        const { userId } = await privy.verifyAuthToken(token);
        if (!userId) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const { address } = await params;

        // Get the user's saved tokens
        const savedToken = await getSavedToken(address, userId);
        
        return NextResponse.json(savedToken);
    } catch (error) {
        console.error("Error in GET /api/saved-tokens/[address]:", error);
        return NextResponse.json(
            null,
            { status: 500 }
        );
    }
}

export const POST = async (request: Request, { params }: { params: Promise<{ address: string }> }) => {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        // Extract the token
        const token = authHeader.split(" ")[1];
        
        // Verify the token with Privy
        const { userId } = await privy.verifyAuthToken(token);
        if (!userId) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const { address } = await params;

        const tokenData = await getTokenMetadata(address);

        if (!tokenData) {
            return NextResponse.json(
                null,
                { status: 404 }
            );
        }
        

        // Get the user's saved tokens
        const savedToken = await addSavedToken({
            id: address,
            userId,
            name: tokenData.name,
            symbol: tokenData.symbol,
            logoURI: tokenData.logo_uri || "https://www.birdeye.so/images/unknown-token-icon.svg"
        });
        
        return NextResponse.json(savedToken);
    } catch (error) {
        console.error("Error in POST /api/saved-tokens/[address]:", error);
        return NextResponse.json(
            null,
            { status: 500 }
        );
    }
}

export const DELETE = async (request: Request, { params }: { params: Promise<{ address: string }> }) => {
    try {
        // Get the authorization header
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Missing or invalid authorization header" },
                { status: 401 }
            );
        }

        // Extract the token
        const token = authHeader.split(" ")[1];
        
        // Verify the token with Privy
        const { userId } = await privy.verifyAuthToken(token);
        if (!userId) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const { address } = await params;

        // Get the user's saved tokens
        const savedToken = await deleteSavedToken(address, userId);
        
        return NextResponse.json(savedToken);
    } catch (error) {
        console.error("Error in DELETE /api/saved-tokens/[address]:", error);
        return NextResponse.json(
            null,
            { status: 500 }
        );
    }
}