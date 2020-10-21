import { Injectable } from '@nestjs/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators'
import { User, Rooms, AuthenticatedUser, StoreChangeActions, Connection, Connections } from './interfaces/models';
import { Socket } from 'socket.io';

const defaultRoom = {
  id: '0',
  name: 'default',
  users: []
}

@Injectable()
export class AppService {
  private rooms: BehaviorSubject<Rooms> = new BehaviorSubject({ default: defaultRoom })
  private users: BehaviorSubject<AuthenticatedUser[]> = new BehaviorSubject([])
  private connections: BehaviorSubject<Connections> = new BehaviorSubject({})

  getRooms$() {
    return this.rooms
      .pipe(
        filter(rooms => Object.keys(rooms).length > 0)
      );
  }
  getUsers$() {
    return this.users
      .pipe(
        filter(users => users.length > 0)
      );
  }
  getConnections$() {
    return this.connections
      .pipe(
        filter(connections => Object.keys(connections).length > 0)
      )
  }
  getUser(user: User): AuthenticatedUser {
    const users = this.users.getValue();
    const authenticatedUser = users.find(person => person.login === user.login);
    if (authenticatedUser) {
      return authenticatedUser;
    }
    return null;
  }
  authUser(user: User, socket: Socket): AuthenticatedUser {
    // FIXME: just for test
    const alreadyAuthenticatedUser = this.getUser(user);
    if (alreadyAuthenticatedUser) {
      return alreadyAuthenticatedUser;
    }
    const id = `${user.login}-${Date.now()}`;
    const lastActiveTime = `${Date.now()}`;
    const authenticatedUser = {
      ...user,
      id, lastActiveTime,
      rooms: ['default'],
    }
    this.updateUsers(StoreChangeActions.add, authenticatedUser)
    this.updateConnections(StoreChangeActions.add, { id, socket })
    return authenticatedUser
  }
  updateUsers(action: StoreChangeActions, user: AuthenticatedUser) {
    const users = this.users.getValue();
    switch (action) {
      case StoreChangeActions.add: {
        this.updateRooms(StoreChangeActions.update, { room: 'default', payload: user });
        this.users.next([...users, user]);
        return;
      }
      case StoreChangeActions.remove: {
        console.log('Remove user from list - ', user);
        return;
      }
      case StoreChangeActions.update: {
        console.log('Update user - ', user);
        return;
      }
    }
  }
  updateRooms(action: StoreChangeActions, { room, payload } = { room: 'default', payload: {} }): void {
    const rooms = this.rooms.getValue();
    switch (action) {
      case StoreChangeActions.add: {
        console.log('Create new room');
        return;
      }
      case StoreChangeActions.remove: {
        console.log('Remove rooms from list');
        return;
      }
      case StoreChangeActions.update: {
        console.log('Update room - ', room);
        const updatedRoomUsers = [...rooms[room].users, payload as AuthenticatedUser];
        this.rooms.next({ ...rooms, [room]: { ...rooms[room], users: updatedRoomUsers } });
        return
      }
      default:
        throw new Error(`Unexpected updateRooms action: ${action}`)
    }
  }
  updateConnections(action: StoreChangeActions, connection: Connection) {
    const connections = this.connections.getValue();
    const { id } = connection
    switch (action) {
      case StoreChangeActions.add:
      case StoreChangeActions.update: {
        this.connections.next({ ...connections, [id]: connection });
        return;
      }
      case StoreChangeActions.remove: {
        const { [id]: target, ...rest } = connections;
        this.connections.next(rest);
        return;
      }
      default:
        throw new Error(`Unexpected connection change action: ${action}`)
    }
  }
}