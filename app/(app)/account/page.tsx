export const dynamic = 'force-dynamic';

import ErrorBoundary from "@/components/error-boundary";
import Account from "./_components";

const AccountPage = () => {
    return (
        <ErrorBoundary pageKey="account">
            <Account />
        </ErrorBoundary>
    )
}

export default AccountPage;