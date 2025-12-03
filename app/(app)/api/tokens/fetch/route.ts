import { NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/api-error-handler';

// import { addToken, getToken } from "@/db/services/tokens";
// import { JupiterTokenData } from "@/services/jupiter";

export const POST = withErrorHandling(async () => {
  // const tokens = await fetch("https://tokens.jup.ag/tokens_with_markets");
  // const data: JupiterTokenData[] = await tokens.json();
  // for (let i = 0; i < data.length; i += 100) {
  //     const chunk = data.slice(i, i + 100);
  //     await Promise.all(chunk.map(async token => {
  //         const tokenData = await getToken(token.address);
  //         if(!tokenData) {
  //             await addToken({
  //                 id: token.address,
  //                 name: token.name,
  //                 symbol: token.symbol,
  //                 decimals: token.decimals,
  //                 tags: token.tags,
  //                 logoURI: token.logoURI,
  //                 freezeAuthority: token.freeze_authority,
  //                 mintAuthority: token.mint_authority,
  //                 permanentDelegate: token.permanent_delegate,
  //                 extensions: token.extensions,
  //             });
  //         }
  //     }));
  // }
  return NextResponse.json({ message: 'Tokens fetched and added to database' });
});
