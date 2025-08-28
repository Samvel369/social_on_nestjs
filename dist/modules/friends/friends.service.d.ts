import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../../gateways/realtime.gateway';
export declare class FriendsService {
    private prisma;
    private rt;
    constructor(prisma: PrismaService, rt: RealtimeGateway);
    private areFriends;
    private truthy;
    friendsPage(userId: number, minutesFromSession?: number): Promise<{
        users: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
        friends: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
        incoming_requests: ({
            sender: {
                username: string;
                email: string;
                password: string;
                birthdate: Date | null;
                id: number;
                lastActive: Date;
                avatarUrl: string;
                status: string;
                about: string;
            };
        } & {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        })[];
        outgoing_requests: ({
            receiver: {
                username: string;
                email: string;
                password: string;
                birthdate: Date | null;
                id: number;
                lastActive: Date;
                avatarUrl: string;
                status: string;
                about: string;
            };
        } & {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        })[];
        subscribers: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
        subscriptions: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
        cleanup_time: number;
    }>;
    private _collectFriendsPageData;
    partialIncoming(userId: number): Promise<{
        incoming_requests: {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        }[];
    }>;
    partialOutgoing(userId: number): Promise<{
        outgoing_requests: {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        }[];
    }>;
    partialFriends(userId: number): Promise<{
        friends: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
    }>;
    partialSubscribers(userId: number): Promise<{
        subscribers: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
    }>;
    partialSubscriptions(userId: number): Promise<{
        subscriptions: {
            username: string;
            email: string;
            password: string;
            birthdate: Date | null;
            id: number;
            lastActive: Date;
            avatarUrl: string;
            status: string;
            about: string;
        }[];
    }>;
    sendFriendRequest(targetId: number, me: number, meUsername: string): Promise<{
        ok: boolean;
        message: string;
        data?: undefined;
    } | {
        ok: boolean;
        message: string;
        data: {
            request_id: number;
        };
    }>;
    cancelFriendRequest(requestId: number, me: number, subscribeFlag: string | undefined): Promise<{
        ok: boolean;
        message: string;
    }>;
    acceptFriendRequest(requestId: number, me: number): Promise<{
        ok: boolean;
        message: string;
    }>;
    removeFriend(targetId: number, me: number): Promise<{
        ok: boolean;
        message: string;
    }>;
    removePossibleFriend(targetId: number, me: number): Promise<{
        ok: boolean;
    }>;
    subscribe(targetId: number, me: number, meUsername: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    cleanupPotentialFriends(minutes: number, me: number): Promise<{
        ok: boolean;
    }>;
    leaveInSubscribers(targetId: number, me: number): Promise<{
        ok: boolean;
    }>;
}
