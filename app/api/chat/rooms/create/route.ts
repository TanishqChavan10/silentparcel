import { NextRequest, NextResponse } from 'next/server';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { strictRateLimiter } from '@/lib/middleware/rateLimiter';
import { generateId, generateRoomPassword, generateAvatarUrl, getClientIP } from '@/lib/security';
import { supabaseAdmin } from '@/lib/supabase';
import redis, { REDIS_KEYS, setWithExpiry } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for room creation
    const rateLimitResult = await strictRateLimiter.isAllowed(request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many room creation attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { captchaToken, roomName } = await request.json();

    // Verify CAPTCHA
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification required' },
        { status: 400 }
      );
    }

    const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.HCAPTCHA_SECRET_KEY}&response=${captchaToken}`
    });

    const captchaData = await captchaResponse.json();
    if (!captchaData.success) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed' },
        { status: 400 }
      );
    }

    // Generate room data
    const roomId = generateId();
    const roomPassword = generateRoomPassword();
    const creatorId = generateId();
    const creatorUsername = `User_${Math.random().toString(36).substr(2, 6)}`;
    const creatorAvatar = generateAvatarUrl(creatorId);

    // Create room in database
    const room = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CHAT_ROOMS,
      roomId,
      {
        name: roomName || 'Anonymous Room',
        password: roomPassword,
        createdBy: creatorId,
        createdAt: new Date().toISOString(),
        isActive: true,
        maxUsers: parseInt(process.env.MAX_ROOM_USERS || '10'),
        userCount: 1
      }
    );

    // Create creator user record
    const creator = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.USERS,
      creatorId,
      {
        username: creatorUsername,
        avatar: creatorAvatar,
        roomId: roomId,
        isCreator: true,
        joinedAt: new Date().toISOString(),
        isActive: true
      }
    );

    // Store room data in Redis
    const roomData = {
      id: roomId,
      name: roomName || 'Anonymous Room',
      password: roomPassword,
      createdBy: creatorId,
      users: [{
        id: creatorId,
        username: creatorUsername,
        avatar: creatorAvatar,
        isCreator: true,
        joinedAt: new Date().toISOString()
      }],
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    await setWithExpiry(
      REDIS_KEYS.CHAT_ROOM(roomId),
      JSON.stringify(roomData),
      parseInt(process.env.ROOM_INACTIVITY_TIMEOUT || '3600') // 1 hour default
    );

    // Add user to room users set
    await redis.sadd(REDIS_KEYS.CHAT_USERS(roomId), creatorId);

    // Log audit event
    await supabaseAdmin.from('audit_logs').insert({
      action: 'room_create',
      resource_type: 'chat_room',
      resource_id: roomId,
      user_id: creatorId,
      ip_address: getClientIP(request),
      // // user_agent: request.headers.get('user-agent'),
      metadata: {
        roomName: roomName || 'Anonymous Room',
        username: creatorUsername
      }
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const roomUrl = `${baseUrl}/rooms/${roomId}`;

    return NextResponse.json({
      success: true,
      room: {
        id: roomId,
        name: roomName || 'Anonymous Room',
        password: roomPassword,
        url: roomUrl,
        maxUsers: parseInt(process.env.MAX_ROOM_USERS || '10')
      },
      user: {
        id: creatorId,
        username: creatorUsername,
        avatar: creatorAvatar,
        isCreator: true
      }
    });

  } catch (error) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create room. Please try again.' },
      { status: 500 }
    );
  }
}
