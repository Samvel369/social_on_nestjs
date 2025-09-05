import { FriendsService } from './friends.service';
import { CancelFriendDto } from './friends.dto';
type AuthUser = {
    userId: number;
    username: string;
};
export declare class FriendsController {
    private readonly service;
    constructor(service: FriendsService);
    page(u: AuthUser, keep?: string): Promise<{
        keep_minutes: number;
        possible_friends: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
        incoming_requests: {
            id: number;
            sender: {
                id: number;
                username: string;
                avatar_url: string;
            };
        }[];
        outgoing_requests: {
            id: number;
            receiver: {
                id: number;
                username: string;
                avatar_url: string;
            };
        }[];
        friends: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
        subscribers: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
        subscriptions: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
    }>;
    pPossible(u: AuthUser, keep?: string): Promise<{
        possible_friends: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
    }>;
    pIncoming(u: AuthUser): Promise<{
        incoming_requests: {
            id: number;
            sender: {
                id: number;
                username: string;
                avatar_url: string;
            };
        }[];
    }>;
    pOutgoing(u: AuthUser): Promise<{
        outgoing_requests: {
            id: number;
            receiver: {
                id: number;
                username: string;
                avatar_url: string;
            };
        }[];
    }>;
    pFriends(u: AuthUser): Promise<{
        friends: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
    }>;
    pSubscribers(u: AuthUser): Promise<{
        subscribers: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
    }>;
    pSubscriptions(u: AuthUser): Promise<{
        subscriptions: {
            id: number;
            username: string;
            avatar_url: string;
        }[];
    }>;
    request(u: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    accept(u: AuthUser, rid: number): Promise<{
        ok: boolean;
    }>;
    cancel(u: AuthUser, rid: number, body: CancelFriendDto): Promise<{
        ok: boolean;
    }>;
    leave(u: AuthUser, rid: number): Promise<{
        ok: boolean;
    }>;
    remove(u: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    subscribe(u: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    unsubscribe(u: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
    dismiss(u: AuthUser, id: number): Promise<{
        ok: boolean;
    }>;
}
export {};
