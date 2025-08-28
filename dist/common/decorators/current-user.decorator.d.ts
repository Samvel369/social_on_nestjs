export interface AuthUser {
    userId: number;
    username: string;
}
export declare const CurrentUser: (...dataOrPipes: unknown[]) => ParameterDecorator;
