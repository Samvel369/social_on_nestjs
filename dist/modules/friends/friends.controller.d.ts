import { FriendsService } from './friends.service';
import { CancelFriendDto, CleanupTimeDto } from './friends.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
export declare class FriendsController {
    private readonly svc;
    constructor(svc: FriendsService);
    view(user: AuthUser): Promise<{
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
    pIncoming(user: AuthUser): Promise<{
        incoming: {
            incoming_requests: {
                id: number;
                status: import(".prisma/client").$Enums.FriendRequestStatus;
                timestamp: Date;
                senderId: number;
                receiverId: number;
            }[];
        };
    }>;
    pOutgoing(user: AuthUser): Promise<{
        outgoing: {
            outgoing_requests: {
                id: number;
                status: import(".prisma/client").$Enums.FriendRequestStatus;
                timestamp: Date;
                senderId: number;
                receiverId: number;
            }[];
        };
    }>;
    pFriends(user: AuthUser): Promise<{
        friends: {
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
        };
    }>;
    pSubscribers(user: AuthUser): Promise<{
        subscribers: {
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
        };
    }>;
    pSubscriptions(user: AuthUser): Promise<{
        subscriptions: {
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
        };
    }>;
    page(user: AuthUser): Promise<{
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
    setCleanupTime(dto: CleanupTimeDto, user: AuthUser): Promise<{
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
    incoming(user: AuthUser): Promise<{
        incoming_requests: {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        }[];
    }>;
    outgoing(user: AuthUser): Promise<{
        outgoing_requests: {
            id: number;
            status: import(".prisma/client").$Enums.FriendRequestStatus;
            timestamp: Date;
            senderId: number;
            receiverId: number;
        }[];
    }>;
    friends(user: AuthUser): Promise<{
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
    subscribers(user: AuthUser): Promise<{
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
    subscriptions(user: AuthUser): Promise<{
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
    send(target: string, user: AuthUser): Promise<{
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
    cancel(rid: string, dto: CancelFriendDto, user: AuthUser): Promise<{
        ok: boolean;
        message: string;
    }>;
    accept(rid: string, user: AuthUser): Promise<{
        ok: boolean;
        message: string;
    }>;
    remove(target: string, user: AuthUser): Promise<{
        ok: boolean;
        message: string;
    }>;
    removePossible(target: string, user: AuthUser): Promise<{
        ok: boolean;
    }>;
    subscribe(target: string, user: AuthUser): Promise<{
        ok: boolean;
        message: string;
    }>;
    cleanup(dto: CleanupTimeDto, user: AuthUser): Promise<{
        ok: boolean;
    }>;
    leave(target: string, user: AuthUser): Promise<{
        ok: boolean;
    }>;
}
