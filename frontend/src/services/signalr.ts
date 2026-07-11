import { HubConnection, HubConnectionBuilder, HttpTransportType, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;
const listeners = new Map<string, Set<(data: any) => void>>();

export const signalRService = {
  startConnection: () => {
    if (connection) return;

    const token = localStorage.getItem('sigecosem_token') || '';
    
    connection = new HubConnectionBuilder()
      .withUrl('/notificationHub', {
        accessTokenFactory: () => token,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('GpsUpdated', (data) => {
      triggerEvent('GpsUpdated', data);
    });

    connection.on('NewAlert', (data) => {
      triggerEvent('NewAlert', data);
    });

    connection.start()
      .then(() => console.log('SignalR connection established successfully.'))
      .catch((err) => console.warn('SignalR connection failed. Retrying...', err));
  },

  stopConnection: () => {
    if (connection) {
      connection.stop();
      connection = null;
    }
  },

  on: (event: string, callback: (data: any) => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)?.add(callback);
  },

  off: (event: string, callback: (data: any) => void) => {
    listeners.get(event)?.delete(callback);
  }
};

function triggerEvent(event: string, data: any) {
  const callbacks = listeners.get(event);
  if (callbacks) {
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in SignalR listener for event ${event}:`, err);
      }
    });
  }
}
