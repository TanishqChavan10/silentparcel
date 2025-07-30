'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Users, Crown, Shield, Clock, LogOut, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/theme-toggle';
import { LeaveRoomDialog } from '@/components/leave-room-dialog';

interface Message {
  id: string;
  user: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
}

interface User {
  id: string;
  name: string;
  color: string;
  isAdmin: boolean;
  avatar: string;
}

interface ChatInterfaceProps {
  roomId: string;
  roomPassword: string;
  onLeave: () => void;
}

export function ChatInterface({ roomId, roomPassword, onLeave }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate random user data
  useEffect(() => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    const avatars = ['🦊', '🐺', '🦝', '🐧', '🦔', '🐨', '🐯', '🦁', '🐸', '🐙'];
    const adjectives = ['Swift', 'Silent', 'Mystic', 'Shadow', 'Neon', 'Cyber', 'Phantom', 'Eclipse'];
    const nouns = ['Fox', 'Wolf', 'Raven', 'Phoenix', 'Dragon', 'Tiger', 'Panther', 'Viper'];
    
    const generateUser = (isAdmin = false): User => ({
      id: Math.random().toString(36).substring(2),
      name: `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 99)}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      isAdmin,
      avatar: avatars[Math.floor(Math.random() * avatars.length)]
    });

    // Create current user as admin
    const admin = generateUser(true);
    setCurrentUser(admin);
    
    // Generate some other users
    const otherUsers = Array.from({ length: Math.floor(Math.random() * 4) + 1 }, () => generateUser());
    setUsers([admin, ...otherUsers]);

    // Add welcome message
    setMessages([
      {
        id: '1',
        user: 'System',
        content: `Welcome to the secret room! You are now ${admin.name} (Admin)`,
        timestamp: new Date(),
        type: 'system'
      }
    ]);
  }, []);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentUser) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      user: currentUser.name,
      content: message,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
  };

  const handleKickUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    const kickedUser = users.find(u => u.id === userId);
    if (kickedUser) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        user: 'System',
        content: `${kickedUser.name} was kicked from the room`,
        timestamp: new Date(),
        type: 'system'
      }]);
    }
  };

  const handleLeaveRoom = () => {
    setShowLeaveDialog(true);
  };

  const confirmLeaveRoom = () => {
    setShowLeaveDialog(false);
    onLeave();
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border/40 p-4 bg-background/80 backdrop-blur-xs shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="font-bold">Secret Room #{roomId}</h1>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Self-destructs in {formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{users.length}/10</span>
            </Badge>
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLeaveRoom}
              className="hover:scale-105 transition-transform hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-full">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-3 max-w-full">
                  {msg.type !== 'system' && (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback className="text-xs" style={{ backgroundColor: users.find(u => u.name === msg.user)?.color + '20' }}>
                        {users.find(u => u.name === msg.user)?.avatar || '👤'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 min-w-0 ${msg.type === 'system' ? 'text-center' : ''}`}>
                    {msg.type === 'system' ? (
                      <div className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-1 inline-block">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="max-w-full">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap">
                          <span 
                            className="font-semibold text-sm truncate"
                            style={{ color: users.find(u => u.name === msg.user)?.color }}
                          >
                            {msg.user}
                          </span>
                          {users.find(u => u.name === msg.user)?.isAdmin && (
                            <Crown className="h-3 w-3 text-yellow-500 shrink-0" />
                          )}
                          <span className="text-xs text-muted-foreground shrink-0">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="bg-muted/50 rounded-lg px-3 py-2 max-w-full break-words">
                          {msg.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t border-border/40 p-4 bg-background/50 shrink-0">
            <div className="flex space-x-2">
              <Button variant="outline" size="icon" className="hover:scale-105 transition-transform shrink-0">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-background/50"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={!message.trim()}
                className="hover:scale-105 transition-transform shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Users Sidebar */}
        <div className="w-72 border-l border-border/40 bg-muted/20 shrink-0 hidden md:flex flex-col">
          <div className="p-4 border-b border-border/40 shrink-0">
            <h3 className="font-semibold flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Users ({users.length})
            </h3>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback 
                        className="text-xs"
                        style={{ backgroundColor: user.color + '20' }}
                      >
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span 
                          className="font-medium text-sm truncate"
                          style={{ color: user.color }}
                        >
                          {user.name}
                        </span>
                        {user.isAdmin && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
                      </div>
                      {user.id === currentUser?.id && (
                        <span className="text-xs text-muted-foreground">You</span>
                      )}
                    </div>
                  </div>
                  
                  {currentUser?.isAdmin && user.id !== currentUser.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:scale-105 transition-transform shrink-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-background/95 backdrop-blur-xs border-border/50">
                        <DropdownMenuItem onClick={() => handleKickUser(user.id)} className="cursor-pointer">
                          Kick User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <LeaveRoomDialog
        isOpen={showLeaveDialog}
        onConfirm={confirmLeaveRoom}
        onCancel={() => setShowLeaveDialog(false)}
        roomId={roomId}
      />
    </div>
  );
}