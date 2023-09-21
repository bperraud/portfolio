//import { type } from "os";

export type Chat = {
  id: number;

  createdAt: Date;
  updatedAt: Date;
  name: string;
  accessibility: string;
  password: string;
};

export type ChatUser = {
  id: number;
  createdAt: Date;
  userId: number;
  chatId: number;
  lastReadMessageId: number | null;
  user: User;
};

export type Message = {
  id: number;
  createdAt: Date; // Change this from string to Date
  //  updatedAt: Date; // Likely need to change this too
  chatId: number;
  content: string;
  senderId: number;
};

export type GroupMessage = {
  id: number;
  createdAt: Date; // Change this from string to Date
  //  updatedAt: Date; // Likely need to change this too
  content: string;
  userId: number;
  chatId: number;
};

export type User = {
  id: number;
  username: string;
};
