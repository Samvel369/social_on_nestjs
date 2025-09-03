export type AuthUser = {
    userId: number;
    username: string;
    avatarUrl?: string;
};
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
