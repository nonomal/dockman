import type {FC, JSX, ReactNode} from "react";

type ComponentWithChildren = FC<{ children: ReactNode }>;

export const multiprovider = (...components: ComponentWithChildren[]): ComponentWithChildren => {
    return components.reduce(
        (AccumulatedComponents, CurrentComponent) => {
            return ({children}: { children: ReactNode }): JSX.Element => {
                return (
                    <AccumulatedComponents>
                        <CurrentComponent>{children}</CurrentComponent>
                    </AccumulatedComponents>
                );
            };
        },
        ({children}) => <>{children}</>
    );
};