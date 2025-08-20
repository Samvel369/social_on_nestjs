import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { FriendsService } from './friends.service';
import { CancelFriendDto, CleanupTimeDto } from './friends.dto';

function getUser(req: Request) {
  const xid = req.headers['x-user-id'];
  const userId = Array.isArray(xid) ? parseInt(xid[0] as string, 10) :
                 xid !== undefined ? parseInt(xid as string, 10) : 1;
  const xname = req.headers['x-username'];
  const username = Array.isArray(xname) ? (xname[0] as string) :
                   (xname as string) || `user${userId}`;
  return { userId, username };
}

@Controller('friends')
export class FriendsController {
  constructor(private readonly svc: FriendsService) {}

  // GET /api/friends
  @Get()
  page(@Req() req: Request) {
    const { userId } = getUser(req);
    // имитация session['cleanup_time'] = 10
    return this.svc.friendsPage(userId, 10);
  }

  // POST /api/friends/cleanup-time  { minutes }
  @Post('cleanup-time')
  setCleanupTime(@Body() dto: CleanupTimeDto, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.friendsPage(userId, dto.minutes);
  }

  @Get('friends_partial/incoming')
  incoming(@Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.partialIncoming(userId);
  }

  @Get('friends_partial/outgoing')
  outgoing(@Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.partialOutgoing(userId);
  }

  @Get('friends_partial/friends')
  friends(@Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.partialFriends(userId);
  }

  @Get('friends_partial/subscribers')
  subscribers(@Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.partialSubscribers(userId);
  }

  @Get('friends_partial/subscriptions')
  subscriptions(@Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.partialSubscriptions(userId);
  }

  @Post('send_friend_request/:userId')
  send(@Param('userId') target: string, @Req() req: Request) {
    const { userId, username } = getUser(req);
    return this.svc.sendFriendRequest(Number(target), userId, username);
  }

  @Post('cancel_friend_request/:requestId')
  cancel(@Param('requestId') rid: string, @Body() dto: CancelFriendDto, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.cancelFriendRequest(Number(rid), userId, dto.subscribe);
  }

  @Post('accept_friend_request/:requestId')
  accept(@Param('requestId') rid: string, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.acceptFriendRequest(Number(rid), userId);
  }

  @Post('remove_friend/:userId')
  remove(@Param('userId') target: string, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.removeFriend(Number(target), userId);
  }

  @Post('remove_possible_friend/:userId')
  removePossible(@Param('userId') target: string, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.removePossibleFriend(Number(target), userId);
  }

  @Post('subscribe/:userId')
  subscribe(@Param('userId') target: string, @Req() req: Request) {
    const { userId, username } = getUser(req);
    return this.svc.subscribe(Number(target), userId, username);
  }

  @Post('cleanup_potential_friends')
  cleanup(@Body() dto: CleanupTimeDto, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.cleanupPotentialFriends(dto.minutes, userId);
  }

  @Post('leave_in_subscribers/:userId')
  leave(@Param('userId') target: string, @Req() req: Request) {
    const { userId } = getUser(req);
    return this.svc.leaveInSubscribers(Number(target), userId);
  }
}
