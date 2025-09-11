import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class FriendsService {
    private readonly prisma;
    private readonly rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    private mapUser;
    private notifyOne;
    private notifyBoth;
    private assertUserExists;
    private isUniqueError;
    private cleanupSubscriptionsBetween;
    private cleanupPotentialBetween;
    getPossible(viewerId: number, keepMinutes?: number): Promise<{
        id: number;
        username: string;
        avatar_url: string;
    }[]>;
    getIncoming(userId: number): Promise<{
        id: number;
        sender: {
            id: number;
            username: string;
            avatar_url: string;
        };
    }[]>;
    getOutgoing(userId: number): Promise<{
        id: number;
        receiver: {
            id: number;
            username: string;
            avatar_url: string;
        };
    }[]>;
    getFriends(userId: number): Promise<{
        id: number;
        username: string;
        avatar_url: string;
    }[]>;
    getSubscribers(userId: number): Promise<{
        id: number;
        username: string;
        avatar_url: string;
    }[]>;
    getSubscriptions(userId: number): Promise<{
        id: number;
        username: string;
        avatar_url: string;
    }[]>;
    sendFriendRequest(userId: number, toUserId: number): Promise<{
        ok: boolean;
        alreadyFriends: boolean;
        duplicatePending?: undefined;
        autoAccepted?: undefined;
    } | {
        ok: boolean;
        duplicatePending: boolean;
        alreadyFriends?: undefined;
        autoAccepted?: undefined;
    } | {
        ok: boolean;
        autoAccepted: boolean;
        alreadyFriends?: undefined;
        duplicatePending?: undefined;
    } | {
        ok: boolean;
        alreadyFriends?: undefined;
        duplicatePending?: undefined;
        autoAccepted?: undefined;
    }>;
    acceptFriendRequest(userId: number, requestId: number): Promise<{
        ok: boolean;
    }>;
    cancelFriendRequest(userId: number, requestId: number, subscribe?: boolean): Promise<{
        ok: boolean;
    }>;
    leaveAsSubscriber(userId: number, requestId: number): Promise<{
        ok: boolean;
    }>;
    removeFriend(userId: number, otherId: number): Promise<{
        ok: boolean;
    }>;
    subscribe(userId: number, targetUserId: number): Promise<{
        ok: boolean;
    }>;
    unsubscribe(userId: number, targetUserId: number): Promise<{
        ok: boolean;
    }>;
    dismiss(userId: number, targetUserId: number): Promise<{
        ok: boolean;
    }>;
}
