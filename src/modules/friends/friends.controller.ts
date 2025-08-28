import { Body, Controller, Get, Param, Post, UseGuards, Render } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CancelFriendDto, CleanupTimeDto } from './friends.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly svc: FriendsService) {}

  // ---------- HTML ----------
  // Главная страница "Друзья" (как friends.html во Flask)
  @Get('view')
  @Render('friends.html')
  async view(@CurrentUser() user: AuthUser) {
    // во Flask в сессии был cleanup_time — здесь просто 10 по умолчанию
    return this.svc.friendsPage(user.userId, 10);
  }

  // Partials (рендерятся в те же html, что в /static/templates/partials)
  @Get('partials/incoming')
  @Render('partials/incoming_requests.html')
  async pIncoming(@CurrentUser() user: AuthUser) {
    const incoming = await this.svc.partialIncoming(user.userId);
    return { incoming };
  }

  @Get('partials/outgoing')
  @Render('partials/outgoing_requests.html')
  async pOutgoing(@CurrentUser() user: AuthUser) {
    const outgoing = await this.svc.partialOutgoing(user.userId);
    return { outgoing };
  }

  @Get('partials/friends')
  @Render('partials/friends_list.html')
  async pFriends(@CurrentUser() user: AuthUser) {
    const friends = await this.svc.partialFriends(user.userId);
    return { friends };
  }

  @Get('partials/subscribers')
  @Render('partials/subscribers.html')
  async pSubscribers(@CurrentUser() user: AuthUser) {
    const subscribers = await this.svc.partialSubscribers(user.userId);
    return { subscribers };
  }

  @Get('partials/subscriptions')
  @Render('partials/subscriptions.html')
  async pSubscriptions(@CurrentUser() user: AuthUser) {
    const subscriptions = await this.svc.partialSubscriptions(user.userId);
    return { subscriptions };
  }

  // ---------- JSON API ----------
  // GET /api/friends
  @Get()
  page(@CurrentUser() user: AuthUser) {
    return this.svc.friendsPage(user.userId, 10);
  }

  // POST /api/friends/cleanup-time  { minutes }
  @Post('cleanup-time')
  setCleanupTime(@Body() dto: CleanupTimeDto, @CurrentUser() user: AuthUser) {
    return this.svc.friendsPage(user.userId, dto.minutes);
  }

  @Get('friends_partial/incoming')
  incoming(@CurrentUser() user: AuthUser) {
    return this.svc.partialIncoming(user.userId);
  }

  @Get('friends_partial/outgoing')
  outgoing(@CurrentUser() user: AuthUser) {
    return this.svc.partialOutgoing(user.userId);
  }

  @Get('friends_partial/friends')
  friends(@CurrentUser() user: AuthUser) {
    return this.svc.partialFriends(user.userId);
  }

  @Get('friends_partial/subscribers')
  subscribers(@CurrentUser() user: AuthUser) {
    return this.svc.partialSubscribers(user.userId);
  }

  @Get('friends_partial/subscriptions')
  subscriptions(@CurrentUser() user: AuthUser) {
    return this.svc.partialSubscriptions(user.userId);
  }

  @Post('send_friend_request/:userId')
  send(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.sendFriendRequest(Number(target), user.userId, user.username);
  }

  @Post('cancel_friend_request/:requestId')
  cancel(
    @Param('requestId') rid: string,
    @Body() dto: CancelFriendDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.svc.cancelFriendRequest(Number(rid), user.userId, dto.subscribe);
  }

  @Post('accept_friend_request/:requestId')
  accept(@Param('requestId') rid: string, @CurrentUser() user: AuthUser) {
    return this.svc.acceptFriendRequest(Number(rid), user.userId);
  }

  @Post('remove_friend/:userId')
  remove(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.removeFriend(Number(target), user.userId);
  }

  @Post('remove_possible_friend/:userId')
  removePossible(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.removePossibleFriend(Number(target), user.userId);
  }

  @Post('subscribe/:userId')
  subscribe(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.subscribe(Number(target), user.userId, user.username);
  }

  @Post('cleanup_potential_friends')
  cleanup(@Body() dto: CleanupTimeDto, @CurrentUser() user: AuthUser) {
    return this.svc.cleanupPotentialFriends(dto.minutes, user.userId);
  }

  @Post('leave_in_subscribers/:userId')
  leave(@Param('userId') target: string, @CurrentUser() user: AuthUser) {
    return this.svc.leaveInSubscribers(Number(target), user.userId);
  }
}
