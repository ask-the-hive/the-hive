import { NextResponse } from "next/server";

import { PrivyClient } from "@privy-io/server-auth";

import { addSavedToken, deleteSavedToken, getSavedToken } from "@/db/services";
import { getTokenOverview } from "@/services/birdeye";
import { ChainType } from "@/app/_contexts/chain-context";

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
        
        // Determine chain based on address format
        const chain: ChainType = address.startsWith('0x') ? 'bsc' : 'solana';

        // Get token metadata from Birdeye with the correct chain
        const tokenData = await getTokenOverview(address, chain);

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
            name: tokenData.name || 'Unknown',
            symbol: tokenData.symbol || 'Unknown',
            logoURI: tokenData.logoURI || "https://www.birdeye.so/images/unknown-token-icon.svg",
            chain
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