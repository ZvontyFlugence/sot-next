import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from "react";

interface Context {
    selectedTab: number;
    setSelectedTab: Dispatch<SetStateAction<number>>;
}

let RegionPageContext = createContext<Context>({
    selectedTab: 0,
    setSelectedTab: () => {}
});

export const useSelectedTab = () => {
    const context = useContext(RegionPageContext);
    return context.selectedTab;
}

export const useSelectTab = () => {
    const context = useContext(RegionPageContext);

    return (tab: number) => {
        context.setSelectedTab(tab);
    }
}

export const RegionPageContextProvider = ({ children }: { children: ReactNode }) => {
    const [selectedTab, setSelectedTab] = useState(0);

    return (
        <RegionPageContext.Provider value={{ selectedTab, setSelectedTab }}>
            {children}
        </RegionPageContext.Provider>
    );
}