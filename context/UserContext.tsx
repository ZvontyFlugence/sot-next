import { IUser } from '@/models/User';
import { createContext, useContext } from 'react';
import useSWR from 'swr';
import { request } from '@/util/ui';
import { parseCookies } from 'nookies';

type Context = {
    user: IUser | null;
    isAuthenticated: boolean;
}

const UserContext = createContext<Context>({
    user: null,
    isAuthenticated: false,
});

export const useUser = () => {
    const context = useContext(UserContext);
    return context.user;
}

export const getUserFetcher = (url: string, token: string) => request({ url, method: 'GET', token });

export function UserContextProvider({ fallback, children }) {
    const cookies = parseCookies();

    console.log('Fallback Data:', fallback);

    const userQuery = useSWR([`/api/me`, cookies.token], getUserFetcher, { refreshInterval: 500, fallbackData: fallback });

    return (
        <UserContext.Provider value={{ user: userQuery.data?.user ?? null, isAuthenticated: !!userQuery.data?.user }}>
            {children}
        </UserContext.Provider>
    );
}