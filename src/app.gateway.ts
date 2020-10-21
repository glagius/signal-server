import {
  SubscribeMessage,
  WebSocketGateway,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { SocketEvents, RequestType, SocketPayload, SocketResponse, User, Rooms, AuthenticatedUser, Connections } from './interfaces/models';
import { AppService } from './app.service';
import { Subscription } from 'rxjs';

@WebSocketGateway(8080)
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private store: AppService) { };
  private users: AuthenticatedUser[];
  private rooms: Rooms;
  private connections: Connections;
  private subscriptions: Subscription = new Subscription();

  @WebSocketServer()
  server: Server

  async afterInit() {
    this.subscriptions.add(
      this.store.getUsers$().subscribe(
        users => this.users = users
      )
    )
    this.subscriptions.add(
      this.store.getRooms$().subscribe(
        rooms => this.rooms = rooms
      )
    )
    this.subscriptions.add(
      this.store.getConnections$().subscribe(
        connections => this.connections = connections
      )
    )
  }
  async handleConnection() {
    console.log('Socket connected')
  }
  async handleDisconnect() {
    console.log('Socket disconnected')
  }

  @SubscribeMessage(SocketEvents.message)
  handleMessage(
    @MessageBody() data: SocketPayload,
    @ConnectedSocket() client: Socket): SocketPayload {
    console.log('Data from Client: ', data)
    const { type } = data

    switch (type) {
      case RequestType.authenticate: {
        // TODO: Add user checker;
        const { login, name } = data.payload as User
        console.log('Auth message! ', type)
        const authenticatedUser = this.store.authUser({ login, name }, client)
        client.emit(SocketEvents.heartbeat)
        this.server.emit(SocketEvents.message, { type: RequestType.users, payload: this.users })
        return {
          type,
          payload: {
            user: authenticatedUser
          }
        }
      }
      case RequestType.users: {
        return {
          type,
          payload: {
            users: this.users
          }
        };
      }
      case RequestType.rooms: {
        return {
          type,
          payload: {
            rooms: this.rooms
          }
        };
      }
      case RequestType.call: {
        const { id } = data.payload;
        console.log('Make call to = ', id)
        const callee = this.connections[id]
        if (!callee) {
          return {
            type,
            payload: {
              error: `User isn't online!`
            }
          }
        }
        callee.socket.emit(SocketEvents.message, { type: RequestType.call, payload: { id } })
        break
      }
      // case RequestType.join: {
      //   const { id } = data;
      //   console.log('Join to ', id)
      //   return [SocketEvents.message, { type: RequestType.join }]
      // }
      // case RequestType.leave: {
      //   const { id } = data;
      //   console.log('Join to ', id)
      //   return [SocketEvents.message, { type: RequestType.leave }]
      // }
      default:
        throw new Error(`Unexpected request type: ${type}`)
    }
  }
  @SubscribeMessage(SocketEvents.heartbeat)
  hearbeat(client: Socket, payload: any): void {
    console.log('HeartBeat = ', payload)
    setTimeout(() => client.emit(SocketEvents.heartbeat), 20000);
  }
  // @SubscribeMessage('logout')
  // logout(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
  // @SubscribeMessage('joinRoom')
  // joinRoom(client: any, payload: any): string {
  //   return 'Hello world!';
  // }
  // @SubscribeMessage('leaveRoom')
  // leaveRoom(client: any, payload: any): string {
  //   return 'Hello world!';
  // }

}
