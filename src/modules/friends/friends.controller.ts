import {
  Controller, Get, Post, Param, ParseIntPipe, Query, Body,
  UseGuards, Render,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { PrismaService } from '../../prisma/prisma.service'; // 🔥 Добавил импорт
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

type AuthUser = { userId: number; username: string };

function getDisplayName(user: any) {
  if (user.firstName) {
    return user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName;
  }
  return user.username;
}

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(
    private readonly service: FriendsService,
    private readonly prisma: PrismaService // 🔥 Инжектим Prisma
  ) {}

  // ---------- FULL PAGE ----------
  @Get(['', 'view'])
  @Render('friends.html')
  async page(@CurrentUser() u: AuthUser, @Query('keep') keep?: string) {
    const keep_minutes = Math.max(1, parseInt(keep ?? '10') || 10);

    // 🔥 Достаем текущего юзера для меню
    const me = await this.prisma.user.findUnique({ where: { id: u.userId } });
    const current_user = me ? {
        id: me.id,
        userId: me.id,
        username: getDisplayName(me),
        avatar_url: me.avatarUrl ?? '',
    } : null;

    return {
      current_user, // 🔥 Передаем в шаблон
      keep_minutes,
      possible_friends: await this.service.getPossible(u.userId, keep_minutes),
      incoming_requests: await this.service.getIncoming(u.userId),
      outgoing_requests: await this.service.getOutgoing(u.userId),
      friends: await this.service.getFriends(u.userId),
      subscribers: await this.service.getSubscribers(u.userId),
      subscriptions: await this.service.getSubscriptions(u.userId),
    };
  }

  // ... (Остальные методы partials и actions остаются без изменений)
  // Я их скрыл для краткости, так как мы их не меняли, кроме импорта сверху.
  // Если у тебя нет их копии, я могу скинуть полный файл, но там много строк.
  // Главное - замени метод page и конструктор.
  
  // ---------- PARTIALS ----------
  @Get(['partials/possible', 'partials/possible_friends'])
  @Render('partials/possible_friends.html')
  async pPossible(@CurrentUser() u: AuthUser, @Query('keep') keep?: string) {
    const keep_minutes = Math.max(1, parseInt(keep ?? '10') || 10);
    return { possible_friends: await this.service.getPossible(u.userId, keep_minutes) };
  }

  @Get(['partials/incoming', 'partials/incoming_requests'])
  @Render('partials/incoming_requests.html')
  async pIncoming(@CurrentUser() u: AuthUser) {
    return { incoming_requests: await this.service.getIncoming(u.userId) };
  }

  @Get(['partials/outgoing', 'partials/outgoing_requests'])
  @Render('partials/outgoing_requests.html')
  async pOutgoing(@CurrentUser() u: AuthUser) {
    return { outgoing_requests: await this.service.getOutgoing(u.userId) };
  }

  @Get(['partials/friends', 'friends_partial/friends'])
  @Render('partials/friends_list.html')
  async pFriends(@CurrentUser() u: AuthUser) {
    return { friends: await this.service.getFriends(u.userId) };
  }

  @Get(['partials/subscribers'])
  @Render('partials/subscribers.html')
  async pSubscribers(@CurrentUser() u: AuthUser) {
    return { subscribers: await this.service.getSubscribers(u.userId) };
  }

  @Get(['partials/subscriptions'])
  @Render('partials/subscriptions.html')
  async pSubscriptions(@CurrentUser() u: AuthUser) {
    return { subscriptions: await this.service.getSubscriptions(u.userId) };
  }

  // ---------- ACTIONS ----------
  @Post('request/:id')
  async request(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.sendFriendRequest(u.userId, id);
    return { ok: true };
  }

  @Post('accept/:rid')
  async accept(@CurrentUser() u: AuthUser, @Param('rid', ParseIntPipe) rid: number) {
    await this.service.acceptFriendRequest(u.userId, rid);
    return { ok: true };
  }

  @Post('cancel/:rid')
  async cancel(
    @CurrentUser() u: AuthUser,
    @Param('rid', ParseIntPipe) rid: number,
    @Query('subscribe') subscribeQ?: string,
    @Body() body?: any,
  ) {
    const raw = (subscribeQ ?? body?.subscribe ?? 'false')?.toString();
    const subscribe = raw === '1' || raw === 'true' || raw === 'on';
    await this.service.cancelFriendRequest(u.userId, rid, subscribe);
    return { ok: true };
  }

  @Post('leave-subscriber/:rid')
  async leave(@CurrentUser() u: AuthUser, @Param('rid', ParseIntPipe) rid: number) {
    await this.service.leaveAsSubscriber(u.userId, rid);
    return { ok: true };
  }

  @Post('remove/:id')
  async remove(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.removeFriend(u.userId, id);
    return { ok: true };
  }

  @Post('subscribe/:id')
  async subscribe(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.subscribe(u.userId, id);
    return { ok: true };
  }

  @Post('unsubscribe/:id')
  async unsubscribe(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.unsubscribe(u.userId, id);
    return { ok: true };
  }

  @Post('dismiss/:id')
  async dismiss(@CurrentUser() u: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.service.dismiss(u.userId, id);
    return { ok: true };
  }
}