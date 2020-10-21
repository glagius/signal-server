import { Socket } from "socket.io";

export interface User {
  login: string,
  name: string
}

export interface AuthenticatedUser extends User {
  id: string,
  token?: string,
  lastActiveTime: string,
  rooms: string[]
}

export interface Connection {
  id: string,
  socket: Socket
}

export interface Connections {
  [id: string]: Connection
}

export interface Room {
  id: string,
  name: string,
  users: User[] | []
}

export interface Rooms {
  [name: string]: Room
}

export enum SocketEvents {
  heartbeat = 'heartbeat',
  message = 'message',
}


export enum RequestType {
  authenticate = 'authenticate',
  leave = 'leave',
  join = 'join',
  call = 'call',
  send = 'send',
  users = 'users',
  rooms = 'rooms',
  offer = 'offer',
  answer = 'answer',
  candidate = 'candidate'
}

export interface SocketPayload {
  type: RequestType,
  payload?: {
    id?: string,
    offer?: any,
    error?: string,
    user?: AuthenticatedUser,
    users?: AuthenticatedUser[],
    rooms?: Rooms
  }
}

export type SocketResponse = [SocketEvents, SocketPayload] | [SocketEvents]

export enum StoreChangeActions {
  add = 'add',
  remove = 'remove',
  update = 'update'
}