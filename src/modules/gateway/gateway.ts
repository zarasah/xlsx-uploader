import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { RowDto } from "../import/dto/row.dto";
import { Server, Socket } from 'socket.io';
import { OnEvent } from "@nestjs/event-emitter";

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})

export class Gateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected: ', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected: ', client.id);
  }

  @OnEvent('rowCreated')
  onRowCreated(row: RowDto) {
    this.server.emit('rowCreated', row);
  }
}